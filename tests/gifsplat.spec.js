const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const origin=process.env.GIFSPLAT_URL||'http://127.0.0.1:4186';
test('GIFsplat branding, frame import, and real GIF download survive the move',async({page})=>{
  await page.goto(origin+'/solutions/gifsplat/');
  await expect(page.getByRole('heading',{name:'GIFsplat™',exact:true})).toBeVisible();
  await expect(page).toHaveTitle('GIFsplat™ — DrawSplat™');
  const frame=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=80;c.height=60;const ctx=c.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,80,60);return c.toDataURL().split(',')[1];}),'base64');
  await page.locator('#frameInput').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:frame},{name:'two.png',mimeType:'image/png',buffer:frame}]);
  await page.locator('#generateBtn').click();await expect(page.locator('#downloadBtn')).toBeEnabled();
  const downloading=page.waitForEvent('download');await page.locator('#downloadBtn').click();
  const bytes=await fs.readFile(await(await downloading).path());
  expect(bytes.subarray(0,6).toString()).toMatch(/^GIF8[79]a$/);expect(bytes.length).toBeGreaterThan(100);
  const picker=page.locator('.i18n-picker select');await picker.selectOption('es');
  await expect(page.getByRole('heading',{name:'GIFsplat™',exact:true})).toBeVisible();
});
test('the old app redirects bookmarks to GIFsplat with query and fragment intact',async({page})=>{
  await page.goto(origin+'/solutions/animated-gif/?source=bookmark#frames');
  await expect(page).toHaveURL(/\/solutions\/gifsplat\/\?source=bookmark#frames$/);
  await expect(page.getByRole('heading',{name:'GIFsplat™',exact:true})).toBeVisible();
});
test('the tool registry uses the canonical name and route while retaining its integration ID',async({request})=>{
  const json=await(await request.get(origin+'/data/drawsplat-tools.json')).json();
  const gif=json.tools.find(t=>t.id==='animated-gif');
  expect(gif.name).toBe('GIFsplat™');expect(gif.url).toBe('/solutions/gifsplat/');expect(gif.aliases).toContain('animated gif maker');
});
