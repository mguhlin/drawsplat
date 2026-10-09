const {test,expect}=require('@playwright/test');
const {PDFDocument,StandardFonts,rgb}=require('../vendor/pdf-lib.min.js');
const fs=require('fs/promises');
for(const [fontName,family,color] of [['Helvetica','Arial',[0,.2,.4]],['TimesRomanBoldItalic','Times',[.6,.1,.2]],['CourierOblique','Courier',[.1,.5,.2]]])test(`replacement inherits ${fontName} appearance and exports matching family`,async({page})=>{
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts[fontName]);pdf.addPage([500,300]).drawText('Original text',{x:30,y:240,font,size:20,color:rgb(...color)});
 await page.goto('/solutions/pdfsplat/');await page.locator('#fileInput').setInputFiles({name:'appearance.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});await page.locator('#editTextButton').click();await page.getByRole('button',{name:'Edit text: Original text'}).click();
 const replacement=page.locator('.replacement-object');await expect(replacement).toHaveCSS('font-family',new RegExp(family));
 const detected=await page.locator('#textColor').inputValue();const actual=detected.match(/\w{2}/g).map(v=>parseInt(v,16));actual.forEach((v,i)=>expect(Math.abs(v-Math.round(color[i]*255))).toBeLessThan(4));
 await expect(page.locator('[data-text-format="bold"]')).toHaveAttribute('aria-pressed',String(/Bold/.test(fontName)));await expect(page.locator('[data-text-format="italic"]')).toHaveAttribute('aria-pressed',String(/Italic|Oblique/.test(fontName)));
 await page.getByRole('textbox',{name:'Edit replacement text in place'}).fill('Updated text');await page.getByRole('textbox',{name:'Edit replacement text in place'}).press('Tab');
 const pending=page.waitForEvent('download');await page.locator('#saveAsSelect').selectOption('pdf');const bytes=await fs.readFile(await(await pending).path());const exported=await PDFDocument.load(bytes);expect(exported.context.enumerateIndirectObjects().map(([,obj])=>obj.toString()).join('\n')).toContain('/'+StandardFonts[fontName]);
 await page.locator('#textColor').fill('#8844cc');await page.locator('#textColor').dispatchEvent('change');await expect(replacement).toHaveCSS('color','rgb(136, 68, 204)');await page.locator('#undoButton').click();await expect(replacement).toHaveCSS('color',`rgb(${actual.join(', ')})`);
 await page.screenshot({path:`/tmp/pdfsplat-match-${fontName}-${test.info().project.name}.png`});
});
test('light text on a dark background inherits its ink color',async({page})=>{
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);const p=pdf.addPage([500,300]);p.drawRectangle({x:0,y:0,width:500,height:300,color:rgb(.1,.1,.1)});p.drawText('White text',{x:30,y:240,size:20,font,color:rgb(1,1,1)});await page.goto('/solutions/pdfsplat/');await page.locator('#fileInput').setInputFiles({name:'dark.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});await page.locator('#editTextButton').click();await page.getByRole('button',{name:'Edit text: White text'}).click();await expect(page.locator('#textColor')).toHaveValue('#ffffff');await expect(page.locator('.replacement-object')).toHaveCSS('background-color','rgb(26, 26, 26)');
});
