const {test,expect}=require('@playwright/test');
const demo=require('./fixtures/layoutsplat/demo-publication.json');
test.use({storageState:{cookies:[],origins:[]}});
test.beforeEach(async({page})=>{await page.addInitScript(()=>{try{localStorage.setItem('drawsplat.consent.accepted','1');}catch{}});});
async function ready(page){await page.goto('/splatworks/layoutsplat/?lang=en');await page.waitForFunction(()=>!!window.LayoutSplat);return page.evaluate(()=>LayoutSplat.getPublication());}
const store='layoutsplat.autosave.v1';
test('fresh workspace opens the supplied two-page October newsletter',async({page})=>{
 const doc=await ready(page);expect(doc.title).toBe('SplatWorks News – October 2026');expect(doc.pages.map(p=>p.objects.length)).toEqual([16,17]);expect(Object.keys(doc.stories)).toHaveLength(23);expect(Object.keys(doc.assets)).toHaveLength(3);await expect(page.locator('#publicationTitle')).toHaveValue(doc.title);
});
test('a saved publication reopens without fetching or replacing it with the starter',async({page})=>{
 let requested=0;await page.route('**/defaults/splatworks-news-october-2026.layoutsplat.json*',r=>{requested++;return r.abort();});await page.addInitScript(({store,doc})=>localStorage.setItem(store,JSON.stringify(doc)),{store,doc:{...demo,title:'Existing classroom publication'}});expect((await ready(page)).title).toBe('Existing classroom publication');expect(requested).toBe(0);
});
test('the recovery copy takes precedence over the starter when current data is invalid',async({page})=>{
 await page.addInitScript(({store,doc})=>{localStorage.setItem(store,'invalid JSON');localStorage.setItem('layoutsplat.recovery.v1',JSON.stringify(doc));},{store,doc:{...demo,title:'Recovered classroom publication'}});expect((await ready(page)).title).toBe('Recovered classroom publication');
});
test('clearing browser work can still start a blank publication',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('layoutsplat.startBlank.v1','1'));const doc=await ready(page);expect(doc.title).toBe('Untitled publication');expect(doc.pages).toHaveLength(1);expect(doc.pages[0].objects).toHaveLength(0);
});
test('the built-in example remains usable if the starter file is unavailable',async({page})=>{
 await page.route('**/defaults/splatworks-news-october-2026.layoutsplat.json*',r=>r.fulfill({status:503,body:'Unavailable'}));const doc=await ready(page);expect(doc.title).toBe('Our community newsletter');expect(doc.pages).toHaveLength(2);
});
test('the illustrated newsletter continues autosaving after edits and reloads',async({page})=>{
 await ready(page);await expect.poll(()=>page.evaluate(store=>!!localStorage.getItem(store),store)).toBe(true);await page.locator('#publicationTitle').fill('My October newsletter');await page.locator('#publicationTitle').press('Tab');await expect.poll(()=>page.evaluate(store=>JSON.parse(localStorage.getItem(store)).title,store)).toBe('My October newsletter');await page.reload();await page.waitForFunction(()=>!!window.LayoutSplat);expect((await page.evaluate(()=>LayoutSplat.getPublication())).title).toBe('My October newsletter');expect((await page.evaluate(()=>LayoutSplat.getPublication())).pages).toHaveLength(2);
});
test('opening the starter explicitly keeps the previous publication available through Undo',async({page})=>{
 await page.addInitScript(({store,doc})=>localStorage.setItem(store,JSON.stringify(doc)),{store,doc:{...demo,title:'Keep this publication'}});await ready(page);await page.locator('#fileMenu > summary').click();await page.locator('#fileMenu [data-action=starter]').click();await expect(page.locator('#publicationTitle')).toHaveValue('SplatWorks News – October 2026');await page.locator('body').press('Control+z');await expect(page.locator('#publicationTitle')).toHaveValue('Keep this publication');
});
