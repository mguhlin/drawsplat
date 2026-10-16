const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
test('numbered masters resolve separately after page edits and retain dynamic fields through native saves and exports',async({page})=>{
 await page.goto('/splatworks/layoutsplat/');await page.waitForFunction(()=>!!window.LayoutSplat);
 page.on('dialog',d=>d.accept(d.type()==='prompt'?'Page {page} of {total}':undefined));
 await page.locator('[data-action=masters]').click();await page.locator('[data-action=pageNumbers]').click();await page.locator('#mastersDialog [value=cancel]').last().click();
 const source=await page.evaluate(()=>LayoutSplat.getPublication());const footer=source.pages[0].objects.find(o=>source.stories[o.storyId]?.pageNumberFormat);
 await page.locator(`#pageSurface [data-object-id="${footer.id}"]`).click();await page.locator('[data-action=masters]').click();await page.locator('[data-action=createMaster]').click();await page.locator('[data-action=applyMasterAll]').click();await page.locator('#mastersDialog [value=cancel]').last().click();
 const check=async expected=>{
  const result=await page.evaluate(async()=>{const d=LayoutSplat.getPublication(),{createMeasurer,layoutStories}=await import('/splatworks/layoutsplat/layout.mjs'),{exportHtml}=await import('/splatworks/layoutsplat/render.mjs'),{pageObjects}=await import('/splatworks/layoutsplat/presentation-model.mjs');const m=createMeasurer(),l=layoutStories(d,m);try{return {html:[...new DOMParser().parseFromString(exportHtml(d,l),'text/html').querySelectorAll('.publication-page')].map(p=>p.textContent),office:d.pages.map(p=>pageObjects(d,p,l,0,()=>{}).filter(o=>o.type==='text').flatMap(o=>o.paragraphs.flatMap(p=>p.runs.map(r=>r.text))).join('')),template:d.stories[d.masters[0].objects[0].storyId].pageNumberFormat};}finally{m.remove();}});
  expect(result.template).toBe('Page {page} of {total}');for(let i=0;i<expected;i++){expect(result.html[i]).toContain(`Page ${i+1} of ${expected}`);expect(result.office[i]).toContain(`Page ${i+1} of ${expected}`);}
 };
 await check(2);await page.locator('[data-action=duplicatePage]').first().click();await check(3);await page.locator('[data-action=deletePage]').first().click();await check(2);await page.locator('#undoBtn').click();await check(3);await page.locator('[data-action=addPage]').first().click();await page.locator('[data-action=masters]').click();await page.locator('[data-action=applyMasterAll]').click();await page.locator('#mastersDialog [value=cancel]').last().click();await check(4);
 const pending=page.waitForEvent('download');await page.locator('.header-actions [data-action=save]').click();const buffer=await fs.readFile(await(await pending).path());await page.locator('#projectInput').setInputFiles({name:'master.layoutsplat',mimeType:'application/zip',buffer});await check(4);
 const snapshot=await page.evaluate(()=>LayoutSplat.getPublication());snapshot.pages[0].masterOverrides=[footer.id];await page.locator('#projectInput').setInputFiles({name:'override.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(snapshot))});
 expect(await page.locator(`#pageSurface [data-object-id="${footer.id}"]`).count()).toBe(0);
});
test('Publisher master associations and repeated source text IDs preserve reusable artwork and one linked story',async({page})=>{
 await page.goto('/splatworks/layoutsplat/');await page.waitForFunction(()=>!!window.LayoutSplat);
 const result=await page.evaluate(async()=>{
  const {publicationFromPublisher}=await import('/splatworks/layoutsplat/publisher.mjs');const e=(op,data={})=>({op,data}),box={'svg:x':'36pt','svg:y':'36pt','svg:width':'200pt','svg:height':'100pt'};
  const text=(value,id)=>[e('startTextObject',{...box,'layoutsplat:text-id':id}),e('openParagraph'),e('insertText',value),e('closeParagraph'),e('endTextObject')];
  const {doc,warnings}=await publicationFromPublisher([e('startMasterPage',{'layoutsplat:master-id':7}),...text('Recurring logo caption',1),e('endMasterPage'),e('startPage',{'layoutsplat:master-id':7}),...text('A shared story remains whole.',9),e('endPage'),e('startPage',{'layoutsplat:master-id':7}),...text('A shared story remains whole.',9),e('endPage')]);
  return {masters:doc.masters,pages:doc.pages,stories:Object.values(doc.stories),warnings};
 });
 expect(result.masters).toHaveLength(1);expect(result.pages.every(p=>p.masterId===result.masters[0].id)).toBe(true);expect(result.stories).toHaveLength(2);expect(result.stories.find(s=>s.text.startsWith('A shared')).frames).toHaveLength(2);expect(result.warnings.join(' ')).toContain('linked in source');
});
