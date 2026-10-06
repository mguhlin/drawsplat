const {chromium}=require('../../../node_modules/@playwright/test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {mkdtempSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const origin=process.env.CLIPSPLAT_ORIGIN||'http://127.0.0.1:4186';
const illustrated=process.env.CLIPSPLAT_ILLUSTRATED==='1';
const firstFrame=process.env.CLIPSPLAT_FIRST_FRAME||(illustrated?'celestial':'film'),secondFrame=process.env.CLIPSPLAT_SECOND_FRAME||(illustrated?'botanical':'film');
const artifacts=mkdtempSync(join(tmpdir(),'clipsplat-cards-'));
const source=join(artifacts,'video.mp4');
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=320x240:r=30:d=2','-f','lavfi','-i','color=c=lime:s=320x240:r=30:d=2','-f','lavfi','-i','color=c=blue:s=320x240:r=30:d=2','-f','lavfi','-i',"aevalsrc='0.2*sin(2*PI*if(lt(t,2),440,if(lt(t,4),880,1320))*t)':s=48000:d=6",'-filter_complex','[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]','-map','[v]','-map','3:a','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-y',source]);
const files=['yellow','cyan','pink'].map(color=>{
  const path=join(artifacts,color+'.png');
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',`color=c=${color}:s=320x180`,'-frames:v','1','-threads','1','-y',path]);return path;
});
function rgb(file,t,x=540,y=960){return [...execFileSync('ffmpeg',['-v','error','-ss',String(t),'-i',file,'-vf',`crop=2:2:${x}:${y}`,'-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-']).subarray(0,3)];}
function near(actual,expected){assert.ok(expected.every((n,i)=>Math.abs(n-actual[i])<20),`${actual} != ${expected}`);}
function audio(file,t){
  const data=execFileSync('ffmpeg',['-v','error','-ss',String(t),'-i',file,'-t','0.25','-vn','-ac','1','-ar','48000','-f','s16le','-']);let crossings=0,sum=0;
  for(let i=0;i<data.length;i+=2){const v=data.readInt16LE(i);sum+=(v/32768)**2;if(i&&((v>=0)!==(data.readInt16LE(i-2)>=0)))crossings++;}
  return {tone:crossings/2/(data.length/2/48000),rms:Math.sqrt(sum/(data.length/2))};
}
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  try{
    const p=await b.newPage({acceptDownloads:true,viewport:{width:1226,height:970}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto(origin+'/solutions/clipsplat/');await p.waitForSelector("#settings",{state:"attached"});await p.locator(".workflow-step").evaluateAll(nodes=>nodes.forEach(node=>node.open=true));await p.waitForSelector('#add-image-cards');
    await p.locator('#intro-duration').fill('1');await p.locator('#outro-duration').fill('1');
    await p.locator('#file').setInputFiles(source);await p.waitForFunction(()=>!document.getElementById('export').disabled);
    await p.locator('#image-cards-file').setInputFiles(files);await p.waitForFunction(()=>document.querySelectorAll('.extra-image-card').length===3&&!document.getElementById('add-image-cards').disabled);
    const one=p.locator('.extra-image-card').nth(0),two=p.locator('.extra-image-card').nth(1);
    for(const [card,position,title] of [[one,1,'First image'],[two,5,'Second image']]){
      await card.locator('[data-field=title]').fill(title);await card.locator('[data-field=seconds]').fill('1');await card.locator('[data-field=at]').fill(String(position));
    }
    await p.locator('.extra-image-card').nth(2).locator('[data-action=remove]').click();assert.equal(await p.locator('.extra-image-card').count(),2);
    await one.locator('[data-field=frame]').selectOption(firstFrame);await p.waitForFunction(()=>!document.getElementById('add-image-cards').disabled);await two.locator('[data-field=frame]').selectOption(secondFrame);await p.waitForFunction(()=>!document.getElementById('add-image-cards').disabled);
    await one.locator('[data-field=image]').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('broken')});
    await p.waitForFunction(()=>document.getElementById('status').textContent.includes('could not be opened'));
    assert.equal(await one.locator('.card-filename').textContent(),'yellow.png');
    await one.locator('[data-field=image]').setInputFiles(files[2]);await p.waitForFunction(()=>document.querySelector('.card-filename').textContent==='pink.png');
    await one.locator('[data-field=image]').setInputFiles(files[0]);await p.waitForFunction(()=>document.querySelector('.card-filename').textContent==='yellow.png'&&!document.getElementById('add-image-cards').disabled);
    await p.locator('#selection-start').fill('2');await p.locator('#selection-end').fill('4');await p.locator('#timeline-delete').click();
    assert.equal(Number(await two.locator('[data-field=at]').inputValue()),3);
    assert.match(await p.locator('#summary').textContent(),/2.0s image cards/);
    await p.locator('#timeline-undo').click();assert.equal(Number(await two.locator('[data-field=at]').inputValue()),5);
    await p.locator('#selection-start').fill('2');await p.locator('#selection-end').fill('4');await p.locator('#timeline-delete').click();
    // Cards reorder by position, and 0 seconds skips an item.
    await two.locator('[data-field=at]').fill('0');assert.match(await p.locator('#timeline-sequence-items button').first().textContent(),/card 2/);
    await two.locator('[data-field=at]').fill('3');await two.locator('[data-field=seconds]').fill('0');assert.equal(await p.locator('#timeline-sequence-items button').count(),1);
    await two.locator('[data-field=seconds]').fill('11');assert.ok(await p.locator('#export').isDisabled());
    await two.locator('[data-field=seconds]').fill('1');
    await p.locator('#play').click();
    await p.waitForFunction(()=>{const v=document.querySelector('video.source'),c=document.getElementById('canvas').getContext('2d').getImageData(496,768,1,1).data;return v.paused&&Math.abs(v.currentTime-1)<.12&&c[0]>230&&c[1]>230&&c[2]<30;},{},{timeout:15000});
    await p.waitForFunction(()=>{const v=document.querySelector('video.source'),c=document.getElementById('canvas').getContext('2d').getImageData(496,768,1,1).data;return v.paused&&Math.abs(v.currentTime-5)<.12&&c[0]<30&&c[1]>230&&c[2]>230;},{},{timeout:15000});
    await p.waitForFunction(()=>{const v=document.querySelector('video.source');return !v.paused&&v.currentTime>5.15;});await p.locator('#play').click();
    await one.locator('[data-action=preview]').click();
    const framePixel=await p.locator('#canvas').evaluate(async canvas=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return [...canvas.getContext('2d').getImageData(108,134,1,1).data].slice(0,3);});
    await p.locator('#export').click();assert.ok(await p.locator('#add-image-cards').isDisabled());assert.ok(await one.locator('[data-action=remove]').isDisabled());
    await p.waitForFunction(()=>document.getElementById('download').style.display==='inline-block',{},{timeout:120000});
    const downloaded=p.waitForEvent('download');await p.locator('#download').click();const output=join(artifacts,'cards.mp4');await(await downloaded).saveAs(output);
    const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-of','json',output],{encoding:'utf8'}));assert.ok(Math.abs(Number(meta.format.duration)-8)<.25);
    near(rgb(output,1.5),[254,0,0]);near(rgb(output,2.5,496,768),[255,255,0]);if(!illustrated)near(rgb(output,2.5,20,20),[23,32,51]);near(rgb(output,2.5,108,134),framePixel);near(rgb(output,3.5),[254,0,0]);near(rgb(output,4.5),[0,0,254]);near(rgb(output,5.5,496,768),[0,255,255]);near(rgb(output,6.5),[0,0,254]);
    assert.ok(Math.abs(audio(output,1.5).tone-440)<20);assert.ok(audio(output,2.5).rms<.002);assert.ok(Math.abs(audio(output,4.5).tone-1320)<20);assert.ok(audio(output,5.5).rms<.002);
    await p.locator('#timeline-editor').screenshot({path:join(artifacts,'sequence.png')});
    await p.locator('#language').selectOption('es');assert.equal(await one.locator('[data-field=title]').inputValue(),'First image');assert.equal(await one.locator('[data-field=frame]').inputValue(),firstFrame);assert.equal(await one.locator('[data-action=remove]').textContent(),'Quitar tarjeta');
    await p.setViewportSize({width:390,height:844});await p.locator('#language').selectOption('ar');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await p.screenshot({path:join(artifacts,'mobile-ar.png'),fullPage:true});assert.deepEqual(errors,[]);
    console.log(`PASS: multiple cards, independent controls, placement/cuts/undo/reorder/skip, image replacement/errors/removal, preview pauses/resumes, exported image order and silent audio, frames, mobile/RTL; ${origin}; artifacts ${artifacts}`);
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
