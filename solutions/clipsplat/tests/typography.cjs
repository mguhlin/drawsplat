const {chromium}=require('../../../node_modules/@playwright/test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {mkdtempSync}=require('node:fs');
const {join}=require('node:path');
const dir=mkdtempSync('/tmp/clipsplat-text-');
const origin=process.env.CLIPSPLAT_ORIGIN||'http://127.0.0.1:4186';
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=red:s=320x240:d=1','-c:v','libx264','-y',join(dir,'source.mp4')]);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/solutions/clipsplat/');await page.waitForSelector("#settings",{state:"attached"});await page.locator(".workflow-step").evaluateAll(nodes=>nodes.forEach(node=>node.open=true));
 await page.locator('#intro-text').fill('MOVE ME');await page.locator('#creator').fill('Miguel');
 await page.locator('#text-font').selectOption('mono');await page.locator('#text-size').fill('100');
 // Formatting changes affect drawn glyphs, without moving the text box.
 const pixels=()=>page.locator('#canvas').evaluate(async c=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let min=c.width,max=0,count=0;for(let y=600;y<1000;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(d[i]>230&&d[i+1]>230&&d[i+2]>230){min=Math.min(min,x);max=Math.max(max,x);count++;}}return {min,max,count};});
 assert.equal(await page.locator('#text-bold').getAttribute('aria-pressed'),'true');
 const bold=await pixels();await page.locator('#text-bold').click();const regular=await pixels();assert.ok(regular.count<bold.count,'Bold changes glyph weight');
 await page.locator('#text-bold').click();await page.locator('#text-italic').click();assert.equal(await page.locator('#text-italic').getAttribute('aria-pressed'),'true');
 await page.locator('#text-align-center').click();const centered=await pixels();assert.ok(centered.min>bold.min+80,'Center alignment moves glyphs within the box');
 await page.locator('#text-align-right').click();const right=await pixels();assert.ok(right.min>centered.min+80);await page.locator('#text-align-center').click();
 await page.locator('#text-role').selectOption('creator');assert.equal(await page.locator('#text-italic').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#text-bold').getAttribute('aria-pressed'),'false');await page.locator('#text-role').selectOption('title');assert.equal(await page.locator('#text-italic').getAttribute('aria-pressed'),'true');
 const box=page.locator('.text-overlay [data-role=title]');await box.waitFor();
 await box.scrollIntoViewIfNeeded();const before=await box.boundingBox();await page.mouse.move(before.x+20,before.y+20);await page.mouse.down();await page.mouse.move(before.x+20,before.y-160,{steps:10});await page.mouse.up();
 await page.waitForTimeout(150);const after=await box.boundingBox();assert.ok(after.y<before.y-140, JSON.stringify({before,after}));
 await box.press('ArrowRight');await page.waitForTimeout(100);assert.ok((await box.boundingBox()).x>after.x);
 await page.locator('#outro-preview').click();await page.waitForTimeout(100);assert.equal(await page.locator('#text-size').inputValue(),'');
 await page.locator('#intro-preview').click();await page.waitForTimeout(100);assert.equal(await page.locator('#text-size').inputValue(),'100');assert.equal(await page.locator('#text-font').inputValue(),'mono');assert.equal(await page.locator('#text-italic').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#text-align-center').getAttribute('aria-pressed'),'true');
 await page.locator('#clip-preview').click();await page.locator('#language').selectOption('ar');await page.locator('#intro-preview').click();assert.equal(await page.locator('#text-align-center').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#text-italic').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#text-size').inputValue(),'100');await page.locator('#language').selectOption('en');
 await page.locator('#file').setInputFiles(join(dir,'source.mp4'));await page.waitForFunction(()=>!document.getElementById('export').disabled);
 await page.locator('#timeline-panel-end').click();await page.waitForTimeout(100);assert.equal(await page.locator('#text-size').inputValue(),'');
 await page.locator('#timeline-panel-start').focus();await page.locator('#timeline-panel-start').press('Enter');await page.waitForTimeout(100);assert.equal(await page.locator('#text-size').inputValue(),'100');
 await page.locator('#outro-duration').fill('0');await page.locator('#intro-duration').fill('2');
 await page.waitForTimeout(100);
 // Find a white title pixel in the canvas; compare that position in the encoded opening.
 const pixel=await page.evaluate(()=>{const c=document.getElementById('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let y=0;y<1000;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(d[i]>230&&d[i+1]>230&&d[i+2]>230)return {x,y};}throw Error('No title pixel');});
 assert.ok(pixel.y<650);
 await page.locator('#export').click();try { await page.locator('#download').waitFor({state:'visible',timeout:30000}); } catch(e) { throw Error(await page.locator('#status').textContent()); }const downloading=page.waitForEvent('download');await page.locator('#download').click();const download=await downloading;const output=join(dir,'output.mp4');await download.saveAs(output);
 const rgb=execFileSync('ffmpeg',['-v','error','-ss','0.4','-i',output,'-vf',`crop=8:8:${pixel.x}:${pixel.y}`,'-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-']);assert.ok([...rgb].filter(v=>v>210).length>12,'Export contains relocated title');
 await page.locator('#intro-preview').click();await page.locator('#text-reset').click();assert.equal(await page.locator('#text-italic').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#text-align-left').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#text-size').inputValue(),'');
 await page.locator('#language').selectOption('ar');await page.waitForTimeout(100);assert.equal(await page.locator('html').getAttribute('dir'),'rtl');assert.equal(await page.locator('#text-align-right').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#text-bold').getAttribute('aria-label'),'عريض');
 await page.setViewportSize({width:390,height:844});await box.focus();await box.press('ArrowDown');assert.deepEqual(errors,[]);
 console.log('PASS: drag, keyboard, per-text bold/italic/alignment, fonts/sizes, reset, RTL/mobile, actual MP4 placement',dir);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
