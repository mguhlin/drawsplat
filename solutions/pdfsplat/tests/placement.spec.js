const {test,expect}=require('@playwright/test');
const {PDFDocument,StandardFonts,degrees}=require('../vendor/pdf-lib.min.js');
const fs=require('fs/promises');
async function open(page, rotation=0) {
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);
 const p=pdf.addPage([400,600]);p.setRotation(degrees(rotation));
 p.drawText('Original document',{x:30,y:550,font,size:14});pdf.addPage([400,600]);
 await page.goto('/solutions/pdfsplat/');
 await page.locator('#fileInput').setInputFiles({name:'placement.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
 await expect(page.locator('#status')).toContainText('2 pages');
}
async function imageFile(page) {
 const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=200;c.height=100;const x=c.getContext('2d');x.fillStyle='#ff0000';x.fillRect(0,0,200,100);return c.toDataURL().split(',')[1]});
 return {name:'stamp.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
}
async function place(page,x,y,touch=false) {
 const layer=page.locator('#annotationLayer');
 await expect(page.locator('.placement-preview')).toBeVisible();
 await layer.evaluate((n,y)=>{const v=document.querySelector('#documentView'),r=n.getBoundingClientRect(),b=v.getBoundingClientRect();v.scrollTop+=r.top+y*r.height-(b.top+b.height/2)},y);
 const r=await layer.boundingBox();
 if(touch) await page.touchscreen.tap(r.x+x*r.width,r.y+y*r.height);
 else await page.mouse.click(r.x+x*r.width,r.y+y*r.height);
 await expect(page.locator('#placementTools')).toBeHidden();
}
async function coords(page,selector) {
 return page.locator(selector).last().evaluate(n=>({x:parseFloat(n.style.left)/100,y:parseFloat(n.style.top)/100,w:parseFloat(n.style.width)/100,h:parseFloat(n.style.height)/100}));
}
async function save(page) {
 const pending=page.waitForEvent('download');await page.locator('#saveAsSelect').selectOption('pdf');
 return fs.readFile(await (await pending).path());
}

test('text waits for a point and follows zoom, scrolling, undo and redo',async({page})=>{
 await open(page);await page.locator('#zoomInButton').click();await expect(page.locator('#zoomLabel')).toHaveText('110%');
 await page.locator('#addTextButton').click();await expect(page.locator('.text-object')).toHaveCount(0);
 await place(page,.42,.64);const c=await coords(page,'.text-object');
 expect(c.x).toBeCloseTo(.42,2);expect(c.y).toBeCloseTo(.64,2);
 await expect(page.locator('#undoButton')).toHaveText('Undo Add text');
 await page.locator('#undoButton').click();await expect(page.locator('.text-object')).toHaveCount(0);
 await page.locator('#redoButton').click();expect((await coords(page,'.text-object')).y).toBeCloseTo(.64,2);
});

test('cancel, switching tools and changing pages discard pending insertions',async({page})=>{
 await open(page);await page.locator('#addTextButton').click();await page.keyboard.press('Escape');
 await expect(page.locator('.text-object')).toHaveCount(0);await expect(page.locator('#undoButton')).toBeDisabled();
 await page.locator('#imageInput').setInputFiles(await imageFile(page));await expect(page.locator('#placementTools')).toBeVisible();
 await page.locator('#placementCancel').click();await expect(page.locator('.image-object')).toHaveCount(0);
 await page.locator('#imageInput').setInputFiles(await imageFile(page));await expect(page.locator('#placementTools')).toBeVisible();
 await page.locator('#nextPageButton').click();await expect(page.locator('#pagePosition')).toHaveText('2 / 2');
 await expect(page.locator('#placementTools')).toBeHidden();await expect(page.locator('#undoButton')).toBeDisabled();
 await page.locator('#addTextButton').click();await page.locator('#drawButton').click();
 await expect(page.locator('#placementTools')).toBeHidden();await expect(page.locator('.text-object')).toHaveCount(0);
});

test('typed and uploaded signatures use indicated points and one undo step',async({page})=>{
 await open(page);await page.locator('#signatureButton').click();await page.locator('#signatureText').fill('Teacher Name');
 await page.locator('#signatureForm button[type=submit]').click();await expect(page.locator('.text-object')).toHaveCount(0);
 await place(page,.25,.7);expect((await coords(page,'.text-object')).y).toBeCloseTo(.7,2);
 await page.locator('#signatureButton').click();await page.locator('#signatureImageInput').setInputFiles(await imageFile(page));
 await place(page,.5,.5);expect((await coords(page,'.image-object')).x).toBeCloseTo(.5,2);
 await expect(page.locator('#undoButton')).toHaveText('Undo Add signature');
 await page.locator('#undoButton').click();await expect(page.locator('.image-object')).toHaveCount(0);
 await page.locator('#redoButton').click();await expect(page.locator('.image-object')).toHaveCount(1);
 await save(page);
});

for(const rotation of [0,90,180,270]) {
 test(`saved text and image retain indicated visual coordinates at ${rotation} degrees`,async({page},info)=>{
  await open(page,rotation);await page.locator('#addTextButton').click();await place(page,.2,.3);
  await page.locator('#textValue').fill('Placed text');await page.locator('#textValue').press('Tab');
  await page.locator('#imageInput').setInputFiles(await imageFile(page));await place(page,.45,.55);
  const bytes=await save(page);
  const text=await page.evaluate(async bytes=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise,p=await doc.getPage(1),v=p.getViewport({scale:1}),content=await p.getTextContent();const item=content.items.find(i=>i.str==='Placed text');const [x,y]=v.convertToViewportPoint(item.transform[4],item.transform[5]);await doc.destroy();return {x:x/v.width,y:y/v.height,font:item.height,height:v.height}},[...bytes]);
  expect(text.x).toBeCloseTo(.2,2);expect(text.y-18/text.height).toBeCloseTo(.3,2);
  await page.locator('#fileInput').setInputFiles({name:'saved.pdf',mimeType:'application/pdf',buffer:bytes});await expect(page.locator('#status')).toContainText('2 pages');
  await expect.poll(()=>page.locator('#pdfCanvas').evaluate(c=>{const p=c.getContext('2d').getImageData(Math.round(c.width*.5),Math.round(c.height*.59),1,1).data;return p[0]>230&&p[1]<30&&p[2]<30})).toBe(true);
  if(rotation===90&&info.project.name==='chromium'){await fs.mkdir('/tmp/pdfsplat-placement',{recursive:true});await fs.writeFile('/tmp/pdfsplat-placement/rotated.pdf',bytes);await page.screenshot({path:'/tmp/pdfsplat-placement/reopened.png'});}
 });
}

test('keyboard placement keeps objects on the page and does not navigate',async({page})=>{
 await open(page);await page.locator('#addTextButton').click();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');
 await page.keyboard.press('Enter');const c=await coords(page,'.text-object');expect(c.x).toBeCloseTo(.36,2);expect(c.y).toBeCloseTo(.36,2);
 await expect(page.locator('#pagePosition')).toHaveText('1 / 2');
 await page.locator('#imageInput').setInputFiles(await imageFile(page));await place(page,.98,.98);
 const image=await coords(page,'.image-object');expect(image.x+image.w).toBeLessThanOrEqual(1.001);expect(image.y+image.h).toBeLessThanOrEqual(1.001);
});

test('tool search discovers and invokes existing tools, with disabled and empty results',async({page})=>{
 await page.goto('/solutions/pdfsplat/');await page.keyboard.press('Control+k');
 await page.locator('#toolSearchInput').fill('signature');await expect(page.locator('#toolSearchResults button')).toBeDisabled();
 await page.locator('#toolSearchInput').fill('nonexistent');await expect(page.locator('#toolSearchCount')).toContainText('No matching');await page.keyboard.press('Escape');
 await open(page);await page.keyboard.press('Control+k');await page.locator('#toolSearchInput').fill('Add text');await page.keyboard.press('Enter');
 await expect(page.locator('#toolSearchDialog')).toBeHidden();await expect(page.locator('#placementTools')).toBeVisible();
 await page.screenshot({path:'/tmp/pdfsplat-placement-preview.png'});await page.keyboard.press('Escape');
 await page.locator('#toolSearchButton').click();await page.locator('#toolSearchInput').fill('Rotate right');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await expect(page.locator('#undoButton')).toHaveText('Undo Rotate pages');
});

test('phone tapping places text and images at page points',async({page},info)=>{
 test.skip(info.project.name!=='iphone','real touch placement on iPhone');
 await open(page);await page.locator('#addTextButton').click();await place(page,.3,.4,true);
 expect((await coords(page,'.text-object')).x).toBeCloseTo(.3,2);
 await page.locator('#imageInput').setInputFiles(await imageFile(page));await place(page,.2,.65,true);
 expect((await coords(page,'.image-object')).y).toBeCloseTo(.65,2);
 await page.screenshot({path:'/tmp/pdfsplat-placement-phone.png'});
});
