const {chromium}=require('../../../node_modules/@playwright/test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {mkdtempSync}=require('node:fs');
const {join}=require('node:path');
const dir=mkdtempSync('/tmp/clipsplat-long-feed-');
const origin=process.env.CLIPSPLAT_ORIGIN||'http://127.0.0.1:4186';
const fixture=seconds=>{const file=join(dir,seconds+'.mp4');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',`color=blue:s=32x32:r=1:d=${seconds}`,'-c:v','libx264','-y',file]);return file;};
const twenty=fixture(1200),sixty=fixture(3600);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 try{
 const page=await browser.newPage({acceptDownloads:true,permissions:['camera','microphone']});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.recordOffset=0;const now=performance.now.bind(performance);performance.now=()=>now()+window.recordOffset;const Native=MediaRecorder;window.MediaRecorder=class extends Native{constructor(stream,opts){super(stream,opts);window.lastRecorder=this;window.recordOptions=opts;}};});
 await page.goto(origin+'/solutions/clipsplat/');
 await page.locator('#file').setInputFiles(twenty);await page.waitForFunction(()=>!document.getElementById('export').disabled);
 assert.equal(Number(await page.locator('#end').inputValue()),174);
 await page.locator('#preset').selectOption('feed');await page.waitForFunction(()=>Number(document.getElementById('end').value)===1200);
 assert.equal(await page.locator('#export').isDisabled(),false);await page.locator('#long-video-note').waitFor();
 await page.locator('#file').setInputFiles(sixty);await page.waitForFunction(()=>Number(document.getElementById('end').value)===3594);
 await page.locator('#end').fill('3595');assert.ok(await page.locator('#export').isDisabled());
 await page.locator('#end').fill('181');assert.equal(await page.locator('#export').isDisabled(),false);
 await page.locator('#preset').selectOption('reel');assert.ok(await page.locator('#export').isDisabled());assert.equal(await page.locator('#end').inputValue(),'181');
 await page.locator('#preset').selectOption('feed');await page.locator('#export').click();
 await page.waitForFunction(()=>document.getElementById('download').style.display==='inline-block',null,{timeout:180000});
 const downloading=page.waitForEvent('download');await page.locator('#download').click();const output=join(dir,'feed.mp4');await(await downloading).saveAs(output);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',output]));assert.ok(Math.abs(Number(probe.format.duration)-187)<.15);const v=probe.streams.find(s=>s.codec_type==='video');assert.equal(v.width,1080);assert.equal(v.height,1350);assert.equal(v.codec_name,'h264');assert.equal(v.r_frame_rate,'30/1');
 await page.locator('#camera').click();await page.waitForFunction(()=>!document.getElementById('record').disabled);await page.locator('#record').click();
 assert.equal(await page.evaluate(()=>window.recordOptions.videoBitsPerSecond),1500000);
 await page.evaluate(()=>window.recordOffset=190000);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.lastRecorder.state),'recording');
 await page.evaluate(()=>window.recordOffset=1200000);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.lastRecorder.state),'recording');
 await page.evaluate(()=>window.recordOffset=3600000);await page.waitForFunction(()=>window.lastRecorder.state==='inactive');
 assert.deepEqual(errors,[]);console.log('PASS: 20/60-minute imports, panel-inclusive limits, format switch/preserved trims, >3-minute Feed MP4, recording timer beyond 20 minutes and stop at 60 minutes (accelerated clock)',dir);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
