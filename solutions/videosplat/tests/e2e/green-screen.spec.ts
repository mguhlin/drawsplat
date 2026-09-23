import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({page}) => { await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen','1')); });
async function loadScene(page: Page) {
  await page.goto('./');
  await page.evaluate(async () => {
    const audio = new AudioContext(); await audio.resume(); const destination=audio.createMediaStreamDestination(), oscillator=audio.createOscillator(); oscillator.connect(destination); oscillator.start();
    const recordings = [false,true].map(fg => {
      const canvas=document.createElement('canvas'); canvas.width=160;canvas.height=90;const ctx=canvas.getContext('2d')!;
      const started=performance.now();const draw=()=>{ctx.fillStyle=fg?'#00ff00':'#0000ff';ctx.fillRect(0,0,160,90);if(fg){ctx.fillStyle=performance.now()-started>900?'#ffff00':'#ff0000';ctx.fillRect(60,15,40,75);}};
      draw();const stream=canvas.captureStream(15);if(fg)destination.stream.getTracks().forEach(t=>stream.addTrack(t));
      const recorder=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks:Blob[]=[];recorder.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise<Blob>(r=>recorder.onstop=()=>r(new Blob(chunks,{type:'video/webm'})));recorder.start();const timer=setInterval(draw,60);
      return {recorder,stopped,stream,timer};
    });
    await new Promise(r=>setTimeout(r,2100));recordings.forEach(r=>{r.recorder.stop();clearInterval(r.timer)});const blobs=await Promise.all(recordings.map(r=>r.stopped));recordings.forEach(r=>r.stream.getTracks().forEach(t=>t.stop()));oscillator.stop();await audio.close();
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('videosplat-local',2);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('projects'))r.result.createObjectStore('projects',{keyPath:'id'});if(!r.result.objectStoreNames.contains('media'))r.result.createObjectStore('media')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction('media','readwrite');blobs.forEach((b,i)=>tx.objectStore('media').put(b,i?'fg':'bg'));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close();
  });
  const now=new Date().toISOString();
  const project={schema:'videosplat-project',version:2,id:'chroma-test',name:'Green screen test',createdAt:now,updatedAt:now,canvas:{width:320,height:180,frameRate:15,background:'#000000'},settings:{proxyMode:'never',localOnly:true},assets:['bg','fg'].map(id=>({id,name:id+'.webm',kind:'video',mimeType:'video/webm',size:1000,duration:2,width:160,height:90,storedLocally:true})),tracks:['bg','fg'].map(id=>({id,name:id,kind:'video',hidden:false,locked:false,muted:false,clips:[{id,assetId:id,name:id,start:0,duration:1.5,sourceStart:0,kind:'video',properties:{}}]}))};
  await page.locator('input[accept=".json,.videosplat.json,application/json"]').setInputFiles({name:'scene.videosplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});
  await expect(page.locator('.timeline-clip.video')).toHaveCount(2);
  await page.locator('.timeline-clip.video').filter({hasText:'fg'}).click();
  await page.getByLabel('Remove green / blue screen',{exact:true}).check();
  await expect(page.getByLabel('Green screen preview')).toBeVisible();
  await expect.poll(()=>page.getByLabel('Green screen preview').evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(10,10,1,1).data[3])).toBe(0);
}
test('video key previews, persists and exports background video with foreground audio',async({page},info)=>{
  test.setTimeout(60000);await loadScene(page);
  await expect.poll(() => page.locator('.visual-layer > video').first().evaluate(v => { const media=v.getBoundingClientRect(), layer=v.parentElement!.getBoundingClientRect(), stage=v.closest('.canvas')!.getBoundingClientRect(); return Math.abs(media.width-layer.width)<2 && Math.abs(media.height-layer.height)<2 && layer.height<=stage.height+2; })).toBe(true);
  await page.screenshot({path:info.outputPath("green-screen-preview.png")});
  const save=page.waitForEvent('download');await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'Save project copy'}).click();const projectDownload=await save;const saved=JSON.parse(await readFile((await projectDownload.path())!, 'utf8'));  
  expect(saved.tracks[1].clips[0].properties.chromaEnabled).toBe(true);
  await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'Export video…'}).click();
  await page.getByLabel('Export width').fill('320');await page.getByLabel('Export height').fill('180');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Render local WebM'}).click();const file=await pending;const path=info.outputPath('green-screen.webm');await file.saveAs(path);
  const bytes=[...await readFile(path)];
  const result=await page.evaluate(async bytes=>{
    const buffer=new Uint8Array(bytes),url=URL.createObjectURL(new Blob([buffer],{type:'video/webm'})),video=document.createElement('video');video.muted=true;video.src=url;document.body.append(video);
    await new Promise<void>((r,j)=>{video.onloadeddata=()=>r();video.onerror=()=>j(new Error('decode'));});
    // Firefox can fire seeked before a paused frame is presented. Inspect a presented frame.
    const present = (time: number) => new Promise<void>((resolve,reject) => {
      const timer=setTimeout(()=>reject(new Error('Frame was not presented')),5000);
      const frame: VideoFrameRequestCallback = (_now, metadata) => {
        if(metadata.mediaTime < time-.02) { video.requestVideoFrameCallback(frame); return; }
        clearTimeout(timer);video.pause();resolve();
      };
      video.currentTime=time;video.requestVideoFrameCallback(frame);void video.play().catch(reject);
    });
    await present(.5);
    const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;const x=canvas.getContext('2d')!;x.drawImage(video,0,0);const left=[...x.getImageData(10,10,1,1).data],center=[...x.getImageData(canvas.width/2,canvas.height/2,1,1).data];
    await present(1.2);x.drawImage(video,0,0);const later=[...x.getImageData(canvas.width/2,canvas.height/2,1,1).data];
    const audio=new AudioContext();const decoded=await audio.decodeAudioData(buffer.buffer);const samples=decoded.getChannelData(0);let sum=0;for(const n of samples)sum+=n*n;await audio.close();video.remove();URL.revokeObjectURL(url);return{left,center,later,rms:Math.sqrt(sum/samples.length),duration:decoded.duration};
  },bytes);
  expect(result.left[2]).toBeGreaterThan(200);expect(result.left[1]).toBeLessThan(40);expect(result.center[0]).toBeGreaterThan(200);expect(result.center[1]).toBeLessThan(40);expect(result.later[0]).toBeGreaterThan(200);expect(result.later[1]).toBeGreaterThan(200);expect(result.rms).toBeGreaterThan(.01);expect(result.duration).toBeGreaterThan(1);
});

test('camera green screen records the keyed pixels without loading segmentation',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{const c=document.createElement('canvas');c.width=320;c.height=180;const x=c.getContext('2d')!;const draw=()=>{x.fillStyle='#00ff00';x.fillRect(0,0,320,180);x.fillStyle='#ff0000';x.fillRect(120,30,80,150)};draw();const stream=c.captureStream(15),timer=setInterval(draw,60);const t=stream.getVideoTracks()[0],stop=t.stop.bind(t);t.stop=()=>{clearInterval(timer);stop()};return stream;}})});
  const requests:string[]=[];page.on('request',r=>requests.push(r.url()));await page.goto('./');await page.getByRole('button',{name:'Record video',exact:true}).click();await page.getByLabel('Recording source').selectOption('camera');await page.getByRole('checkbox',{name:'Microphone',exact:true}).uncheck();await page.getByLabel('Remove green / blue screen',{exact:true}).check();const bg=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=320;c.height=180;const x=c.getContext('2d')!;x.fillStyle='#0000ff';x.fillRect(0,0,320,180);return c.toDataURL().split(',')[1]});await page.getByLabel('Virtual background image').setInputFiles({name:'blue.png',mimeType:'image/png',buffer:Buffer.from(bg,'base64')});await page.getByLabel('Recording countdown').selectOption('0');await page.getByRole('button',{name:'Start recording',exact:true}).click();await expect(page.getByRole('button',{name:'Stop and choose crop'})).toBeVisible();
  await page.waitForTimeout(1100);await page.getByRole('button',{name:'Stop and choose crop'}).click();const video=page.getByLabel('Recorded screen crop preview');await expect(video).toBeVisible();
  const pixels=await video.evaluate(async(v:HTMLVideoElement)=>{if(v.readyState<2)await new Promise(r=>v.onloadeddata=r);await new Promise<void>(r=>{v.onseeked=()=>r();v.currentTime=.4});const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d')!;x.drawImage(v,0,0);return {left:[...x.getImageData(10,10,1,1).data],center:[...x.getImageData(c.width/2,c.height/2,1,1).data]}});
  expect(pixels.left[2]).toBeGreaterThan(200);expect(pixels.left[1]).toBeLessThan(40);expect(pixels.center[0]).toBeGreaterThan(200);expect(requests.some(url=>url.includes('selfie_segmenter'))).toBe(false);
});
