const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const manifest = require('../data/privacy-inventory.json');
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('drawsplat.consent.accepted','1'));});
const seeded = async page => {
  await page.goto('/privacy/');
  await page.evaluate(async () => {
    localStorage.setItem('student.draft',JSON.stringify({name:'Synthetic learner',text:'Keep my work',apiKey:'fake-key'}));
    localStorage.setItem('provider.apiKey','fake-secret');
    await new Promise((resolve,reject)=>{
      const r=indexedDB.open('privacy-test',1);r.onupgradeneeded=()=>r.result.createObjectStore('media');r.onerror=()=>reject(r.error);
      r.onsuccess=()=>{const db=r.result,tx=db.transaction('media','readwrite');tx.objectStore('media').put({caption:'Synthetic recording',data:new Blob(['test audio'],{type:'audio/wav'})},'clip');tx.oncomplete=()=>{db.close();resolve();};};
    });
  });
};
test('privacy export includes drafts and binary database media and redacts credentials',async({page})=>{
  await seeded(page);
  const download=page.waitForEvent('download');await page.locator('#export').click();
  const saved=await download,data=JSON.parse(fs.readFileSync(await saved.path(),'utf8'));
  expect(JSON.parse(data.localStorage['student.draft']).text).toBe('Keep my work');
  expect(JSON.parse(data.localStorage['student.draft']).apiKey).toBe('[redacted]');
  expect(data.localStorage['provider.apiKey']).toBeUndefined();
  expect(data.databases['privacy-test'].media.values[0].data.base64).toBe('dGVzdCBhdWRpbw==');
  await expect(page.locator('#status')).toContainText('downloaded');
});
test('clear requires confirmation and deletes local storage, databases and caches',async({page})=>{
  await seeded(page);await page.evaluate(()=>caches.open('privacy-cache').then(c=>c.put('/synthetic',new Response('private'))));
  await page.locator('#clear').click();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  expect(await page.evaluate(()=>localStorage.getItem('student.draft'))).not.toBeNull();
  await page.locator('#clear').click();await page.getByRole('button',{name:'Delete saved browser data',exact:true}).click();
  await expect(page.locator('#status')).toContainText('Cleared this domain');
  expect(await page.evaluate(()=>localStorage.getItem('student.draft'))).toBeNull();
  expect(await page.evaluate(()=>indexedDB.databases())).toEqual([]);
  expect(await page.evaluate(()=>caches.keys())).toEqual([]);
});
test('an open database blocks clearing and does not report success',async({page,context})=>{
  await seeded(page);const other=await context.newPage();await other.goto('/privacy/');
  await other.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('privacy-test');r.onsuccess=()=>{window.held=r.result;resolve();};}));
  await page.locator('#clear').click();await page.getByRole('button',{name:'Delete saved browser data',exact:true}).click();
  await expect(page.locator('#status')).toContainText('Close other SplatWorks tabs');
  expect(await page.evaluate(()=>localStorage.getItem('student.draft'))).not.toBeNull();
  await other.close();
});
test('upgrade preserves existing drafts; explicit expiry clears on next visit',async({page})=>{
  await seeded(page);expect(await page.evaluate(()=>SplatPrivacy.getState().expiryEnabled)).toBe(false);
  await page.reload();expect(await page.evaluate(()=>localStorage.getItem('student.draft'))).not.toBeNull();
  await page.locator('#days').selectOption('1');await page.locator('#renew').click();
  expect(await page.evaluate(()=>SplatPrivacy.getState().expiryEnabled)).toBe(true);
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('splatworks.privacy.v1'));s.expiresAt=Date.now()-1;localStorage.setItem('splatworks.privacy.v1',JSON.stringify(s));});
  await page.goto('/solutions/brain-sort/');await expect(page).toHaveURL(/\/privacy\/\?expired=1/);
  await expect(page.locator('#status')).toContainText('Expired browser data cleared');
  expect(await page.evaluate(()=>localStorage.getItem('student.draft'))).toBeNull();
});
for(const slug of ['brain-sort','clock-wizard','step-splat','toneshifter','vibe-check']) {
 test(`${slug}: AI key remains in memory, original workflow remains available`,async({page})=>{
  await page.goto('/solutions/'+slug+'/');
  await page.locator('#settingsBtn').click();await page.locator('#apiKeyInput').fill('synthetic-test-key');
  await page.locator('#saveSettingsBtn').click();
  expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).not.toContain('synthetic-test-key');
  // The key stays available in the existing settings UI until reload.
  await page.locator('#settingsBtn').click();await expect(page.locator('#apiKeyInput')).toHaveValue('synthetic-test-key');
  await page.reload();await page.locator('#settingsBtn').click();await expect(page.locator('#apiKeyInput')).toHaveValue('');
 });
}
test('AI transmission waits for explicit approval; cancellation sends no request',async({page})=>{
  let requests=0;await page.route('https://api.openai.com/**',async route=>{requests++;await route.fulfill({status:200,body:'{"ok":true}',contentType:'application/json'});});
  await page.goto('/privacy/');
  await page.evaluate(()=>{window.result=fetch('https://api.openai.com/v1/chat/completions',{method:'POST',body:'synthetic'}).then(r=>r.json()).catch(e=>({error:e.message}));});
  await expect(page.getByRole('dialog')).toBeVisible();expect(requests).toBe(0);
  await page.getByRole('button',{name:'Use local processing'}).click();
  expect((await page.evaluate(()=>window.result)).error).toContain('External AI');expect(requests).toBe(0);
  await page.evaluate(()=>{window.result=fetch('https://api.openai.com/v1/chat/completions',{method:'POST',body:'synthetic'}).then(r=>r.json());});
  await page.getByRole('dialog').getByRole('checkbox').check();await page.getByRole('button',{name:'Allow AI for this tab'}).click();
  expect(await page.evaluate(()=>window.result)).toEqual({ok:true});expect(requests).toBe(1);
});
test('optional connection opt-out blocks external requests and preserves local reads',async({page})=>{
  await page.goto('/privacy/');await page.locator('#connections').uncheck();
  const r=await page.evaluate(async()=>({external:await fetch('https://example.test/upload',{method:'POST',body:'synthetic'}).then(()=>false,()=>true),local:(await fetch('/data/privacy-retention.json')).ok}));
  expect(r).toEqual({external:true,local:true});
});
test('review stays unscored until evidence is entered, then exports actual selected scores',async({page})=>{
 await page.goto('/legal/protect-review.html');await expect(page.locator('#score-total')).toHaveText('No score recorded.');
 await page.getByText('Record and download a deployment review',{exact:true}).click();
 await page.locator('[name=deployment]').fill('Synthetic school review');
 for(let i=0;i<7;i++){await page.locator(`[name=score${i}]`).selectOption(i===4?'1':'2');await page.locator(`[name=evidence${i}]`).fill('Synthetic verified evidence');}
 await expect(page.locator('#score-total')).toHaveText('13/14');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download evidence-based review'}).click();
 const data=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));expect(data.total).toBe(13);expect(data.categories[4].score).toBe(1);
});
test('every registered local entry ships the shared controls and readable inventory',async()=>{
 expect(manifest.components.length).toBeGreaterThan(50);
 for(const c of manifest.components){const s=fs.readFileSync(c.entry,'utf8');expect(s,c.entry).toContain('js/privacy-controls.js');expect(s,c.entry).toContain('css/privacy-controls.css');}
});
test('privacy center fits a phone and is keyboard accessible',async({page})=>{
 await page.setViewportSize({width:380,height:820});await page.goto('/privacy/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(380);
 await page.locator('#clear').focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
});

for(const [slug,input,button] of [['brain-sort','dumpInput','sortBtn'],['clock-wizard','taskInput','estimateBtn'],['step-splat','taskInput','splatBtn'],['toneshifter','srcInput','shiftBtn'],['vibe-check','srcInput','checkBtn']]) {
 test(`${slug}: local processing remains usable without network approval`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));let aiCalls=0;
  await page.route(/https:\/\/api\.(openai|anthropic)\.com\//,route=>{aiCalls++;route.abort();});
  await page.goto('/solutions/'+slug+'/');await page.locator('#'+input).fill('Write a clear plan for a science report.');
  await page.locator('#'+button).click();await expect(page.locator('#'+button)).toBeEnabled();
  await expect(page.locator('#stageFooter')).toBeVisible();await expect(page.locator('#stageBody')).not.toBeEmpty();
  expect(aiCalls).toBe(0);expect(errors).toEqual([]);
 });
}
