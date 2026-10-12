const {test,expect}=require('@playwright/test');
const writer={app:'WriteSplatTM',version:1,createdAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-11T00:00:00Z',metadata:{title:'Transferred writing',author:'',targetGrade:'6'},document:{format:'html',body:'<p>Writing carried into the correct app.</p>'},teacher:{studentView:false,citations:[],answerKey:[]}};
test('ShowSplat hands writing to a new WriteSplat tab without replacing saved work',async({page})=>{
 await page.goto('/splatworks/showsplat/');
 await expect(page.locator('#slideCanvas')).toBeVisible();
 const before=await page.evaluate(()=>localStorage.getItem('showsplat.deck.v1'));
 await page.evaluate(()=>localStorage.setItem('writesplat.autosave.v1','original-saved-project'));
 const pending=page.waitForEvent('popup');
 await page.locator('#deckFileInput').setInputFiles({name:'lesson.writesplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(writer))});
 const target=await pending;
 await expect(target.getByRole('textbox',{name:'WriteSplat document editor'})).toContainText('Writing carried into the correct app.');
 await expect(target).toHaveURL(/\/splatworks\/writesplat\/$/);
 expect(await target.evaluate(()=>localStorage.getItem('writesplat.autosave.v1'))).toBe('original-saved-project');
 expect(await page.evaluate(()=>localStorage.getItem('showsplat.deck.v1'))).toBe(before);
 expect(await target.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('drawsplat-file-transfers',1);r.onsuccess=()=>{const db=r.result;const c=db.transaction('files').objectStore('files').count();c.onsuccess=()=>{resolve(c.result);db.close();};};r.onerror=reject;}))).toBe(0);
});
test('blocked popup gives recovery instructions without changing the source project',async({page})=>{
 await page.goto('/splatworks/showsplat/');await expect(page.locator('#slideCanvas')).toBeVisible();
 await page.evaluate(()=>{window.open=()=>null;});
 await page.locator('#deckFileInput').setInputFiles({name:'lesson.docx',mimeType:'application/octet-stream',buffer:Buffer.from('test')});
 await expect(page.locator('#statusText')).toContainText('Allow popups');
});
test('a PowerPoint file selected in WriteSplat opens as slides in a new ShowSplat tab',async({page,context})=>{
 const creator=await context.newPage();await creator.goto('/splatworks/showsplat/');
 await creator.locator('.menu-bar>details').first().locator(':scope > summary').click();await creator.locator('.submenu>summary').filter({hasText:/^Export$/}).click();
 const pendingDownload=creator.waitForEvent('download');await creator.locator('[data-action="export-pptx"]').click();const file=await pendingDownload;
 const buffer=await require('node:fs/promises').readFile(await file.path());
 await page.goto('/splatworks/writesplat/');await expect(page.getByRole('textbox',{name:'WriteSplat document editor'})).toBeVisible();
 const pending=page.waitForEvent('popup');await page.locator('#importFileInput').setInputFiles({name:'slides.pptx',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',buffer});
 const target=await pending;await expect(target.locator('#statusText')).toContainText('Save a project file');await expect(target.locator('#slideCanvas')).toBeVisible();await expect(target).toHaveURL(/\/splatworks\/showsplat\/$/);
});
test('missing matching app reports the problem and closes its empty tab',async({page})=>{
 await page.goto('/splatworks/showsplat/');await expect(page.locator('#slideCanvas')).toBeVisible();
 await page.route('**/splatworks/writesplat/',route=>route.fulfill({status:404,body:'Not installed'}));
 const pending=page.waitForEvent('popup');await page.locator('#deckFileInput').setInputFiles({name:'lesson.docx',mimeType:'application/octet-stream',buffer:Buffer.from('test')});
 const target=await pending;await expect(page.locator('#statusText')).toContainText('not available at this school address');await expect.poll(()=>target.isClosed()).toBe(true);
});
test('a Word document selected in ShowSplat opens its text in WriteSplat',async({page,context})=>{
 const creator=await context.newPage();await creator.goto('/splatworks/writesplat/');
 await creator.locator('#fileInput').setInputFiles({name:'lesson.writesplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(writer))});
 await expect(creator.getByRole('textbox',{name:'WriteSplat document editor'})).toContainText('Writing carried into the correct app.');
 const pendingDownload=creator.waitForEvent('download');await creator.getByRole('navigation',{name:'WriteSplat menus'}).getByText('File',{exact:true}).click();await creator.getByText('Export As',{exact:true}).click();await creator.getByRole('button',{name:'Word (.docx)',exact:true}).click();
 const file=await pendingDownload;const buffer=await require('node:fs/promises').readFile(await file.path());
 await page.goto('/splatworks/showsplat/');await expect(page.locator('#slideCanvas')).toBeVisible();
 const pending=page.waitForEvent('popup');await page.locator('#deckFileInput').setInputFiles({name:'lesson.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer});
 const target=await pending;await expect(target.getByRole('textbox',{name:'WriteSplat document editor'})).toContainText('Writing carried into the correct app.');
});
test('a spreadsheet project chosen in WriteSplat opens in GridSplat with an isolated draft',async({page})=>{
 await page.goto('/splatworks/writesplat/');await expect(page.getByRole('textbox',{name:'WriteSplat document editor'})).toBeVisible();
 const grid={version:1,metadata:{createdAt:'2026-10-11T00:00:00Z',title:'Numbers'},sheets:[{id:'sheet-1',name:'Sheet 1',cells:[['Transferred spreadsheet','7'],['Total','=B1*2']]}],charts:[],pictureGraphs:[]};
 const pending=page.waitForEvent('popup');await page.locator('#fileInput').setInputFiles({name:'numbers.gridsplat.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(grid))});
 const target=await pending;await expect(target.getByTestId('cell-A1')).toContainText('Transferred spreadsheet');await expect(target.getByTestId('cell-B2')).toContainText('14');await expect(target.getByRole('dialog',{name:'GridSplat™',exact:true})).toBeHidden();
 expect(await target.evaluate(()=>sessionStorage.getItem('drawsplat.imported-tab./splatworks/gridsplat/'))).toBe('1');
});
