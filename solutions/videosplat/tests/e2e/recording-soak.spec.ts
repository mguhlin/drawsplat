import { test, expect } from '@playwright/test';

test('nine-minute recording retains duration, final frames and audio', async ({ page, browserName }, info) => {
  test.skip(process.env.VIDEOSPLAT_SOAK !== '1', 'Opt-in nine-minute recording audit');
  test.setTimeout(660000);
  await page.addInitScript(() => {
    sessionStorage.setItem('videosplat-splash-seen', '1');
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { value: async () => {
      const c=document.createElement('canvas');c.width=160;c.height=90;const x=c.getContext('2d')!, started=performance.now();
      const paint=()=>{x.fillStyle=performance.now()-started>530000?'#0000ff':'#ff0000';x.fillRect(0,0,160,90);x.fillStyle='#fff';x.fillText(String(Math.floor((performance.now()-started)/1000)),5,15)};
      paint();const stream=c.captureStream(10),timer=setInterval(paint,100);const t=stream.getVideoTracks()[0],stop=t.stop.bind(t);t.stop=()=>{clearInterval(timer);stop()};return stream;
    }});
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
      const a=new AudioContext(),destination=a.createMediaStreamDestination(),oscillator=a.createOscillator();oscillator.connect(destination);oscillator.start();await a.resume();
      const t=destination.stream.getAudioTracks()[0],stop=t.stop.bind(t);t.stop=()=>{oscillator.stop();void a.close();stop()};return destination.stream;
    }});
  });
  await page.goto('./');await page.getByRole('button',{name:'Record video',exact:true}).click();await page.getByLabel('Recording countdown').selectOption('0');await page.getByRole('button',{name:'Start recording',exact:true}).click();await expect(page.getByRole('button',{name:'Stop and choose crop'})).toBeVisible();
  const other=browserName==='chromium'?await page.context().newPage():undefined;if(other){await other.goto('about:blank');await other.bringToFront();}
  for(let minute=1;minute<=9;minute++){await page.waitForTimeout(60000);console.log(`${info.project.name}: recording minute ${minute}/9`);}
  await page.bringToFront();await page.waitForTimeout(1000);await page.getByRole('button',{name:'Stop and choose crop'}).click();await expect(page.getByRole('button',{name:'Use full recording'})).toBeVisible({timeout:20000});
  const result=await page.getByLabel('Recorded screen crop preview').evaluate(async (v:HTMLVideoElement)=>{
    if(v.readyState<2)await new Promise<void>((r,j)=>{v.onloadeddata=()=>r();v.onerror=()=>j(new Error('decode failed'))});
    if(!Number.isFinite(v.duration)){await new Promise<void>(r=>{v.onseeked=()=>r();v.currentTime=1e9});}
    const duration=v.duration;await new Promise<void>(r=>{v.onseeked=()=>r();v.currentTime=Math.max(0,duration-.3)});
    const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d')!;x.drawImage(v,0,0);const final=[...x.getImageData(80,45,1,1).data];
    const blob=await fetch(v.src).then(r=>r.blob()),a=new AudioContext();const audio=await a.decodeAudioData(await blob.arrayBuffer()),samples=audio.getChannelData(0);let sum=0;for(let i=Math.max(0,samples.length-audio.sampleRate);i<samples.length;i++)sum+=samples[i]*samples[i];const audioDuration=audio.duration;await a.close();return{duration,audioDuration,final,finalSecondRms:Math.sqrt(sum/audio.sampleRate),bytes:blob.size};
  });
  console.log(JSON.stringify({browser:info.project.name,...result}));await info.attach('recording-measurements.json',{body:JSON.stringify(result,null,2),contentType:'application/json'});
  expect(result.duration).toBeGreaterThan(535);expect(result.audioDuration).toBeGreaterThan(535);expect(result.final[2]).toBeGreaterThan(200);expect(result.finalSecondRms).toBeGreaterThan(.01);
  // Review alone cannot catch a complete recording becoming a short timeline
  // clip during metadata import. Check the actual editing duration as well.
  await page.getByRole('button', { name: 'Use full recording', exact: true }).click();
  await expect(page.locator('.timeline-clip.video')).toHaveCount(1, { timeout: 20000 });
  const clipDuration = Number(await page.getByLabel('Clip duration', { exact: true }).inputValue());
  console.log(JSON.stringify({browser:info.project.name,clipDuration}));
  expect(clipDuration).toBeGreaterThan(535);
  expect(Math.abs(clipDuration - result.duration)).toBeLessThan(1);
  await other?.close();
});
