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
test('document headers prevent proxy analytics injection without disabling compression for app assets', async () => {
 const rules = [], definedRoutes = [];
 let current;
 for (const line of fs.readFileSync('_headers','utf8').split('\n')) {
  if(line.startsWith('/')){current=line.trim();definedRoutes.push(current);}
  else if(current && /^\s+Cache-Control:.*\bno-transform\b/.test(line))rules.push(current);
 }
 expect(new Set(definedRoutes).size, 'Duplicate Cloudflare routes can discard earlier security headers').toBe(definedRoutes.length);
 const protectedRoute = route => rules.some(pattern => new RegExp('^'+pattern.split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$').test(route));
 for(const entry of [...manifest.components.map(c=>c.entry),'index.html','pages/splatworks.html','wiki/index.html','legal/terms-privacy.html','docs/district-selfhost.html']) {
  expect(protectedRoute('/'+entry),entry).toBe(true);
  const canonical = entry==='index.html' ? '/' : entry.endsWith('/index.html') ? '/'+entry.slice(0,-10) : '/'+entry.slice(0,-5);
  expect(protectedRoute(canonical),canonical).toBe(true);
 }
 for(const asset of ['/assets/js/privacy-controls.js','/splatworks/shared/google-drive.js','/splatworks/gridsplat/assets/index.js','/solutions/audiosplat/assets/runtime.wasm','/solutions/mediasplat/ffmpeg/ffmpeg-core.part-01'])expect(protectedRoute(asset),asset).toBe(false);
});
for (const path of ['/solutions/audiosplat/','/solutions/markdown-studio/','/solutions/memepuzzle/']) {
 test(`${path}: a fresh local workflow does not load optional external resources`,async({page,baseURL})=>{
  const origin=new URL(baseURL).origin;
  const external=[];page.on('request',request=>{const url=new URL(request.url());if(/^https?:$/.test(url.protocol)&&url.origin!==origin)external.push(url.hostname);});
  await page.goto(path);await page.waitForLoadState('networkidle');expect(external).toEqual([]);
  if(path.includes('markdown-studio'))expect(await page.locator('#md-input').inputValue()).toContain(new URL('./sample-image.png',page.url()).href);
  if(path.includes('memepuzzle'))expect(await page.locator('#imageUrl').inputValue()).toBe(new URL('../../kitty.png',page.url()).href);
 });
}
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
  await expect(page.locator('#receipt')).toBeHidden();
  expect(await page.evaluate(()=>localStorage.getItem('student.draft'))).not.toBeNull();
  await other.close();
});

test('privacy export redacts serialized credentials and credential-keyed database records without changing drafts',async({page})=>{
 await seeded(page);
 await page.evaluate(async()=>{
  localStorage.setItem('draft.with.settings',JSON.stringify({lesson:'Keep this lesson',nested:JSON.stringify({authorization:'Bearer nested-secret',text:'Keep nested text'})}));
  await new Promise((resolve,reject)=>{const r=indexedDB.open('privacy-test');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('media','readwrite'),store=tx.objectStore('media');store.put('raw-database-secret','provider.apiKey');store.put(JSON.stringify({settings:JSON.stringify({apiKey:'serialized-secret',lesson:'Keep database text'})}),'serialized');tx.oncomplete=()=>{db.close();resolve();};};});
 });
 const archive=await page.evaluate(()=>SplatPrivacy.exportData());const serialized=JSON.stringify(archive);
 for(const secret of ['nested-secret','raw-database-secret','serialized-secret'])expect(serialized).not.toContain(secret);
 for(const text of ['Keep this lesson','Keep nested text','Keep database text'])expect(serialized).toContain(text);
 expect(await page.evaluate(()=>localStorage.getItem('draft.with.settings'))).toContain('nested-secret');
});

test('a completed clear offers a content-free local deletion receipt',async({page})=>{
 await seeded(page);await page.evaluate(()=>caches.open('receipt-cache').then(c=>c.put('/synthetic-receipt',new Response('private'))));
 await expect(page.locator('#receipt')).toBeHidden();
 await page.locator('#clear').click();await page.getByRole('button',{name:'Delete saved browser data',exact:true}).click();
 await expect(page.locator('#receipt')).toBeVisible();
 const download=page.waitForEvent('download');await page.locator('#receipt').click();
 const saved=await download,receipt=JSON.parse(fs.readFileSync(await saved.path(),'utf8'));
 expect(saved.suggestedFilename()).toBe('splatworks-browser-deletion-receipt.json');
 expect(receipt.cleared).toBe(true);expect(receipt.origin).toBe(new URL(page.url()).origin);
 expect(receipt.counts.databases).toBe(1);expect(receipt.counts.caches).toBe(1);
 expect(receipt.excluded).toContain('backups');expect(JSON.stringify(receipt)).not.toContain('Synthetic learner');
 expect(await page.evaluate(()=>indexedDB.databases())).toEqual([]);
});

test('automatic expiry can be turned off without clearing saved work or showing a false expiry warning',async({page})=>{
 await seeded(page);await expect(page.locator('#disable-expiry')).toBeDisabled();
 await page.locator('#days').selectOption('1');await page.locator('#renew').click();
 await expect(page.locator('.splat-privacy-link')).toContainText('save before expiry');
 await page.locator('#disable-expiry').click();
 expect(await page.evaluate(()=>SplatPrivacy.getState().expiryEnabled)).toBe(false);
 await expect(page.locator('.splat-privacy-link')).toHaveText('Privacy');
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('splatworks.privacy.v1'));s.expiresAt=Date.now()-1;localStorage.setItem('splatworks.privacy.v1',JSON.stringify(s));});
 await page.goto('/solutions/brain-sort/');expect(new URL(page.url()).pathname).toContain('brain-sort');
 expect(await page.evaluate(()=>localStorage.getItem('student.draft'))).toContain('Keep my work');
});

test('AI approvals are queued and scoped to each destination rather than shared across providers',async({page})=>{
 const reached=[];await page.route(/https:\/\/api\.(openai|anthropic)\.com\//,async route=>{reached.push(new URL(route.request().url()).hostname);await route.fulfill({status:200,body:'ok'});});
 await page.goto('/privacy/');
 await page.evaluate(()=>{window.outcomes=Promise.all(['https://api.openai.com/v1/one','https://api.openai.com/v1/two','https://api.anthropic.com/v1/messages'].map(url=>fetch(url,{method:'POST',body:'synthetic'}).then(()=>true,()=>false)));});
 const dialog=page.getByRole('dialog');await expect(dialog).toContainText('https://api.openai.com');expect(reached).toEqual([]);
 await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'Allow AI for this tab'}).click();
 await expect(dialog).toContainText('https://api.anthropic.com');expect(reached).not.toContain('api.anthropic.com');
 await dialog.getByRole('button',{name:'Use local processing'}).click();
 expect(await page.evaluate(()=>window.outcomes)).toEqual([true,true,false]);expect(reached.sort()).toEqual(['api.openai.com','api.openai.com']);
});

test('connection opt-out in another tab cancels pending AI approval and re-enabling requires fresh approval',async({page,context})=>{
 let requests=0;await context.route('https://api.openai.com/**',route=>{requests++;return route.fulfill({status:200,body:'ok'});});
 await page.goto('/privacy/');const other=await context.newPage();await other.goto('/privacy/');
 await page.evaluate(()=>{window.pending=fetch('https://api.openai.com/v1/one',{method:'POST',body:'synthetic'}).then(()=>true,()=>false);});
 await expect(page.getByRole('dialog')).toBeVisible();await other.locator('#connections').uncheck();
 await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.evaluate(()=>window.pending)).toBe(false);expect(requests).toBe(0);
 await other.locator('#connections').check();await expect(page.locator('#connections')).toBeChecked();
 await page.evaluate(()=>{window.pending=fetch('https://api.openai.com/v1/two',{method:'POST',body:'synthetic'}).then(()=>true,()=>false);});
 await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('dialog').getByRole('checkbox').check();await page.getByRole('button',{name:'Allow AI for this tab'}).click();
 expect(await page.evaluate(()=>window.pending)).toBe(true);expect(requests).toBe(1);
 await other.locator('#connections').uncheck();await other.locator('#connections').check();
 await page.evaluate(()=>{window.pending=fetch('https://api.openai.com/v1/three',{method:'POST',body:'synthetic'}).then(()=>true,()=>false);});
 await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Use local processing'}).click();expect(await page.evaluate(()=>window.pending)).toBe(false);expect(requests).toBe(1);
});

test('AI requests reject insecure destinations and redirects without forwarding content',async({page})=>{
 let forwarded=0;await page.route('https://api.openai.com/**',route=>route.fulfill({status:307,headers:{location:'https://redirect.example.test/receive','access-control-allow-origin':'*'}}));
 await page.route('https://redirect.example.test/**',route=>{forwarded++;return route.fulfill({status:200,body:'unexpected'});});
 await page.goto('/privacy/');
 expect(await page.evaluate(()=>fetch('http://api.openai.com/v1/test',{method:'POST',body:'synthetic'}).then(()=>false,()=>true))).toBe(true);
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.evaluate(()=>{window.redirected=fetch('https://api.openai.com/v1/test',{method:'POST',body:'synthetic'}).then(()=>false,()=>true);});
 await page.getByRole('dialog').getByRole('checkbox').check();await page.getByRole('button',{name:'Allow AI for this tab'}).click();
 expect(await page.evaluate(()=>window.redirected)).toBe(true);expect(forwarded).toBe(0);
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
