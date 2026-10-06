const {chromium}=require('../../../node_modules/@playwright/test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {mkdtempSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const origin=process.env.CLIPSPLAT_ORIGIN||'http://127.0.0.1:4186';
const artifacts=mkdtempSync(join(tmpdir(),'clipsplat-illustrated-'));
const photo=join(artifacts,'photo.png');
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=yellow:s=320x180','-frames:v','1','-threads','1','-y',photo]);
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  try{
    const p=await b.newPage({viewport:{width:1226,height:970}}),requests=[],errors=[];
    p.on('request',r=>{if(/(paint-party|celestial-magic|botanical-garden|scrapbook-memories|sunset-waves|watercolor-bloom|gilded-deco).*\.png/.test(r.url()))requests.push(r.url())});p.on('pageerror',e=>errors.push(e.message));
    await p.goto(origin+'/solutions/clipsplat/');await p.waitForSelector('#intro-frame');assert.equal(requests.length,0,'Illustrated artwork should load only when selected');
    await p.locator('#intro-image').setInputFiles(photo);await p.waitForFunction(()=>!document.getElementById('intro-choose-image').disabled);
    await p.locator('#creator').fill('Miguel Guhlin');
    const capture=(preset)=>p.locator('#canvas').evaluate(async (canvas,preset)=>{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const c=canvas.getContext('2d');
      const data=c.getImageData(Math.ceil(canvas.width*.26),Math.ceil(canvas.height*.20),Math.floor(canvas.width*.48)-1,Math.floor(canvas.height*.55)-1).data;
      if(window.frameContentPreset!==preset){window.frameContentPreset=preset;window.frameContentReference=data;}
      let maxDifference=0;for(let i=0;i<data.length;i++)maxDifference=Math.max(maxDifference,Math.abs(data[i]-window.frameContentReference[i]));
      return {maxDifference,photo:[...c.getImageData(canvas.width*.5,canvas.height*.32,1,1).data].slice(0,3),background:[...c.getImageData(canvas.width*.5,canvas.height*.76,1,1).data].slice(0,3)};
    },preset);
    for(const preset of ['reel','feed']){
      await p.locator('#preset').selectOption(preset);
      for(const style of ['paint-party','celestial','botanical','scrapbook','sunset','watercolor','deco']){
        await p.locator('#intro-frame').selectOption(style);await p.waitForFunction(()=>!document.getElementById('intro-frame').disabled);
        assert.equal(await p.locator('#intro-frame').inputValue(),style);
        const shot=await capture(preset);assert.ok(shot.photo[0]>230&&shot.photo[1]>230&&shot.photo[2]<20);
        assert.deepEqual(shot.background,[71,32,164],'Transparent center preserves the chosen background');
        assert.ok(shot.maxDifference<=12,`Frame artwork must stay outside the content area (difference ${shot.maxDifference})`);
        await p.locator('#canvas').screenshot({path:join(artifacts,`${preset}-${style}.png`)});
      }
      await p.locator('#outro-frame').selectOption('paint-party');await p.waitForFunction(()=>!document.getElementById('outro-frame').disabled);assert.equal(await p.locator('#intro-frame').inputValue(),'deco');
    }
    assert.equal(new Set(requests).size,7);assert.equal(requests.length,7,'Cached illustration choices should not redownload');
    await p.locator('#language').selectOption('es');assert.equal(await p.locator('#intro-frame option[value=celestial]').textContent(),'Magia celestial · ilustrado');
    assert.equal(await p.locator('#intro-frame').inputValue(),'deco');
    await p.setViewportSize({width:390,height:844});await p.locator('#language').selectOption('ar');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
    console.log(`PASS: seven illustrated frames, alpha/content protection, Reel/feed, independent pickers, lazy loading/cache, translations/mobile; ${origin}; artifacts ${artifacts}`);
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
