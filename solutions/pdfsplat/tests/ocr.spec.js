const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const {PDFDocument,StandardFonts,rgb}=require('../vendor/pdf-lib.min.js');
test.setTimeout(120000);
const csp="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self' https://www.googleapis.com; object-src 'none'; worker-src 'self'; base-uri 'none'";
async function fixture(page,{mixed=false,spanish=false,blank=false,pages=1,dark=false}={}){
 const png=Buffer.from(await page.evaluate(({spanish,blank,dark})=>{
  const c=document.createElement('canvas');c.width=1400;c.height=900;const cx=c.getContext('2d');const gradient=cx.createLinearGradient(0,0,0,900);gradient.addColorStop(0,'#38104f');gradient.addColorStop(1,'#653582');cx.fillStyle=dark?gradient:'white';cx.fillRect(0,0,1400,900);
  cx.fillStyle='#16a34a';cx.fillRect(1150,650,150,150);
  if(!blank){cx.fillStyle=dark?'#ffffff':'#111111';cx.font=dark?'bold 120px Arial':'bold 65px Arial';cx.fillText(spanish?'EL CICLO DEL AGUA':'THE WATER CYCLE',80,160);cx.font='48px Arial';cx.fillText(spanish?'La evaporación cambia el agua.':'Evaporation changes water into vapor.',80,320);cx.fillText(spanish?'Este texto se puede editar.':'Read this scanned sentence.',80,450);}
  return c.toDataURL('image/png').split(',')[1];
 },{spanish,blank,dark}),'base64');
 const pdf=await PDFDocument.create(),image=await pdf.embedPng(png),font=await pdf.embedFont(StandardFonts.Helvetica);
 for(let i=0;i<pages;i++){const p=pdf.addPage([700,500]);p.drawImage(image,{x:0,y:0,width:700,height:450});if(mixed)p.drawText('Existing selectable text stays editable.',{x:40,y:475,font,size:16,color:rgb(0,0,0)});}
 await page.locator('#fileInput').setInputFiles({name:'scan.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});await expect(page.locator('#status')).toContainText('opened.');await expect(page.locator('#ocrButton')).toBeEnabled();
}
async function recognize(page,{scope='current',language='eng'}={}){
 await page.locator('#ocrButton').click();await page.locator('#ocrScope').selectOption(scope);await page.locator('#ocrLanguage').selectOption(language);await page.locator('#ocrRun').click();
 await expect(page.locator('#ocrRun')).toBeEnabled({timeout:90000});await expect(page.locator('#ocrStatus')).not.toContainText('could not finish');
}
async function downloadPdf(page){const next=page.waitForEvent('download');await page.locator('#saveAsSelect').selectOption('pdf');return fs.readFile(await(await next).path());}
async function textOf(page,bytes){return page.evaluate(async bytes=>{const doc=await pdfjsLib.getDocument({data:Uint8Array.from(bytes)}).promise;let text='';for(let i=1;i<=doc.numPages;i++)text+=(await(await doc.getPage(i)).getTextContent()).items.map(x=>x.str).join(' ')+'\n';await doc.destroy();return text;},[...bytes]);}
test.beforeEach(async({page})=>{
 await page.route('**/solutions/pdfsplat/**',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':csp}});});
 await page.goto('/solutions/pdfsplat/');
});
test('real local OCR reviews image text, edits it, exports selectable text and supports one-step Undo/Redo',async({page,context})=>{
 const external=[];context.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).hostname!=='127.0.0.1')external.push(r.url());});
 await fixture(page);await expect(page.locator('#textHitLayer .text-hit')).toHaveCount(0);await recognize(page);
 const lines=page.locator('#ocrResults textarea');expect(await lines.count()).toBeGreaterThanOrEqual(3);await expect(lines.nth(1)).toHaveValue(/Evaporation changes water into vapor/);
 await page.locator('#ocrDialog').screenshot({path:'/tmp/pdfsplat-ocr-detected-'+test.info().project.name+'.png'});
 await lines.nth(1).fill('This text is editable.');await page.locator('#ocrApply').click();await expect(page.locator('#ocrDialog')).not.toBeVisible();
 await expect(page.locator('.replacement-object')).toHaveCount(3);await expect(page.locator('.replacement-object').nth(1)).toContainText('This text is editable.');
 const bytes=await downloadPdf(page);expect(await textOf(page,bytes)).toContain('This text is editable.');expect(await textOf(page,bytes)).not.toContain('Evaporation changes');
 await page.locator('#undoButton').click();await expect(page.locator('.replacement-object')).toHaveCount(0);expect(await textOf(page,await downloadPdf(page))).not.toContain('This text is editable.');
 await page.locator('#redoButton').click();await expect(page.locator('.replacement-object')).toHaveCount(3);
 await recognize(page);await expect(page.locator('#ocrStatus')).toContainText('No new printed text');await expect(page.locator('#ocrApply')).toBeDisabled();expect(external).toEqual([]);
 await page.screenshot({path:'/tmp/pdfsplat-ocr-review-'+test.info().project.name+'.png',fullPage:true});
});
test('real Spanish OCR preserves accents and exports them as editable text',async({page})=>{
 await fixture(page,{spanish:true});await recognize(page,{language:'spa'});const values=await page.locator('#ocrResults textarea').evaluateAll(nodes=>nodes.map(n=>n.value).join('\n'));expect(values).toContain('evaporación');
 await page.locator('#ocrSelectAll').click();await page.locator('#ocrApply').click();expect(await textOf(page,await downloadPdf(page))).toContain('evaporación');
});
test('batch OCR skips existing selectable text and applies both scanned pages atomically',async({page})=>{
 await fixture(page,{mixed:true,pages:2});await recognize(page,{scope:'all'});await expect(page.locator('.ocr-page')).toHaveCount(2);
 expect((await page.locator('#ocrResults textarea').evaluateAll(nodes=>nodes.map(node=>node.value))).join(' ')).not.toContain('Existing selectable');await page.locator('#ocrApply').click();const text=await textOf(page,await downloadPdf(page));expect(text.match(/THE WATER CYCLE/g)).toHaveLength(2);expect(text.match(/Existing selectable text/g)).toHaveLength(2);
 await page.locator('#undoButton').click();const undone=await textOf(page,await downloadPdf(page));expect(undone).not.toContain('THE WATER CYCLE');expect(undone.match(/Existing selectable text/g)).toHaveLength(2);
});
test('Stop during engine loading terminates work, keeps the PDF unchanged and allows retry',async({page})=>{
 await fixture(page);await page.locator('#ocrButton').click();await page.locator('#ocrRun').click();await expect(page.locator('#ocrStop')).toBeEnabled();await page.locator('#ocrStop').click();await expect(page.locator('#ocrRun')).toBeEnabled({timeout:5000});await expect(page.locator('#ocrStatus')).toContainText('stopped');await expect(page.locator('.replacement-object')).toHaveCount(0);await page.locator('#ocrRun').click();await expect(page.locator('#ocrRun')).toBeEnabled({timeout:90000});await expect(page.locator('#ocrResults textarea')).toHaveCount(3);
});
test('closing an OCR review discards it and a blank scan adds no text',async({page})=>{
 await fixture(page);await recognize(page);await page.locator('#ocrClose').click();await expect(page.locator('.replacement-object')).toHaveCount(0);
 await fixture(page,{blank:true});await recognize(page);await expect(page.locator('#ocrStatus')).toContainText('No new printed text');await expect(page.locator('#ocrApply')).toBeDisabled();
});
test('review validates every line before Apply, allows exclusions and downloads corrected text',async({page})=>{
 await fixture(page);await recognize(page);const lines=page.locator('#ocrResults textarea');await lines.nth(1).fill('Unsupported 🐱');await page.locator('#ocrApply').click();await expect(page.locator('#ocrStatus')).toContainText('symbol this PDF font cannot save');await expect(page.locator('.replacement-object')).toHaveCount(0);
 await page.locator('#ocrResults input[type=checkbox]').nth(1).uncheck();const pending=page.waitForEvent('download');await page.locator('#ocrDownload').click();const text=await fs.readFile(await(await pending).path(),'utf8');expect(text).toContain('THE WATER CYCLE');expect(text).not.toContain('Unsupported');await page.locator('#ocrApply').click();await expect(page.locator('.replacement-object')).toHaveCount(2);
});
test('recognized boxes move independently of their covers and remain editable',async({page})=>{
 await fixture(page);await recognize(page);await page.locator('#ocrApply').click();const box=page.locator('.ocr-text').first(),cover=page.locator('.ocr-cover').first();await box.click();const original=await box.boundingBox(),anchor=await cover.boundingBox();const handle=await box.locator('.ocr-move-handle').boundingBox();expect(handle).not.toBeNull();await page.mouse.move(handle.x+10,handle.y+10);await page.mouse.down();await page.mouse.move(handle.x+90,handle.y+60,{steps:5});await page.mouse.up();const moved=await box.boundingBox();expect(moved.x-original.x).toBeGreaterThan(60);expect(moved.y-original.y).toBeGreaterThan(35);expect(await cover.boundingBox()).toEqual(anchor);
 await box.fill('Moved and corrected');await page.locator('#status').click();await expect(box.locator('.ocr-move-handle')).toHaveCount(1);await expect(box.locator('.resize-handle')).toHaveCount(1);expect(await textOf(page,await downloadPdf(page))).toContain('Moved and corrected');await page.screenshot({path:'/tmp/pdfsplat-ocr-applied-'+test.info().project.name+'.png',fullPage:true});
});
test('missing local model fails safely and retry works',async({page})=>{
 await fixture(page);await page.route('**/ocr/eng.traineddata',route=>route.fulfill({status:404,body:'not found'}));await page.locator('#ocrButton').click();await page.locator('#ocrRun').click();await expect(page.locator('#ocrRun')).toBeEnabled({timeout:30000});await expect(page.locator('#ocrStatus')).toContainText('could not finish');await expect(page.locator('.replacement-object')).toHaveCount(0);await page.unroute('**/ocr/eng.traineddata');await page.locator('#ocrRun').click();await expect(page.locator('#ocrRun')).toBeEnabled({timeout:90000});await expect(page.locator('#ocrResults textarea')).toHaveCount(3);
});
test('phone review fits the viewport and page limits reject large batches before recognition',async({page})=>{
 await page.setViewportSize({width:390,height:844});await fixture(page);await recognize(page);expect(await page.locator('#ocrDialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);await page.locator('#ocrApply').scrollIntoViewIfNeeded();await expect(page.locator('#ocrApply')).toBeVisible();await page.screenshot({path:'/tmp/pdfsplat-ocr-phone-'+test.info().project.name+'.png'});await page.locator('#ocrClose').click();
 await fixture(page,{pages:21,blank:true});await page.locator('#ocrButton').click();await page.locator('#ocrScope').selectOption('all');await page.locator('#ocrRun').click();await expect(page.locator('#ocrStatus')).toContainText('Choose 20 pages or fewer');await expect(page.locator('#ocrApply')).toBeDisabled();
});
test('OCR honors cropping and protects text placement from later page rotation',async({page})=>{
 await fixture(page);await page.locator('#toolGroup-pages').evaluate(n=>n.open=true);await page.locator('#cropButton').click();await page.locator('#cropTop').fill('35');await page.locator('#cropForm button[type=submit]').click();await recognize(page);const text=(await page.locator('#ocrResults textarea').evaluateAll(ns=>ns.map(n=>n.value))).join('\n');expect(text).not.toContain('THE WATER CYCLE');expect(text).toContain('Read this scanned sentence');await page.locator('#ocrApply').click();await page.locator('#rotateRightButton').click();await expect(page.locator('#status')).toContainText('Rotate pages before OCR');
 await page.locator('#undoButton').click();await expect(page.locator('.ocr-text')).toHaveCount(0);await page.locator('#customRotateButton').click();await page.locator('#customRotation').fill('2');await page.locator('#customRotateForm button[type=submit]').click();await page.locator('#ocrButton').click();await page.locator('#ocrRun').click();await expect(page.locator('#ocrStatus')).toContainText('fine rotation to 0°');await expect(page.locator('#ocrApply')).toBeDisabled();
});
test('large white lettering on a purple gradient keeps light ink and a purple cover; thumbnails reflect corrected OCR and export',async({page})=>{
 await fixture(page,{dark:true});await recognize(page);await page.locator('#ocrApply').click();const box=page.locator('.ocr-text').first();
 const colors=await box.evaluate(n=>({ink:getComputedStyle(n).color,background:getComputedStyle(n.previousElementSibling).backgroundColor}));const ink=colors.ink.match(/\d+/g).map(Number),background=colors.background.match(/\d+/g).map(Number);expect(Math.min(...ink.slice(0,3))).toBeGreaterThan(200);expect(background[0]).toBeLessThan(140);expect(background[1]).toBeLessThan(100);expect(background[2]).toBeLessThan(180);
 await box.fill('LIFE TREASURES');await page.locator('#status').click();const bytes=await downloadPdf(page);
 const expected=await page.evaluate(async bytes=>{const d=await pdfjsLib.getDocument({data:Uint8Array.from(bytes)}).promise,p=await d.getPage(1),v=p.getViewport({scale:.2}),c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;const data=c.toDataURL();await d.destroy();return data;},[...bytes]);
 await expect.poll(()=>page.locator('.thumbnail canvas').first().evaluate(c=>c.toDataURL()),{timeout:15000}).toBe(expected);await page.screenshot({path:'/tmp/pdfsplat-purple-ocr-'+test.info().project.name+'.png',fullPage:true});
});
