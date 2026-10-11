const {test,expect}=require('@playwright/test');
for(const width of [1360,390]){
 test(`consistent site navigation and Apps access at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript(()=>{localStorage.setItem('drawsplat.entryRole','teacher');localStorage.setItem('drawsplat.welcomed','1');localStorage.setItem('drawsplat.consent.accepted','1');localStorage.setItem('drawsplat.lastStartupTipDate',new Date().toISOString().slice(0,10));});
  for(const url of ['/','/studio/','/wiki/','/pages/tools.html','/blog/','/games/','/docs/district-selfhost.html','/parents/','/app/whiteboard.html','/admin/district-roster.html']){
   await page.goto(url);
   const nav=page.getByRole('navigation',{name:'Primary navigation',exact:true});
   await expect(nav).toBeVisible();
   for(const name of ['Blog','Guestbook','Wiki'])await expect(nav.getByRole('link',{name,exact:true})).toBeVisible();
   expect(await nav.locator(':scope > a, :scope > details > summary').allTextContents()).toEqual(['Apps','SplatWorks','Blog','Guestbook','Wiki']);
   await nav.locator('summary').filter({hasText:/^Apps$/}).click();
   await expect(nav.getByRole('link',{name:'Whiteboard',exact:true})).toBeVisible();
   await expect(nav.getByRole('link',{name:'Games',exact:true})).toBeVisible();
   await expect(nav.getByRole('link',{name:'Typing Games',exact:true})).toHaveCount(0);
   await page.keyboard.press('Escape');await expect(nav.locator('details[open]')).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
 });
}
test('educator content is in the searchable wiki and typing games in Games',async({page})=>{
 await page.goto('/wiki/for-educators.html');await expect(page.locator('main h1')).toHaveText('For educators');
 for(const name of ['Teacher Quick Start','Choose a background','use a classroom template','Parents and students'])await expect(page.locator('main').getByRole('link',{name,exact:true})).toBeVisible();
 await page.getByLabel('Search the wiki',{exact:true}).fill('educators');await page.getByRole('button',{name:'Search',exact:true}).click();
 await expect(page.locator('.wiki-results a').filter({hasText:/^For educators$/})).toBeVisible();
 await page.goto('/games/');await expect(page.locator('main').getByRole('link',{name:/Typing Games/}).first()).toBeVisible();
});

test('pricing and downloads have no standalone Whiteboard call to action',async({page})=>{
 for(const url of ['/pages/pricing.html','/pages/download.html']){
  await page.goto(url);
  await expect(page.getByRole('link',{name:/open (?:the )?whiteboard/i})).toHaveCount(0);
  await expect(page.locator('.site-nav > a[href*=whiteboard]')).toHaveCount(0);
  await page.locator('.site-nav summary').filter({hasText:/^Apps$/}).click();
  await expect(page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Whiteboard',exact:true})).toBeVisible();
 }
});
