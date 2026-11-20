const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
test.use({viewport:{width:1200,height:1100}});
const {PDFDocument,StandardFonts,PDFName}=require('../solutions/pdfsplat/vendor/pdf-lib.min.js');
async function open(page){
 await page.goto(process.env.PDF_LINKS_URL || '/solutions/pdfsplat/');
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);
 for(let i=0;i<3;i++)doc.addPage([600,800]).drawText(`Worksheet page ${i+1}`,{x:60,y:720,font,size:20});
 await page.locator('#fileInput').setInputFiles({name:'worksheet.pdf',mimeType:'application/pdf',buffer:Buffer.from(await doc.save())});
 await expect(page.locator('#status')).toContainText('worksheet.pdf opened.');
 await expect(page.locator('#addLinkButton')).toBeEnabled();
 await expect(page.locator('#pdfCanvas')).toBeVisible();
 await expect.poll(()=>page.locator('#annotationLayer').evaluate(e=>e.clientWidth)).toBeGreaterThan(100);
}
async function draw(page,{x=.1,y=.1,w=.3,h=.1,reverse=false}={}){
 await page.locator('#addLinkButton').click();
 const b=await page.locator('#annotationLayer').boundingBox();
 await page.mouse.move(b.x+b.width*(reverse?x+w:x),b.y+b.height*(reverse?y+h:y));
 await page.mouse.down();
 await page.mouse.move(b.x+b.width*(reverse?x:x+w),b.y+b.height*(reverse?y:y+h),{steps:6});
 await page.mouse.up();
 await expect(page.locator('#linkDialog')).toBeVisible();
}
async function addUrl(page,url,box){await draw(page,box);await page.locator('#linkUrl').fill(url);await page.locator('#linkSave').click();await expect(page.locator('#linkDialog')).toBeHidden();}
async function download(page){
 const pending=page.waitForEvent('download');await page.locator('#saveAsSelect').selectOption('pdf');
 return fs.readFile(await(await pending).path());
}
function links(doc,index=0){const a=doc.getPage(index).node.Annots();return a?a.asArray().map(ref=>doc.context.lookup(ref)).filter(a=>a.get(PDFName.of('Subtype'))===PDFName.of('Link')):[];}
function uri(a){return a.lookup(PDFName.of('A')).lookup(PDFName.of('URI')).decodeText();}
test('drawn HTTP, HTTPS and file links export invisible annotations and stay editable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
 await addUrl(page,'https://example.org/lesson.pdf?name=class#section',{reverse:true});
 await addUrl(page,'http://example.org/resource',{y:.3});
 await addUrl(page,'file:///home/teacher/My Lesson.pdf',{y:.5});
 const exported=await download(page);
 const viewerLinks=await page.evaluate(async bytes=>{const pdf=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;const links=await(await pdf.getPage(1)).getAnnotations();await pdf.destroy();return links;},Array.from(exported));
 expect(viewerLinks[0].url).toBe('https://example.org/lesson.pdf?name=class#section');expect(viewerLinks[1].url).toBe('http://example.org/resource');expect(viewerLinks[2].unsafeUrl).toBe('file:///home/teacher/My%20Lesson.pdf');
 let doc=await PDFDocument.load(exported),a=links(doc);
 expect(a).toHaveLength(3);expect(a.map(uri)).toEqual(['https://example.org/lesson.pdf?name=class#section','http://example.org/resource','file:///home/teacher/My%20Lesson.pdf']);
 expect(a[0].lookup(PDFName.of('Border')).asArray().map(n=>n.asNumber())).toEqual([0,0,0]);
 const rect=a[0].lookup(PDFName.of('Rect')).asArray().map(n=>n.asNumber());
 [60,640,240,720].forEach((n,i)=>expect(Math.abs(rect[i]-n)).toBeLessThan(1.6));
 await page.locator('#editLinkButton').click();await page.locator('#linkUrl').fill('https://example.org/revised');await page.locator('#linkSave').click();
 const box=page.locator('.link-object.selected'),handle=box.locator('.resize-handle'),b=await handle.boundingBox();
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+35,b.y+25,{steps:4});await page.mouse.up();
 await page.locator('#deleteLinkButton').click();await expect(page.locator('.link-object')).toHaveCount(2);
 await page.locator('#undoButton').click();await expect(page.locator('.link-object')).toHaveCount(3);
 doc=await PDFDocument.load(await download(page));expect(links(doc).map(uri)).toContain('https://example.org/revised');expect(errors).toEqual([]);
});
test('internal destinations survive reorder and exported PDFs resolve the real target',async({page})=>{
 await open(page);await draw(page);await page.locator('#linkKind').selectOption('page');await page.locator('#linkPage').selectOption({label:'Page 3'});await page.locator('#linkSave').click();
 await page.locator('#followLinkButton').click();await expect(page.locator('#pagePosition')).toHaveText('3 / 3');
 await page.locator('#previousPageButton').click();await page.locator('#previousPageButton').click();
 await page.locator('#toolGroup-pages').evaluate(e=>e.open=true);await page.locator('#reversePagesButton').click();
 await expect(page.locator('#pagePosition')).toHaveText('3 / 3');
 let bytes=await download(page),doc=await PDFDocument.load(bytes),dest=links(doc,2)[0].lookup(PDFName.of('Dest'));
 expect(dest.get(0).toString()).toBe(doc.getPage(0).ref.toString());expect(dest.get(1).toString()).toBe('/Fit');
 const result=await page.evaluate(async bytes=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;const a=(await(await doc.getPage(3)).getAnnotations())[0];const index=await doc.getPageIndex(a.dest[0]);await doc.destroy();return index;},Array.from(bytes));
 expect(result).toBe(0);
 // Duplicating the source page retains its target, and extraction omits an absent target.
 await page.locator('#duplicatePageButton').click();doc=await PDFDocument.load(await download(page));expect(links(doc,3)[0].lookup(PDFName.of('Dest')).get(0).toString()).toBe(doc.getPage(0).ref.toString());
 const pending=page.waitForEvent('download');await page.locator('#extractPageButton').click();const extracted=await PDFDocument.load(await fs.readFile(await(await pending).path()));expect(links(extracted)).toHaveLength(0);
});
test('invalid URLs and cancelled pointer or dialog leave no link or history entry',async({page})=>{
 await open(page);await draw(page);await page.locator('#linkUrl').fill('javascript:alert(1)');await page.locator('#linkSave').click();await expect(page.locator('#linkError')).toContainText('complete');
 await page.locator('#linkCancel').click();await expect(page.locator('.link-object')).toHaveCount(0);await expect(page.locator('#undoButton')).toBeDisabled();
 await page.locator('#addLinkButton').click();const b=await page.locator('#annotationLayer').boundingBox();await page.mouse.move(b.x+40,b.y+40);await page.mouse.down();await page.mouse.move(b.x+140,b.y+120);await page.keyboard.press('Escape');await page.mouse.up();await expect(page.locator('#linkDialog')).toBeHidden();await expect(page.locator('.link-box-preview')).toHaveCount(0);
 await page.locator('#addLinkButton').click();await page.keyboard.press('Enter');await expect(page.locator('#linkDialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#undoButton')).toBeDisabled();
});
test('links survive rotation and cropped exports with correct rectangles',async({page})=>{
 await open(page);await page.locator('#toolGroup-pages').evaluate(e=>e.open=true);await page.locator('#rotateRightButton').click();await expect.poll(()=>page.locator('#annotationLayer').evaluate(e=>e.clientWidth>e.clientHeight)).toBe(true);
 await addUrl(page,'https://example.org/rotated');
 let doc=await PDFDocument.load(await download(page));expect(links(doc)).toHaveLength(1);const rect=links(doc)[0].lookup(PDFName.of('Rect')).asArray().map(n=>n.asNumber());
 [60,80,120,320].forEach((n,i)=>expect(Math.abs(rect[i]-n)).toBeLessThan(1.6));
 await page.locator('#cropButton').click();await page.locator('#cropLeft').fill('5');await page.locator('#cropForm button[type=submit]').click();
 doc=await PDFDocument.load(await download(page));expect(doc.getPage(0).getRotation().angle).toBe(0);const cropped=links(doc)[0].lookup(PDFName.of('Rect')).asArray().map(n=>n.asNumber());
 [40,480,280,540].forEach((n,i)=>expect(Math.abs(cropped[i]-n)).toBeLessThan(1.6));
});
test('reopening PDFs restores editable links without duplication and preserves destinations',async({page})=>{
 await open(page);await addUrl(page,'https://example.org/reopen');
 await draw(page,{y:.3});await page.locator('#linkKind').selectOption('page');await page.locator('#linkPage').selectOption({label:'Page 2'});await page.locator('#linkSave').click();
 const bytes=await download(page);
 await page.locator('#fileInput').setInputFiles({name:'reopen.pdf',mimeType:'application/pdf',buffer:bytes});
 await expect(page.locator('#status')).toContainText('reopen.pdf opened.');
 await expect(page.locator('.link-object')).toHaveCount(2);
 let doc=await PDFDocument.load(await download(page));expect(links(doc)).toHaveLength(2);expect(links(doc)[1].lookup(PDFName.of('Dest')).get(0).toString()).toBe(doc.getPage(1).ref.toString());
 await page.locator('.link-object').first().click();await page.locator('#deleteLinkButton').click();await expect(page.locator('.link-object')).toHaveCount(1);await expect(page.locator('#status')).toHaveText('Object deleted.');doc=await PDFDocument.load(await download(page));expect(links(doc)).toHaveLength(1);expect(links(doc)[0].has(PDFName.of('Dest'))).toBe(true);
});
test('deleted internal destinations prevent broken full exports and undo restores them',async({page})=>{
 await open(page);await draw(page);await page.locator('#linkKind').selectOption('page');await page.locator('#linkPage').selectOption({label:'Page 2'});await page.locator('#linkSave').click();
 await page.locator('#followLinkButton').click();await page.locator('#toolGroup-pages').evaluate(e=>e.open=true);await page.locator('#deletePageButton').click();
 await page.locator('#saveAsSelect').selectOption('pdf');await expect(page.locator('#status')).toContainText('Destination page removed');
 await page.locator('#undoButton').click();const doc=await PDFDocument.load(await download(page));expect(links(doc)[0].lookup(PDFName.of('Dest')).get(0).toString()).toBe(doc.getPage(1).ref.toString());
});
test('link areas follow content when the page is rotated after linking',async({page})=>{
 await open(page);await addUrl(page,'https://example.org/before-rotation');await page.locator('#toolGroup-pages').evaluate(e=>e.open=true);await page.locator('#rotateRightButton').click();
 await expect.poll(()=>page.locator('#annotationLayer').evaluate(e=>e.clientWidth>e.clientHeight)).toBe(true);
 const doc=await PDFDocument.load(await download(page)),rect=links(doc)[0].lookup(PDFName.of('Rect')).asArray().map(n=>n.asNumber());
 [60,640,240,720].forEach((n,i)=>expect(Math.abs(rect[i]-n)).toBeLessThan(1.6));
 await page.locator('#customRotateButton').click();await page.locator('#customRotation').fill('10');await page.locator('#customRotateForm button[type=submit]').click();
 const fine=await PDFDocument.load(await download(page));expect(links(fine)).toHaveLength(1);expect(uri(links(fine)[0])).toBe('https://example.org/before-rotation');
});
test('keyboard link insertion supports repeated positioning, editing and deletion',async({page})=>{
 await open(page);await page.locator('#addLinkButton').click();await page.keyboard.press('Enter');await page.locator('#linkUrl').fill('https://example.org/keyboard');await page.locator('#linkSave').click();
 await page.locator('.link-object').focus();for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');
 await expect(page.locator('#pagePosition')).toHaveText('1 / 3');await expect(page.locator('.link-object')).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.locator('#linkDialog')).toBeVisible();await page.keyboard.press('Escape');
 const doc=await PDFDocument.load(await download(page)),rect=links(doc)[0].lookup(PDFName.of('Rect')).asArray().map(n=>n.asNumber());expect(rect[0]).toBeCloseTo(123.6,1);expect(rect[2]-rect[0]).toBeCloseTo(180,1);
 await page.locator('.link-object').focus();await page.keyboard.press('Delete');await expect(page.locator('.link-object')).toHaveCount(0);
});
