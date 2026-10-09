const {test,expect}=require('@playwright/test');
const {PDFDocument,StandardFonts,degrees}=require('../vendor/pdf-lib.min.js');
const fs=require('fs/promises');
async function fixture(page,secondRotation) {
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);
 pdf.addPage([400,600]).drawText('First upright',{x:40,y:550,font,size:18});
 const second=pdf.addPage([400,600]);second.setRotation(degrees(secondRotation));
 const positions={0:[40,550],90:[50,40],180:[360,50],270:[350,560]};
 const [x,y]=positions[secondRotation];
 second.drawText('Second upright',{x,y,font,size:18,rotate:degrees(secondRotation)});
 await page.goto('/solutions/pdfsplat/');await page.locator('#fileInput').setInputFiles({name:'rotations.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
 await expect(page.locator('#status')).toContainText('2 pages');
}
async function crop(page) {
 await page.locator('#toolGroup-pages').evaluate(n=>n.open=true);await page.locator('#cropButton').click();
 await page.locator('#cropTop').fill('5');await page.locator('#cropForm button[type=submit]').click();
}
async function save(page) {
 const pending=page.waitForEvent('download');await page.locator('#saveAsSelect').selectOption('pdf');return fs.readFile(await (await pending).path());
}
async function upright(page,bytes,number=2) {
 return page.evaluate(async({bytes,number})=>{
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise,p=await pdf.getPage(number),v=p.getViewport({scale:1});
  const item=(await p.getTextContent()).items.find(i=>i.str.includes('upright'));
  const a=v.convertToViewportPoint(item.transform[4],item.transform[5]),b=v.convertToViewportPoint(item.transform[4]+item.transform[0],item.transform[5]+item.transform[1]);
  await pdf.destroy();return {dx:b[0]-a[0],dy:b[1]-a[1]};
 },{bytes:[...bytes],number});
}
for(const rotation of [0,90,180,270]) {
 test(`cropping page one preserves page two's ${rotation}-degree orientation`,async({page},info)=>{
  await fixture(page,rotation);await crop(page);const bytes=await save(page);
  const pdf=await PDFDocument.load(bytes);expect(pdf.getPage(1).getRotation().angle).toBe(rotation);
  if(rotation===180&&info.project.name==='chromium'){await fs.mkdir('/tmp/pdfsplat-rotation',{recursive:true});await fs.writeFile('/tmp/pdfsplat-rotation/untouched-second.pdf',bytes);}
  const direction=await upright(page,bytes);expect(direction.dx).toBeGreaterThan(10);expect(Math.abs(direction.dy)).toBeLessThan(.01);
 });
 test(`cropping rotated page two retains upright content at ${rotation} degrees`,async({page},info)=>{
  await fixture(page,rotation);await page.locator('#nextPageButton').click();await expect(page.locator('#pagePosition')).toHaveText('2 / 2');
  await crop(page);const bytes=await save(page);const direction=await upright(page,bytes);
  expect(direction.dx).toBeGreaterThan(10);expect(Math.abs(direction.dy)).toBeLessThan(.01);
  const pdf=await PDFDocument.load(bytes);expect(pdf.getPage(0).getSize()).toEqual({width:400,height:600});
  if(rotation===180&&info.project.name==='chromium'){await fs.mkdir('/tmp/pdfsplat-rotation',{recursive:true});await fs.writeFile('/tmp/pdfsplat-rotation/cropped-second.pdf',bytes);}
  const expected=rotation%180===0?{width:400,height:570}:{width:600,height:380};expect(pdf.getPage(1).getSize()).toEqual(expected);
 });
}

test('deskewing page one also preserves an upright page two',async({page})=>{
 await fixture(page,180);await page.locator('#toolGroup-pages').evaluate(n=>n.open=true);
 await page.locator('#customRotateButton').click();await page.locator('#customRotation').fill('2');
 await page.locator('#customRotateForm button[type=submit]').click();const bytes=await save(page);
 const pdf=await PDFDocument.load(bytes);expect(pdf.getPage(1).getRotation().angle).toBe(180);
 const direction=await upright(page,bytes);expect(direction.dx).toBeGreaterThan(10);expect(Math.abs(direction.dy)).toBeLessThan(.01);
});
