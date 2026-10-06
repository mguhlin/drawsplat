const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{
 const origin=process.env.DRAWSPLAT_ORIGIN||'http://127.0.0.1:4186';
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage();
 try {
  await page.goto(origin+'/studio/?category=media');
  await page.locator('#toolSearch').fill('ClipSplat');
  await page.getByRole('link',{name:/ClipSplat/}).first().waitFor();
  assert.equal(await page.locator('#categoryFilters [data-category="media"]').getAttribute('aria-pressed'),'true');
  await page.goto(origin+'/');
  await page.locator('input[type="search"]').fill('reel maker');
  await page.getByRole('link',{name:/ClipSplat/}).first().waitFor();
  for(const path of ['/pages/tools.html','/pages/download.html','/blog/clipsplat.html']){
   await page.goto(origin+path);
   assert.ok(await page.locator('.studio-nav-menu a[href$="solutions/clipsplat/"]').count(),path+' menu');
   if(path.includes('tools'))assert.equal(await page.locator('.standalone-tool-card[href$="solutions/clipsplat/"]').count(),1);
   if(path.includes('download'))assert.ok(await page.locator('#clipsplat-download a[href$="clipsplat-selfhost-v1.1.1.zip"]').count());
  }
  await page.goto(origin+'/blog/');
  await page.locator('a[href="https://drawsplat.org/blog/clipsplat.html"]').first().waitFor();
  const rss=await page.request.get(origin+'/blog/drawsplat.rss');assert.ok((await rss.text()).includes('Meet ClipSplat'));
  console.log('PASS: Media category, homepage search aliases, menus, one tool card, blog feed, and download link');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
