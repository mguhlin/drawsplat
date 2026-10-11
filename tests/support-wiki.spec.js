const {test,expect}=require('@playwright/test');
test('search covers article text, supports deep links and browser history',async({page})=>{
 await page.goto('/wiki/');
 await page.getByLabel('Search the wiki',{exact:true}).fill('bundled autofilled');
 await page.getByRole('button',{name:'Search',exact:true}).click();
 await expect(page.locator('.wiki-results')).toBeVisible();
 await expect(page.locator('.wiki-results a').filter({hasText:'MySQL / MariaDB setup'})).toBeVisible();
 await expect(page).toHaveURL(/q=bundled\+autofilled/);
 await page.reload();await expect(page.locator('.wiki-results')).toBeVisible();
 await page.getByRole('button',{name:'Back to article'}).click();
 await expect(page.locator('main h1')).toHaveText('DrawSplat Wiki');
 await page.goBack();await expect(page.locator('.wiki-results')).toBeVisible();
});
for(const query of ['NDPA','OAuth','AGPL','native','feedback','retention']){
 test(`find current reference for ${query}`,async({page})=>{
  await page.goto('/wiki/?q='+query);await expect(page.locator('.wiki-results li').first()).toBeVisible();
  await expect(page.locator('.wiki-result-status')).toContainText('matching');
 });
}
test('original MySQL guide URL has wiki navigation and current district workflow',async({page})=>{
 await page.goto('/guides/mysql-setup.html');
 await expect(page.getByRole('navigation',{name:'Wiki topics'})).toBeVisible();
 await expect(page.locator('main')).toContainText('Bundled database');
 await expect(page.locator('main')).toContainText('assignments');
 await page.getByRole('navigation',{name:'On this page'}).getByRole('link',{name:'Understand the accounts'}).click();
 await expect(page).toHaveURL(/#understand-the-accounts/);
 await expect(page.getByRole('navigation',{name:'Wiki topics'}).getByRole('link',{name:'MySQL / MariaDB setup'})).toHaveAttribute('aria-current','page');
});
test('mobile topics collapse and search remains usable without overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/wiki/');
 await expect(page.locator('.wiki-topics')).not.toHaveAttribute('open','');
 await page.locator('.wiki-topics>summary').click();
 await page.getByLabel('Search the wiki',{exact:true}).fill('CSV');await page.getByRole('button',{name:'Search',exact:true}).click();
 await expect(page.locator('.wiki-results')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('search treats query as text and handles empty results',async({page})=>{
 await page.goto('/wiki/?q='+encodeURIComponent('<img src=x onerror=alert(1)>'));
 await expect(page.locator('.wiki-result-status')).toContainText('No articles');
 await expect(page.locator('.wiki-results img')).toHaveCount(0);
});
test('wiki articles work without JavaScript and print shows article',async({browser,page})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const reader=await context.newPage();
 await reader.goto('http://127.0.0.1:4183/guides/compliance-guide.html');
 await expect(reader.locator('main')).toContainText('do not automatically administer');
 await expect(reader.getByRole('navigation',{name:'Wiki topics'})).toBeVisible();await context.close();
 await page.goto('/wiki/district-classrooms.html');await page.emulateMedia({media:'print'});
 await expect(page.locator('main')).toBeVisible();await expect(page.locator('.wiki-sidebar')).toBeHidden();
});
test('home and blog route help through wiki without Community links',async({page})=>{
 for(const url of ['/','/blog/','/pages/tools.html']){
  await page.goto(url);await expect(page.locator('nav a[href*="community"]')).toHaveCount(0);
  expect(await page.locator('a[href*="wiki/"]').count()).toBeGreaterThan(0);
 }
});

test('Wiki brand returns readers to the main DrawSplat site',async({page})=>{
 for(const url of ['/wiki/','/wiki/district-classrooms.html','/guides/mysql-setup.html']){
  await page.goto(url);
  await page.locator('.wiki-brand').click();
  await expect(page).toHaveURL('http://127.0.0.1:4183/index.html');
 }
});
test('SplatWorks has dedicated searchable guides and stays inside its article column',async({page})=>{
 await page.goto('/wiki/');
 const group=page.getByRole('navigation',{name:'Wiki topics'}).locator('section').filter({has:page.getByRole('heading',{name:'SplatWorks',exact:true})});
 await expect(group.getByRole('link')).toHaveCount(5);
 for(const name of ['WriteSplat','ListSplat','ShowSplat','GridSplat']){
  await page.goto('/wiki/?q='+name);await expect(page.locator('.wiki-results a').filter({hasText:name}).first()).toBeVisible();
 }
 for(const width of [1636,1280,390]){
  await page.setViewportSize({width,height:906});await page.goto('/pages/splatworks.html');
  const bounds=await page.evaluate(()=>{
   const main=document.querySelector('main').getBoundingClientRect();
   return ['.splatworks-hero h1','.splatworks-hero-image'].every(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return r.right<=main.right+1 && r.left>=main.left-1}) && document.documentElement.scrollWidth<=innerWidth;
  });expect(bounds).toBeTruthy();
  if(width===1636)await page.screenshot({path:'/tmp/drawsplat-splatworks-wiki.png',fullPage:true});
 }
});
