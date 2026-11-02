const {test,expect}=require('@playwright/test');

test('learning-management search leads from the ecosystem to the installer and teaching guide',async({page})=>{
 await page.goto('/');
 await page.locator('#homeSearch').fill('learning management system');
 const result=page.locator('#homeSearchResults a').filter({hasText:'SplatLMS'});
 await expect(result).toHaveCount(1);await result.click();
 await expect(page.locator('main h1')).toHaveText('SplatLMS');
 await page.locator('main').getByRole('link',{name:'Download SplatLMS v1.0.0',exact:true}).click();
 await expect(page).toHaveURL(/download.html#splatlms-download$/);
 const download=page.locator('#splatlms-download');
 await expect(download.getByRole('link',{name:'Download SplatLMS ZIP',exact:true})).toHaveAttribute('href','https://github.com/mguhlin/splatlms/releases/download/v1.0.0/SplatLMS-1.0.0.zip');
 await expect(download).toContainText('own installer and learner database');
 await download.getByRole('link',{name:'Installation and teaching guide',exact:true}).click();
 await expect(page.locator('main h1')).toHaveText('SplatLMS · Learning Management System');
 await expect(page.locator('main')).toContainText('does not automatically');
 await expect(page.locator('main')).toContainText('CC BY-SA 4.0');
});

test('SplatLMS is in the shared menu, searchable wiki and app catalog',async({page})=>{
 await page.goto('/wiki/?q=SplatLMS');
 await expect(page.locator('.wiki-results a[href$="/wiki/splatlms.html"]')).toBeVisible();
 const topics=page.getByRole('navigation',{name:'Wiki topics'});
 await expect(topics.getByRole('link',{name:'SplatLMS · Learning Management System',exact:true})).toHaveCount(1);
 await page.goto('/studio/?q=SplatLMS');
 await expect(page.locator('.ds-tool-card').filter({hasText:'SplatLMS'})).toBeVisible();
 await page.goto('/splatlms/?source=ecosystem#installation');
 await page.waitForURL('**/pages/splatlms.html?source=ecosystem#installation');
 const nav=page.getByRole('navigation',{name:'Primary navigation',exact:true});
 await nav.locator('summary').filter({hasText:/^SplatWorks$/}).click();
 await expect(nav.getByRole('link',{name:'SplatLMS · Learning management',exact:true})).toBeVisible();
});

test('LMS product and guide remain readable on phones and all local article links resolve',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const url of ['/pages/splatlms.html','/wiki/splatlms.html']){
  await page.goto(url);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const links=await page.locator('main a').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
  for(const href of links.filter(h=>!h.startsWith('https:'))){
   const target=new URL(href,page.url()),response=await page.request.get(target.href);
   expect(response.ok(),target.href).toBe(true);
   if(target.hash)expect(await response.text(),target.href).toContain('id="'+target.hash.slice(1)+'"');
  }
 }
 await page.screenshot({path:'/tmp/splatlms-wiki-mobile.png',fullPage:true});
});
