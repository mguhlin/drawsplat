const {test,expect}=require('@playwright/test');
test('TNT bursts stop promptly, restart without overlap, and respect mute',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('drawsplat.welcomed','1');
    localStorage.setItem('drawsplat.consent.accepted','1');
    localStorage.setItem('drawsplat.lastStartupTipDate',new Date().toISOString().slice(0,10));
    window.blasts=[];
    window.Audio=class {
      constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=1;window.blasts.push(this)}
      play(){this.paused=false;this.plays=(this.plays||0)+1;return Promise.resolve()}
      pause(){this.paused=true}
    };
  });
  await page.goto('/app/whiteboard.html');
  async function detonate(){
    await page.locator('#simpleTntBtn').evaluate(el=>el.click());
    await page.locator('#confirmDialogOk').click();
  }
  const state=()=>page.evaluate(()=>window.blasts.filter(a=>a.src.includes('/explosions/')).map(a=>({paused:a.paused,plays:a.plays,volume:a.volume,currentTime:a.currentTime})));
  await detonate();
  expect((await state())[0].paused).toBe(false);
  await expect.poll(async()=>(await state())[0].paused,{timeout:2500,intervals:[100]}).toBe(true);
  expect((await state())[0].currentTime).toBe(0);
  await detonate();
  await detonate();
  expect(await state()).toHaveLength(1);
  expect((await state())[0].plays).toBe(3);
  await page.locator('#sidebarAudioToggleBtn').click();
  expect((await state())[0].paused).toBe(true);
  await detonate();
  expect((await state())[0].plays).toBe(3);
  await page.locator('#sidebarAudioToggleBtn').click();
  await detonate();
  expect((await state())[0].plays).toBe(4);
  await expect.poll(async()=>(await state())[0].paused,{timeout:2500,intervals:[100]}).toBe(true);
});
