/* Colored footage and distinct tones verify cuts, rather than just output duration. */
const { chromium } = require('../../../node_modules/@playwright/test');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {mkdtempSync} = require('node:fs');
const {join} = require('node:path');
const {tmpdir} = require('node:os');
const origin = process.env.CLIPSPLAT_ORIGIN || 'http://127.0.0.1:4186';
const artifacts = mkdtempSync(join(tmpdir(), 'clipsplat-cuts-'));
const source = join(artifacts, 'three-sections.mp4');
execFileSync('ffmpeg', ['-v','error','-f','lavfi','-i','color=c=red:s=320x240:r=30:d=2','-f','lavfi','-i','color=c=lime:s=320x240:r=30:d=2','-f','lavfi','-i','color=c=blue:s=320x240:r=30:d=2','-f','lavfi','-i',"aevalsrc='0.2*sin(2*PI*if(lt(t,2),440,if(lt(t,4),880,1320))*t)':s=48000:d=6",'-filter_complex','[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]','-map','[v]','-map','3:a','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-y',source]);
const opening = join(artifacts,'opening.png'), closing = join(artifacts,'closing.png');
for(const [file,color] of [[opening,'yellow'],[closing,'cyan']]) execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',`color=c=${color}:s=320x180`,'-frames:v','1','-threads','1','-y',file]);
function rgb(file, time, x=540, y=960) {
  return [...execFileSync('ffmpeg',['-v','error','-ss',String(time),'-i',file,'-vf',`crop=2:2:${x}:${y}`,'-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-']).subarray(0,3)];
}
function near(actual, expected, tolerance=15) {assert.ok(expected.every((n,i)=>Math.abs(actual[i]-n)<tolerance),`${actual} should match ${expected}`);}
function tone(file, time) {
  const data=execFileSync('ffmpeg',['-v','error','-ss',String(time),'-i',file,'-t','0.25','-vn','-ac','1','-ar','48000','-f','s16le','-']);
  let crossings=0;
  for(let i=2;i<data.length;i+=2) if((data.readInt16LE(i)>=0)!==(data.readInt16LE(i-2)>=0))crossings++;
  return crossings/2/(data.length/2/48000);
}
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  try {
    const page=await browser.newPage({acceptDownloads:true,viewport:{width:1226,height:970}});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/solutions/clipsplat/');
    await page.locator('#intro-duration').fill('1'); await page.locator('#outro-duration').fill('1');
    await page.locator('#file').setInputFiles(source);
    await page.waitForFunction(()=>!document.getElementById('export').disabled);
    for(const [kind,file] of [['intro',opening],['outro',closing]]) {
      await page.locator('#'+kind+'-image').setInputFiles(file);
      await page.waitForFunction(kind=>!document.getElementById(kind+'-choose-image').disabled,kind);
    }
    await page.locator('#intro-frame').selectOption('film');
    await page.locator('#outro-frame').selectOption('stars');
    const closingFramePixel = await page.locator('#canvas').evaluate(async canvas=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return [...canvas.getContext('2d').getImageData(30,200,1,1).data].slice(0,3);});
    const select = async(start,end)=>{await page.locator('#selection-start').fill(String(start));await page.locator('#selection-end').fill(String(end));};
    async function drag(from,to,total) {
      await page.locator('#timeline-track').scrollIntoViewIfNeeded();
      const box=await page.locator('#timeline-track').boundingBox();
      await page.mouse.move(box.x+box.width*from/total,box.y+box.height/2);
      await page.mouse.down(); await page.mouse.move(box.x+box.width*to/total,box.y+box.height/2,{steps:10}); await page.mouse.up();
    }
    await drag(2,4,6);
    assert.ok(Math.abs(Number(await page.locator('#selection-start').inputValue())-2)<.02);
    assert.ok(Math.abs(Number(await page.locator('#selection-end').inputValue())-4)<.02);
    await page.locator('#timeline-delete').click();
    assert.equal(await page.locator('.timeline-segment').count(),2);
    assert.match(await page.locator('#summary').textContent(),/4.0s video/);
    await page.locator('#timeline-position').evaluate(input=>{input.value='2.5';input.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForFunction(()=>{const v=document.querySelector('video.source');return !v.seeking&&Math.abs(v.currentTime-4.5)<.05;});
    const preview=await page.locator('#canvas').evaluate(async canvas=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return [...canvas.getContext('2d').getImageData(540,960,1,1).data].slice(0,3);});
    near(preview,[0,0,254]);
    await select(1,3); await page.locator('#timeline-track').focus(); await page.keyboard.press('Delete');
    assert.match(await page.locator('#summary').textContent(),/2.0s video/);
    await page.keyboard.press('Control+z');
    assert.match(await page.locator('#summary').textContent(),/4.0s video/);
    await page.locator('#timeline-reset').click();
    assert.equal(await page.locator('.timeline-segment').count(),1);
    await page.locator('#timeline-undo').click();
    assert.equal(await page.locator('.timeline-segment').count(),2);
    await select(0,4); await page.locator('#timeline-delete').click();
    assert.match(await page.locator('#timeline-selection-summary').textContent(),/one frame/);
    assert.equal(await page.locator('.timeline-segment').count(),2);
    await page.locator('#timeline-track').focus(); await page.keyboard.press('Escape');
    // Preview uses the surviving source ranges, including on repeated playback.
    for(let repeat=0;repeat<2;repeat++) {
      await page.locator('#play').click();
      await page.waitForFunction(()=>{const v=document.querySelector('video.source');return !v.paused&&!v.seeking&&v.currentTime>4.15;},{},{timeout:15000});
      assert.ok((await page.locator('video.source').evaluate(v=>v.currentTime))>=4);
      await page.locator('#play').click();
    }
    await page.locator('#export').click();
    assert.ok(await page.locator('#timeline-delete').isDisabled());
    assert.ok(await page.locator('#timeline-undo').isDisabled());
    await page.waitForFunction(()=>document.getElementById('download').style.display==='inline-block',{},{timeout:120000});
    const download=page.waitForEvent('download'); await page.locator('#download').click();
    const output=join(artifacts,'cut.mp4'); await(await download).saveAs(output);
    const metadata=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output],{encoding:'utf8'}));
    assert.ok(Math.abs(Number(metadata.format.duration)-6)<.2);
    assert.equal(metadata.streams.find(s=>s.codec_type==='video').codec_name,'h264');
    assert.equal(metadata.streams.find(s=>s.codec_type==='audio').codec_name,'aac');
    near(rgb(output,.5,20,20),[23,32,51]);
    near(rgb(output,5.5,30,200),closingFramePixel,20);
    near(rgb(output,.5,496,526),[255,255,0]);
    near(rgb(output,1.5),[254,0,0]);
    near(rgb(output,3.5),[0,0,254]);
    near(rgb(output,5.5,496,526),[0,255,255]);
    assert.ok(Math.abs(tone(output,1.5)-440)<15);
    assert.ok(Math.abs(tone(output,3.5)-1320)<15);
    await page.locator('#timeline-editor').screenshot({path:join(artifacts,'timeline-desktop.png')});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.locator('#language').selectOption('ar');
    assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
    assert.equal(await page.locator('#timeline-delete').textContent(),'حذف التحديد');
    await page.locator('#timeline-editor').screenshot({path:join(artifacts,'timeline-mobile-ar.png')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.locator('#language').selectOption('en');
    // A fresh import resets cuts and undo, without changing panel images.
    await page.locator('#file').setInputFiles(source);
    await page.waitForFunction(()=>!document.getElementById('export').disabled);
    assert.equal(await page.locator('.timeline-segment').count(),1);
    assert.ok(await page.locator('#timeline-undo').isDisabled());
    assert.ok(await page.locator('#intro-image-details').isVisible());
    assert.deepEqual(errors,[]);
    console.log(`PASS: drag/numeric/keyboard cuts, cross-join selection, undo/reset, seek/repeated preview, exported video/audio content and panel images/frames, import reset, mobile/RTL; ${origin}; artifacts ${artifacts}`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
