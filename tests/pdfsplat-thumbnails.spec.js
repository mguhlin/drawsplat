const {test,expect}=require('@playwright/test');
const {PDFDocument,rgb}=require('../solutions/pdfsplat/vendor/pdf-lib.min.js');
test.use({viewport:{width:1280,height:1000}});
async function ink(locator){return locator.evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>0&&(d[i]<230||d[i+1]<230||d[i+2]<230))n++;return n;});}
test('thumbnails retain page content through duplication and blank insertion',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PDF_THUMBNAILS_URL || '/solutions/pdfsplat/');
 const doc=await PDFDocument.create();
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=800;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,600,800);g.fillStyle='#153a73';g.fillRect(60,80,480,180);g.fillStyle='#000';g.font='42px sans-serif';g.fillText('Worksheet content',60,370);return c.toDataURL().split(',')[1];});
 const image=await doc.embedPng(Buffer.from(png,'base64'));doc.addPage([600,800]).drawImage(image,{x:0,y:0,width:600,height:800});
 await page.locator('#fileInput').setInputFiles({name:'worksheet.pdf',mimeType:'application/pdf',buffer:Buffer.from(await doc.save())});await expect(page.locator('#status')).toContainText('worksheet.pdf opened.');
 const thumbs=page.locator('#thumbnails canvas');await expect.poll(()=>ink(thumbs.nth(0))).toBeGreaterThan(1000);
 await page.locator('#toolGroup-pages').evaluate(e=>e.open=true);await page.locator('#duplicatePageButton').click();await expect(thumbs).toHaveCount(2);await expect.poll(()=>ink(thumbs.nth(0))).toBeGreaterThan(1000);await expect.poll(()=>ink(thumbs.nth(1))).toBeGreaterThan(1000);
 await page.locator('#thumbnails .thumbnail').nth(0).click();
 // Hold thumbnail painting, as on a slow device, while inserting another page.
 await page.evaluate(async bytes=>{
  const probe=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;
  const prototype=Object.getPrototypeOf(await probe.getPage(1)),render=prototype.render;
  window.releaseThumbnailPaints=[];
  prototype.render=function(options){
   if(Math.abs(options.viewport.scale-.2)>.001)return render.call(this,options);
   let task;const gate=new Promise(resolve=>window.releaseThumbnailPaints.push(resolve));
   return {promise:gate.then(()=>{task=render.call(this,options);return task.promise;}),cancel(){task?.cancel();}};
  };
  await probe.destroy();
 },Array.from(await doc.save()));
 await page.locator('#blankPageButton').click();await expect(page.locator('#status')).toContainText('Blank page inserted');await expect(thumbs).toHaveCount(3);
 // Previously painted pages must stay visible even while new previews are pending.
 expect(await ink(thumbs.nth(0))).toBeGreaterThan(1000);
 expect(await ink(thumbs.nth(2))).toBeGreaterThan(1000);
 await page.evaluate(()=>{window.releaseThumbnailPaints.splice(0).forEach(release=>release());});
 await page.locator('#thumbnails .thumbnail').nth(0).click();
 await page.evaluate(()=>{window.releaseThumbnailPaints.splice(0).forEach(release=>release());});
 await expect.poll(()=>ink(thumbs.nth(0))).toBeGreaterThan(1000);await expect.poll(()=>ink(thumbs.nth(1))).toBe(0);await expect.poll(()=>ink(thumbs.nth(2))).toBeGreaterThan(1000);expect(errors).toEqual([]);
});
async function pixel(locator,x=.5,y=.5){return locator.evaluate((c,{x,y})=>[...c.getContext('2d').getImageData(Math.floor(c.width*x),Math.floor(c.height*y),1,1).data],{x,y});}
test('blank and edited previews follow their pages through undo, redo and reorder',async({page})=>{
 await page.goto(process.env.PDF_THUMBNAILS_URL || '/solutions/pdfsplat/');
 const doc=await PDFDocument.create();for(const color of [rgb(0,0,1),rgb(1,0,0)])doc.addPage([600,800]).drawRectangle({x:0,y:0,width:600,height:800,color});
 await page.locator('#fileInput').setInputFiles({name:'colors.pdf',mimeType:'application/pdf',buffer:Buffer.from(await doc.save())});await expect(page.locator('#status')).toContainText('colors.pdf opened.');
 const thumbs=page.locator('#thumbnails canvas');await expect.poll(()=>pixel(thumbs.nth(0))).toEqual([0,0,255,255]);await expect.poll(()=>pixel(thumbs.nth(1))).toEqual([255,0,0,255]);
 await page.locator('#toolGroup-pages').evaluate(e=>e.open=true);await page.locator('#blankPageButton').click();await expect(page.locator('#status')).toContainText('Blank page inserted');
 await expect(thumbs).toHaveCount(3);await expect.poll(()=>pixel(thumbs.nth(0))).toEqual([0,0,255,255]);await expect.poll(()=>pixel(thumbs.nth(1))).toEqual([255,255,255,255]);await expect.poll(()=>pixel(thumbs.nth(2))).toEqual([255,0,0,255]);
 await page.locator('#highlightButton').click();await expect.poll(()=>ink(thumbs.nth(1))).toBeGreaterThan(100);
 await page.locator('#undoButton').click();await expect.poll(()=>ink(thumbs.nth(1))).toBe(0);
 await page.locator('#undoButton').click();await expect(thumbs).toHaveCount(2);expect(await pixel(thumbs.nth(0))).toEqual([0,0,255,255]);expect(await pixel(thumbs.nth(1))).toEqual([255,0,0,255]);
 await page.locator('#redoButton').click();await expect(thumbs).toHaveCount(3);await page.locator('#reversePagesButton').click();
 await expect.poll(()=>pixel(thumbs.nth(0))).toEqual([255,0,0,255]);await expect.poll(()=>pixel(thumbs.nth(1))).toEqual([255,255,255,255]);await expect.poll(()=>pixel(thumbs.nth(2))).toEqual([0,0,255,255]);
 await expect(page.locator('#thumbnails [data-preview-error]')).toHaveCount(0);
});
