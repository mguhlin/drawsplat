const {chromium}=require('../../../node_modules/@playwright/test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {mkdtempSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const origin=process.env.CLIPSPLAT_ORIGIN||'http://127.0.0.1:4186';
const artifacts=mkdtempSync(join(tmpdir(),'clipsplat-frames-'));
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  try{
    const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto(origin+'/solutions/clipsplat/');await p.waitForSelector('#intro-frame');
    const capture=()=>p.locator('#canvas').evaluate(async canvas=>{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const c=canvas.getContext('2d');
      const content=c.getImageData(canvas.width*.12,canvas.height*.14,canvas.width*.68,canvas.height*.66).data;
      const center=[...new Uint8Array(await crypto.subtle.digest('SHA-256',content))].map(n=>n.toString(16).padStart(2,'0')).join('');
      return {png:canvas.toDataURL(),center,corner:[...c.getImageData(20,20,1,1).data].slice(0,3)};
    });
    for(const preset of ['reel','feed']){
      await p.locator('#preset').selectOption(preset);
      await p.locator('#intro-frame').selectOption('none');const plain=await capture();
      const hashes=new Set();
      for(const style of ['none','confetti','stars','splat','film']){
        await p.locator('#intro-frame').selectOption(style);const shot=await capture();
        assert.deepEqual(shot.center,plain.center,'Frame must not cover title/image content');
        hashes.add(createHash('sha256').update(shot.png).digest('hex'));
        await p.locator('#canvas').screenshot({path:join(artifacts,`${preset}-${style}.png`)});
        if(style==='film')assert.deepEqual(shot.corner,[23,32,51]);
      }
      assert.equal(hashes.size,5,'All five frame styles must look different');
      await p.locator('#intro-frame').selectOption('confetti');const first=(await capture()).png;
      await p.locator('#show-opening').click();assert.equal((await capture()).png,first,'Preview/export decorations must be deterministic');
      await p.locator('#outro-frame').selectOption('stars');
      assert.equal(await p.locator('#intro-frame').inputValue(),'confetti');
      await p.locator('#language').selectOption('es');
      assert.equal(await p.locator('#outro-frame').inputValue(),'stars');
      assert.equal(await p.locator('#intro-frame option[value=confetti]').textContent(),'Confeti de fiesta');
      await p.locator('#language').selectOption('en');
      await p.locator('#color').fill('#ffffff');const light=await capture();
      assert.notEqual(light.png,plain.png);
      await p.locator('#color').fill('#4720a4');
    }
    await p.setViewportSize({width:390,height:844});await p.locator('#language').selectOption('ar');
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
    console.log(`PASS: five distinct frames, Reel/feed, clear content area, deterministic drawing, independent choices, translations, light backgrounds/mobile; ${origin}; artifacts ${artifacts}`);
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
