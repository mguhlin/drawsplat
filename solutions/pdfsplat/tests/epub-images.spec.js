const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts } = require('../vendor/pdf-lib.min.js');
const JSZip = require('../../../vendor/jszip.min.js');
const fs = require('fs/promises');
async function fixture(page) {
  await page.goto('/solutions/pdfsplat/');
  const png = Buffer.from(await page.evaluate(() => {
    const c=document.createElement('canvas'); c.width=100; c.height=60;
    const ctx=c.getContext('2d'); ctx.fillStyle='#ff0000'; ctx.fillRect(0,0,100,60);
    return c.toDataURL().split(',')[1];
  }), 'base64');
  const doc=await PDFDocument.create(), font=await doc.embedFont(StandardFonts.Helvetica), image=await doc.embedPng(png);
  const first=doc.addPage([400,600]);
  first.drawText('Text before the picture.',{x:40,y:540,size:16,font});
  first.drawImage(image,{x:40,y:300,width:200,height:120});
  first.drawText('Text after the picture.',{x:40,y:240,size:16,font});
  const scan=doc.addPage([400,600]); scan.drawImage(image,{x:0,y:0,width:400,height:600});
  await page.locator('#fileInput').setInputFiles({name:'illustrated.pdf',mimeType:'application/pdf',buffer:Buffer.from(await doc.save())});
  await expect(page.locator('#status')).toContainText('2 pages');
}
async function epub(page, combined=false) {
  await page.locator('#saveAsSelect').selectOption('epub');
  await page.locator('#epubTitle').fill('Illustrated book');
  if(combined) await page.locator('#epubPageChapters').uncheck();
  const pending=page.waitForEvent('download'); await page.locator('#epubRun').click();
  return JSZip.loadAsync(await fs.readFile(await (await pending).path()));
}
async function pixel(page,bytes,x=.5,y=.5) {
  return page.evaluate(async ({data,x,y})=>{
    const bitmap=await createImageBitmap(new Blob([Uint8Array.from(data)],{type:'image/png'}));
    const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;
    c.getContext('2d').drawImage(bitmap,0,0);const rgba=[...c.getContext('2d').getImageData(Math.floor(x*c.width),Math.floor(y*c.height),1,1).data];
    bitmap.close();return {rgba,width:c.width,height:c.height};
  },{data:[...bytes],x,y});
}
for(const combined of [false,true]) test(`EPUB retains selectable text and embedded images with combined sections=${combined}`,async({page})=>{
  await fixture(page); const zip=await epub(page,combined);
  const html=await zip.file('EPUB/chapter-1.xhtml').async('string');
  expect(html).toContain('Text before the picture.'); expect(html).toContain('Text after the picture.');
  const imageIndex=html.indexOf('src="image-1-1.png"');
  expect(imageIndex).toBeGreaterThan(html.indexOf('Text before the picture.'));
  expect(imageIndex).toBeLessThan(html.indexOf('Text after the picture.'));
  const opf=await zip.file('EPUB/package.opf').async('string');
  expect(opf).toContain('href="image-1-1.png" media-type="image/png"');
  expect(opf).toContain('href="image-2-1.png" media-type="image/png"');
  expect(opf).toContain('<meta property="schema:accessMode">textual</meta>');
  expect(opf).toContain('<meta property="schema:accessMode">visual</meta>');
  const figure=await pixel(page,await zip.file('EPUB/image-1-1.png').async('uint8array'));
  expect(figure.rgba).toEqual([255,0,0,255]); expect(figure.width/figure.height).toBeCloseTo(200/120,1);
  const scan=await pixel(page,await zip.file('EPUB/image-2-1.png').async('uint8array')); expect(scan.rgba).toEqual([255,0,0,255]);
  const xml=await Promise.all(Object.values(zip.files).filter(f=>/\.(xhtml|opf|ncx|xml)$/.test(f.name)).map(f=>f.async('string')));
  expect(await page.evaluate(files=>files.every(s=>!new DOMParser().parseFromString(s,'application/xml').querySelector('parsererror')),xml)).toBe(true);
  await expect(page.locator('#status')).toContainText('1 page(s) have no selectable text');
});
test('EPUB images retain visual removal instead of revealing the original image',async({page})=>{
  await fixture(page);
  await page.locator('#removeAreaButton').evaluate(button=>button.click());
  // Bring the picture into view before sending raw pointer coordinates.
  await page.locator('#documentView').evaluate(node=>node.scrollTop=220);
  const box=await page.locator('#annotationLayer').boundingBox();
  // Cover the middle of the embedded red picture with PDFSplat’s visual mask.
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.34);
  await page.mouse.down(); await page.mouse.move(box.x+box.width*.5,box.y+box.height*.48); await page.mouse.up();
  await expect(page.locator('.mask-object')).toHaveCount(1);
  const zip=await epub(page),bytes=await zip.file('EPUB/image-1-1.png').async('uint8array');
  expect((await pixel(page,bytes)).rgba).toEqual([255,255,255,255]);
  expect((await pixel(page,bytes,.05,.05)).rgba).toEqual([255,0,0,255]);
});
test('cropped pages retain their visible embedded image regions through nested PDF forms',async({page})=>{
  await fixture(page);
  await page.locator('#cropButton').evaluate(button=>button.click());
  await page.locator('#cropTop').fill('5');await page.locator('#cropForm button[type="submit"]').click();
  const zip=await epub(page);expect(zip.file('EPUB/image-1-1.png')).not.toBeNull();
  expect((await pixel(page,await zip.file('EPUB/image-1-1.png').async('uint8array'))).rgba).toEqual([255,0,0,255]);
});
