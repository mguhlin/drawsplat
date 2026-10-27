const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
test('larger text controls grow picture captions and survive project roundtrip',async({page})=>{
 await page.goto('/solutions/fontsplat/');await expect(page.locator('#dimensions')).toContainText('×');
 await page.locator('#text').fill('Happy birthday, Miguel!');await page.locator('#autoCutout').uncheck();await page.locator('#imageFile').setInputFiles('tests/fixtures/layoutsplat/sample.png');await page.locator('[data-image-layout="above"]').click();
 await page.locator('#sizeNumber').fill('400');await page.locator('#sizeNumber').dispatchEvent('change');await expect(page.locator('#size')).toHaveValue('400');
 await page.locator('#biggerText').click();await expect(page.locator('#sizeNumber')).toHaveValue('480');await page.locator('#smallerText').click();await expect(page.locator('#sizeNumber')).toHaveValue('400');
 await page.locator('#sizeNumber').fill('640');await page.locator('#sizeNumber').dispatchEvent('change');await page.locator('#biggerText').click();await expect(page.locator('#size')).toHaveValue('640');
 await page.locator('summary').filter({hasText:'Your own font & project'}).click();
 const saved=page.waitForEvent('download');await page.locator('#saveProject').click();const bytes=await fs.readFile(await(await saved).path());const project=JSON.parse(bytes);expect(project.size).toBe(640);expect(project.images).toHaveLength(1);
 await page.locator('#reset').click();await page.locator('#projectFile').setInputFiles({name:'large.fontsplat.json',mimeType:'application/json',buffer:bytes});await expect(page.locator('#sizeNumber')).toHaveValue('640');
 const png=page.waitForEvent('download');await page.locator('#png').click();const pngBytes=await fs.readFile(await(await png).path());const width=pngBytes.readUInt32BE(16),height=pngBytes.readUInt32BE(20);expect(width*height).toBeLessThanOrEqual(16000000);expect(Math.max(width,height)).toBeLessThanOrEqual(8192);
});
test('sidebar groups keep related controls together and remain usable on phones',async({page})=>{
 await page.goto('/solutions/fontsplat/');await expect(page.locator('#textControls #text')).toHaveCount(1);await expect(page.locator('#textControls #sizeNumber')).toHaveCount(1);await expect(page.locator('#pictureControls #imageWidth')).toHaveCount(1);await expect(page.locator('#projectControls #saveProject')).toHaveCount(1);
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole('button',{name:'Make text bigger',exact:true})).toBeVisible();await page.locator('#biggerText').click();await expect(page.locator('#sizeNumber')).toHaveValue('115');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('large-text animation uses the current renderer for returning browsers',async({page})=>{
 const stale=[];await page.route('**/engine.mjs?v=20261027-bounds',route=>{stale.push(route.request().url());return route.abort();});await page.goto('/solutions/fontsplat/');await expect(page.locator('#dimensions')).toContainText('×');await page.locator('#text').fill('Bigger');await page.locator('#sizeNumber').fill('400');await page.locator('#sizeNumber').dispatchEvent('change');await page.locator('#gif').click();await expect(page.locator('#motionDownload')).toHaveText('Download GIF',{timeout:60000});const dl=page.waitForEvent('download');await page.locator('#motionDownload').click();const bytes=await fs.readFile(await(await dl).path());expect(bytes.subarray(0,6).toString()).toBe('GIF89a');expect(stale).toEqual([]);
});
