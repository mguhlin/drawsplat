const {test,expect}=require('@playwright/test');
const fs=require('fs');
const vm=require('vm');
const endpoint='https://script.google.com/macros/s/TEST_DEPLOYMENT/exec';
async function connectStep(page){await page.locator('[data-setup-step="4"]').click()}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{sessionStorage.setItem('drawsplat.adminAccess','admin')});
  await page.goto('/admin/admin.html');
});
for(const width of [1280,390]){
  test(`teacher can follow setup without exposed server settings at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await expect(page.locator('.admin-advanced')).not.toHaveAttribute('open');
    await expect(page.locator('#storageMode')).toBeHidden();
    await expect(page.locator('#setupManualRoute')).toBeVisible();
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedSetup=text}},configurable:true}));
    await page.locator('#copySetupScriptBtn').click();
    await expect(page.locator('#copySetupScriptStatus')).toContainText('Copied.');
    expect(await page.evaluate(()=>window.copiedSetup)).toContain('function prepareClassroomStorage()');
    for(const step of [2,3,4]){
      await page.locator(`[data-setup-next="${step}"]`).click();
      await expect(page.locator(`[data-setup-panel="${step}"]`)).toBeVisible();
      await expect(page.locator(`[data-setup-step="${step}"]`)).toHaveAttribute('aria-current','step');
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    expect(overflow).toBe(false);
    await page.reload();
    await expect(page.locator('[data-setup-panel="4"]')).toBeVisible();
  });
}
test('connection rejects editor and dev links without saving',async({page})=>{
  await connectStep(page);
  for(const [url,help] of [['https://script.google.com/home/projects/abc/edit','editor link'],['https://script.google.com/macros/s/abc/dev','test link'],['https://example.com/exec','published Google Web app URL']]){
    await page.locator('#adminScriptUrl').fill(url);await page.locator('#saveScriptUrlBtn').click();
    await expect(page.locator('#adminStatus')).toContainText(help);
    expect(await page.evaluate(()=>localStorage.getItem('drawsplat.googleScriptUrl'))).toBeNull();
  }
});
test('verified connection saves normalized URL and enables Google storage',async({page})=>{
  await page.route(endpoint+'?action=ping',route=>route.fulfill({json:{ok:true,app:'DrawSplatTM',version:'1.10.0',setupReady:true}}));
  await page.evaluate(()=>localStorage.setItem('drawsplat.storageMode','browser-session'));
  await connectStep(page);await page.locator('#adminScriptUrl').fill(endpoint+'?copied=1');await page.locator('#saveScriptUrlBtn').click();
  await expect(page.locator('#googleConnectionState')).toHaveText('Connected');
  expect(await page.evaluate(()=>[localStorage.getItem('drawsplat.googleScriptUrl'),localStorage.getItem('drawsplat.storageMode')])).toEqual([endpoint,'google']);
  await page.reload();await expect(page.locator('[data-setup-panel="4"]')).toBeVisible();await expect(page.locator('#googleConnectionState')).toHaveText('Not checked yet');
  await page.locator('#clearScriptUrlBtn').click();expect(await page.evaluate(()=>localStorage.getItem('drawsplat.googleScriptUrl'))).toBeNull();
});
test('failed connection keeps the prior working URL and explains next steps',async({page})=>{
  await page.evaluate(()=>localStorage.setItem('drawsplat.googleScriptUrl','previous-connection'));
  await connectStep(page);await page.locator('#adminScriptUrl').fill(endpoint);
  for(const [out,help] of [[{ok:true,app:'Other'},'not responding as DrawSplat'],[{ok:true,app:'DrawSplatTM',setupReady:false},'storage is not ready']]){
    await page.route(endpoint+'?action=ping',r=>r.fulfill({json:out}));await page.locator('#testScriptUrlBtn').click();await expect(page.locator('#adminStatus')).toContainText(help);await page.unroute(endpoint+'?action=ping');
    expect(await page.evaluate(()=>localStorage.getItem('drawsplat.googleScriptUrl'))).toBe('previous-connection');
  }
  await page.route(endpoint+'?action=ping',r=>r.fulfill({contentType:'text/html',body:'<html>Sign in</html>'}));await page.locator('#testScriptUrlBtn').click();await expect(page.locator('#adminStatus')).toContainText('sign-in or permission page');
});
test('editing a pending connection cancels it and cannot save a stale URL',async({page})=>{
  let release;const gate=new Promise(r=>release=r);
  await page.route(endpoint+'?action=ping',async r=>{await gate;await r.fulfill({json:{ok:true,app:'DrawSplatTM',setupReady:true}}).catch(()=>{})});
  await connectStep(page);await page.locator('#adminScriptUrl').fill(endpoint);await page.locator('#testScriptUrlBtn').click();await expect(page.locator('#testScriptUrlBtn')).toBeDisabled();
  await page.locator('#adminScriptUrl').fill('https://script.google.com/macros/s/OTHER/exec');release();
  await expect(page.locator('#testScriptUrlBtn')).toBeEnabled();await expect(page.locator('#googleConnectionState')).toHaveText('Not checked yet');
  expect(await page.evaluate(()=>localStorage.getItem('drawsplat.googleScriptUrl'))).toBeNull();
});
test('configured template replaces manual installation',async({page})=>{
  await page.route('**/apps-script/setup-template.json',r=>r.fulfill({json:{spreadsheetId:'TEST_TEMPLATE_ID_1234567890'}}));await page.reload();
  await expect(page.locator('#setupTemplateRoute')).toBeVisible();await expect(page.locator('#setupManualRoute')).toBeHidden();
  await expect(page.locator('#setupTemplateLink')).toHaveAttribute('href','https://docs.google.com/spreadsheets/d/TEST_TEMPLATE_ID_1234567890/copy');
});
test('Apps Script copied classroom setup owns its storage and reports readiness',()=>{
  const properties=new Map([['SPREADSHEET_ID','template'],['FOLDER_ID','template-folder']]);
  const tabs=new Map();let created=0;
  const sheet={getId:()=> 'classroom-copy',getSheetByName:n=>tabs.get(n),insertSheet:n=>{const s={getLastColumn:()=>0,clear:()=>{},getRange:()=>({getValues:()=>[[]],setValues:()=>{}})};tabs.set(n,s);return s}};
  const context=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k),setProperty:(k,v)=>properties.set(k,v),deleteProperty:k=>properties.delete(k)})},SpreadsheetApp:{getActiveSpreadsheet:()=>sheet,openById:id=>{expect(id).toBe('classroom-copy');return sheet}},DriveApp:{createFolder:()=>{created++;return {getId:()=> 'classroom-folder'}},getFolderById:id=>{expect(id).toBe('classroom-folder');return {isTrashed:()=>false}}},Utilities:{getUuid:()=> 'salt'}});
  vm.runInContext(fs.readFileSync('apps-script/Code.gs','utf8'),context);
  expect(vm.runInContext('setupReady_()',context)).toBe(false);
  vm.runInContext('setup()',context);
  expect(properties.get('SPREADSHEET_ID')).toBe('classroom-copy');expect(properties.get('FOLDER_ID')).toBe('classroom-folder');
  expect(vm.runInContext('setupReady_()',context)).toBe(true);
  vm.runInContext('setup()',context);expect(created).toBe(1);
});

test('clipboard failure offers selectable script instead of blocking setup',async({page})=>{
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Denied')}},configurable:true}));
  await page.locator('#copySetupScriptBtn').click();
  await expect(page.locator('#setupScriptFallback')).toBeVisible();
  await expect(page.locator('#setupScriptFallback')).toHaveValue(/function prepareClassroomStorage/);
});
test('preview can inspect steps but cannot check or save a connection',async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem('drawsplat.adminAccess','viewer'));await page.reload();
  await page.locator('[data-setup-step="4"]').click();await expect(page.locator('[data-setup-panel="4"]')).toBeVisible();
  await page.locator('#saveScriptUrlBtn').dispatchEvent('click');
  expect(await page.evaluate(()=>localStorage.getItem('drawsplat.googleScriptUrl'))).toBeNull();
  expect(await page.evaluate(()=>localStorage.getItem('drawsplat.googleSetupStep'))).toBeNull();
  await expect(page.locator('#googleConnectionState')).toHaveText('Not checked yet');
});
