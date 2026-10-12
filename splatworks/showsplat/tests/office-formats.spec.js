const {test,expect}=require('@playwright/test');
const {readFile}=require('node:fs/promises');
const fixture={version:1,title:'Classroom office check',theme:'violet',slides:[{id:'s1',title:'Welcome',notes:'',elements:[{id:'t1',type:'text',text:'Learning together',x:100,y:100,w:600,h:180,fontSize:32}]},{id:'s2',title:'Next steps',notes:'',elements:[{id:'t2',type:'text',text:'Review the evidence',x:100,y:100,w:600,h:180,fontSize:30}]}]};
for(const format of ['pptx','odp']){
 test(`ShowSplat exports and reopens ${format.toUpperCase()} classroom slides`,async({page})=>{
  await page.addInitScript(deck=>localStorage.setItem('showsplat.deck.v1',JSON.stringify(deck)),fixture);
  await page.goto('/splatworks/showsplat/?lang=en');await expect(page.locator('#slideCanvas')).toContainText('Learning together');
  await page.locator('.menu-bar>details').first().locator(':scope > summary').click();await page.locator('.submenu>summary').filter({hasText:/^Export$/}).click();
  const pending=page.waitForEvent('download');await page.locator(`[data-action="export-${format}"]`).click();const file=await pending;
  const buffer=await readFile(await file.path());expect(buffer.length).toBeGreaterThan(1000);
  await page.locator('#deckFileInput').setInputFiles({name:`classroom.${format}`,mimeType:format==='pptx'?'application/vnd.openxmlformats-officedocument.presentationml.presentation':'application/vnd.oasis.opendocument.presentation',buffer});
  await expect(page.locator('#slideCanvas')).toContainText('Learning together');
  const save=page.waitForEvent('download');await page.locator('.quick-actions [data-action="save-deck"]').click();
  const reopened=JSON.parse(await readFile(await (await save).path(),'utf8'));
  expect(reopened.slides).toHaveLength(2);expect(JSON.stringify(reopened.slides)).toContain('Review the evidence');
 });
}
