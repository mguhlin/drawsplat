const {test,expect}=require('@playwright/test');
test('template dropdowns sort displayed labels while preserving filters and All',async({page})=>{
 await page.goto('/splatworks/layoutsplat/');await expect.poll(()=>page.evaluate(()=>!!window.LayoutSplat)).toBe(true);
 await page.locator('#fileMenu > summary').click();await page.locator('#fileTemplates > summary').click();await page.locator('[data-action=comicTemplates]').click();
 const result=await page.evaluate(()=>{const collator=new Intl.Collator(document.documentElement.lang||'en',{sensitivity:'base',numeric:true});return [...document.querySelectorAll('#templateLibraryDialog select')].map(s=>{const options=[...s.options],labels=options.filter(o=>o.value!=='').map(o=>o.textContent);return {id:s.id,labels,sorted:[...labels].sort(collator.compare),allFirst:!options.some(o=>o.value==='')||options[0].value===''};});});
 for(const item of result){expect(item.labels,item.id).toEqual(item.sorted);expect(item.allFirst,item.id).toBe(true);}await expect(page.locator('#libraryType')).toHaveValue('comic');await expect(page.locator('#libraryGrid .library-card')).toHaveCount(19);
 await page.locator('#libraryOrientation').selectOption('landscape');await expect(page.locator('#libraryGrid .library-card')).toHaveCount(2);
});
