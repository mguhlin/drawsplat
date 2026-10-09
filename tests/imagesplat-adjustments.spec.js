const {test,expect}=require('@playwright/test');
test('photo adjustments preserve alpha and source pixels',async({page})=>{
 await page.goto('/solutions/imagesplat/');
 const result=await page.evaluate(async()=>{
  const {adjustPixels}=await import('/solutions/imagesplat/photo-adjustments.js');
  const source=new ImageData(new Uint8ClampedArray([80,100,120,128]),1,1);
  const neutral={brightness:0,contrast:0,saturation:0,warmth:0};
  return {neutral:[...adjustPixels(source,neutral).data],bright:[...adjustPixels(source,{...neutral,brightness:20}).data],source:[...source.data]};
 });
 expect(result).toEqual({neutral:[80,100,120,128],bright:[131,151,171,128],source:[80,100,120,128]});
});
test('preview, cancel, apply, undo and redo preserve the image workflow',async({page})=>{
 await page.goto('/solutions/imagesplat/');
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=100;const x=c.getContext('2d');x.fillStyle='rgb(80,100,120)';x.fillRect(0,0,1000,100);return c.toDataURL().split(',')[1]});
 await page.locator('#imageInput').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await expect(page.locator('#docInfo')).toContainText('1 layers');
 const open=async()=>{await page.getByRole('button',{name:'Adjust photo…',exact:true}).click();await expect(page.locator('#photoAdjustDialog')).toBeVisible()};
 const pixel=()=>page.locator('#photoBefore').evaluate(c=>[...c.getContext('2d').getImageData(20,20,1,1).data]);
 const change=()=>page.locator('#photo-brightness').evaluate(e=>{e.value=20;e.dispatchEvent(new Event('input',{bubbles:true}))});
 await open();await change();
 expect(await page.locator('#photoAfter').evaluate(c=>[...c.getContext('2d').getImageData(20,20,1,1).data])).toEqual([131,151,171,255]);
 await page.keyboard.press('Escape');await open();expect(await pixel()).toEqual([80,100,120,255]);
 await change();await page.getByRole('button',{name:'Apply to layer',exact:true}).click();await expect(page.locator('#photoAdjustDialog')).toHaveCount(0);
 await open();expect(await pixel()).toEqual([131,151,171,255]);await page.keyboard.press('Escape');
 await page.locator('.toolbar [data-action="undo"]').click();await page.locator('.layer .name').click();await open();expect(await pixel()).toEqual([80,100,120,255]);await page.keyboard.press('Escape');
 await page.locator('.toolbar [data-action="redo"]').click();await page.locator('.layer .name').click();await open();expect(await pixel()).toEqual([131,151,171,255]);
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.getByRole('button',{name:'Apply to layer',exact:true})).toBeDisabled();
 await page.screenshot({path:'.tmp/imagesplat-adjustments-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.tmp/imagesplat-adjustments-mobile.png'});
});
