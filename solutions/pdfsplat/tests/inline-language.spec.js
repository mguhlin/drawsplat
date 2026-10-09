const {test,expect}=require('@playwright/test');
const {PDFDocument,StandardFonts,degrees}=require('../vendor/pdf-lib.min.js');
const fs=require('fs/promises');
async function open(page,rotation=0){
 const pdf=await PDFDocument.create(),f=await pdf.embedFont(StandardFonts.Helvetica);const p=pdf.addPage([400,600]);p.setRotation(degrees(rotation));p.drawText('Original document',{x:30,y:550,font:f,size:14});pdf.addPage([400,600]);
 await page.goto('/solutions/pdfsplat/');await page.locator('#fileInput').setInputFiles({name:'inline.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});await expect(page.locator('#status')).toContainText('2 pages');
}
async function add(page){await page.locator('#addTextButton').click();await page.locator('#annotationLayer').press('Enter');await expect(page.locator('.inline-text-editor')).toBeVisible();}
async function save(page){const pending=page.waitForEvent('download');await page.locator('#saveAsSelect').selectOption('pdf');return fs.readFile(await(await pending).path());}
test('inline typing, formatting, undo and sidebar editing remain compatible',async({page},info)=>{
 test.skip(info.project.name==='iphone','desktop sidebar workflow');
 await open(page);await add(page);const editor=page.locator('.inline-text-editor');await editor.fill('Hello - + 0\nSecond line');
 await page.locator('[data-text-format="bold"]').click();await page.locator('[data-text-format="italic"]').click();await page.locator('[data-text-align="center"]').click();
 await expect(editor).toBeFocused();await expect(editor).toHaveCSS('font-weight','700');await expect(editor).toHaveCSS('font-style','italic');await expect(editor).toHaveCSS('text-align','center');
 await editor.press('End');await editor.press('-');await expect(page.locator('#zoomLabel')).toHaveText('100%');
 await page.locator('#finishInlineText').click();await expect(editor).toHaveCount(0);await expect(page.locator('.text-object')).toContainText('Second line-');
 await page.locator('#undoButton').click();await expect(page.locator('.text-object')).toContainText('Second line');await page.locator('#redoButton').click();
 await page.locator('.text-object').click();await page.locator('#textValue').fill('Sidebar still works');await page.locator('#textValue').press('Tab');await expect(page.locator('.text-object')).toContainText('Sidebar still works');
 await page.locator('.text-object').dblclick();await page.locator('.inline-text-editor').fill('Welcome');await page.locator('.inline-text-editor').press('Escape');
 await expect(page.locator('.text-object')).toHaveCSS('font-weight','700');await expect(page.locator('.text-object')).toHaveCSS('text-align','center');
 await page.screenshot({path:'/tmp/pdfsplat-inline-format.png'});
});
for(const rotation of [0,90,180,270]) test(`formatted text exports at indicated point on ${rotation} degree page`,async({page})=>{
 await open(page,rotation);await add(page);await page.locator('.inline-text-editor').fill('Welcome');
 await page.locator('[data-text-format="bold"]').click();await page.locator('[data-text-format="italic"]').click();await page.locator('[data-text-align="right"]').click();
 const position=await page.locator('.text-object').evaluate(n=>({x:parseFloat(n.style.left)/100,y:parseFloat(n.style.top)/100,w:parseFloat(n.style.width)/100}));
 const bytes=await save(page);const exported=await PDFDocument.load(bytes);const names=exported.context.enumerateIndirectObjects().map(([,obj])=>obj.toString()).join('\n');expect(names).toContain('/Helvetica-BoldOblique');
 const result=await page.evaluate(async(b)=>{const d=await pdfjsLib.getDocument({data:Uint8Array.from(atob(b),c=>c.charCodeAt(0))}).promise;const p=await d.getPage(1),v=p.getViewport({scale:1});const t=(await p.getTextContent()).items.find(i=>i.str==='Welcome');const xy=v.convertToViewportPoint(t.transform[4],t.transform[5]);const r={rotation:p.rotate,width:v.width,height:v.height,x:xy[0],y:xy[1],textWidth:t.width,secondRotation:(await d.getPage(2)).rotate};await d.destroy();return r;},bytes.toString('base64'));
 expect(result.rotation).toBe(rotation);expect(result.secondRotation).toBe(0);// PDF.js and standard-font kerning metrics differ by less than one point.
 expect(Math.abs(result.x-((position.x+position.w)*result.width-result.textWidth))).toBeLessThan(1);expect(result.y).toBeCloseTo(position.y*result.height+18,0);
 await page.locator('#fileInput').setInputFiles({name:'saved.pdf',mimeType:'application/pdf',buffer:bytes});await expect(page.locator('#status')).toContainText('2 pages');
});
test('language switching translates changing UI without translating document text',async({page})=>{
 await open(page);await add(page);await page.locator('.inline-text-editor').fill('Draw');await page.locator('#finishInlineText').click();
 const picker=page.locator('[data-pdf-language]');
 for(const [code,draw,bold,done] of [['es','Dibujar','Negrita','Terminar dibujo'],['vi','Vẽ','Đậm','Vẽ xong'],['ar','رسم','عريض','إنهاء الرسم'],['zh','绘图','粗体','完成绘图'],['uh','चित्र / رسم','मोटा / جلی','चित्र पूरा / رسم مکمل']]){
  await picker.selectOption(code);await expect(page.locator('#drawButton')).toHaveText(draw);await expect(page.locator('[data-text-format="bold"] span')).toHaveText(bold);await expect(page.locator('.text-object')).toHaveText('Draw');
  await page.locator('#drawButton').click();await expect(page.locator('#inkDone')).toHaveText(done);await expect(page.locator('#inkTools')).not.toContainText('Pen color');await page.locator('#inkDone').click();
 }
 await picker.selectOption('es');await page.locator('#drawButton').click();
 await page.locator('#annotationLayer').evaluate(n=>{const v=document.querySelector('#documentView');v.scrollTop=0;});const r=await page.locator('#annotationLayer').boundingBox();await page.mouse.move(r.x+40,r.y+40);await page.mouse.down();await page.mouse.move(r.x+70,r.y+70);await page.mouse.up();
 await expect(page.locator('#undoButton')).toHaveText('Deshacer Dibujar');await expect(page.locator('#status')).toContainText('Trazo añadido');
 await page.locator('#inkDone').click();await page.locator('#toolSearchButton').click();await page.locator('#toolSearchInput').fill('firma');await expect(page.locator('#toolSearchResults')).toContainText('Añadir firma');await page.keyboard.press('Escape');
 await picker.selectOption('en');await expect(page.locator('#undoButton')).toHaveText('Undo Draw');await expect(page.locator('#inkDone')).toHaveText('Done drawing');await expect(page.locator('.text-object')).toHaveText('Draw');
});
test('phone places and edits text using its on-page editor',async({page},info)=>{
 test.skip(info.project.name!=='iphone','touch interaction');await open(page);await add(page);await page.locator('.inline-text-editor').fill('Mobile text');await page.locator('[data-text-format="bold"]').tap();await page.locator('[data-text-align="center"]').tap();await page.locator('#finishInlineText').tap();await expect(page.locator('.text-object')).toContainText('Mobile text');await expect(page.locator('.text-object')).toHaveCSS('text-align','center');await page.screenshot({path:'/tmp/pdfsplat-inline-phone.png'});
});
test('replacement text formatting keeps text edits and style edits as separate undo steps',async({page},info)=>{
 test.skip(info.project.name==='iphone','desktop cover editing');await open(page);await page.locator('#editTextButton').click();await page.getByRole('button',{name:'Edit text: Original document'}).click();const editor=page.getByRole('textbox',{name:'Edit replacement text in place'});await editor.fill('Replacement');await page.locator('[data-text-format="bold"]').click();await editor.press('Tab');await expect(editor).toHaveCSS('font-weight','700');await page.locator('#undoButton').click();await expect(page.locator('.replacement-object')).toContainText('Replacement');await expect(page.locator('.replacement-object')).toHaveCSS('font-weight','400');await page.locator('#undoButton').click();await expect(page.locator('.replacement-object')).toContainText('Original document');
});
