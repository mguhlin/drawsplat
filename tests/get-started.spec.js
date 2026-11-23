const{test,expect}=require('@playwright/test');
for(const width of [1360,390])test('browser, desktop and Help are easy to reach at '+width+'px',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await page.goto('/');
 const nav=page.getByRole('navigation',{name:'Primary navigation',exact:true});for(const name of ['Browser apps','Desktop apps','Help'])await expect(nav.getByRole('link',{name,exact:true})).toBeVisible();
 const desktop=page.locator('main').getByRole('link',{name:'Download desktop apps',exact:true});await expect(desktop).toBeInViewport();await desktop.click();await expect(page).toHaveURL(/download(?:\.html)?#desktop-apps$/);
 await expect(page.getByRole('heading',{name:'SplatWorks Desktop',exact:true})).toBeVisible();for(const name of ['Windows','Mac','Linux'])await expect(page.getByRole('link',{name:'Download SplatWorks-Desktop for '+name,exact:true})).toBeInViewport();
 await expect(page.locator('#advanced-downloads')).not.toHaveAttribute('open','');await expect(page.locator('.individual-desktop')).not.toHaveAttribute('open','');
 await page.locator('.individual-desktop>summary').click();await expect(page.getByRole('heading',{name:'CipherSplat',exact:true}).first()).toBeVisible();
 await page.goto('/wiki/');await expect(page.getByRole('heading',{name:'How can we help?',exact:true})).toBeVisible();await expect(page.getByLabel('Search the wiki',{exact:true})).toBeVisible();await expect(page.locator('.help-reference')).not.toHaveAttribute('open','');await expect(page.locator('.help-tasks li')).toHaveCount(4);
 await page.getByLabel('Search the wiki',{exact:true}).fill('desktop');await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.locator('.wiki-results a').filter({hasText:'Use desktop apps'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('existing package fragments open the optional reference and remain usable',async({page})=>{
 await page.goto('/pages/download.html#desktop-previews');await expect(page.locator('#advanced-downloads')).not.toHaveAttribute('open','');await expect(page.getByRole('link',{name:'Download SplatWorks-Desktop for Windows',exact:true})).toBeInViewport();
 await page.goto('/pages/download.html#complete-download');await expect(page.locator('#advanced-downloads')).toHaveAttribute('open','');await expect(page.locator('#complete-download')).toBeInViewport();
 await page.goto('/pages/download.html#splatlms-download');await expect(page.locator('#advanced-downloads')).toHaveAttribute('open','');await expect(page.locator('#splatlms-download')).toBeInViewport();
});
test('primary download choices work without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(new URL('/pages/download.html',test.info().project.use.baseURL).href);await expect(page.getByRole('link',{name:'Download SplatWorks-Desktop for Windows',exact:true})).toBeVisible();await page.locator('.individual-desktop>summary').click();await expect(page.getByRole('link',{name:'Download CipherSplat for Mac',exact:true})).toBeVisible();await context.close();
});

test('the desktop download explains its current apps and the next release',async({page})=>{
 const catalog=require('../data/desktop-apps.json');await page.goto('/pages/download.html');const suite=page.locator('.desktop-suite');await expect(suite).toContainText('One desktop home for SplatWorks apps');
 for(const name of catalog.coreAvailableApps)await expect(suite.locator('.desktop-included')).toContainText(name);
 if(catalog.corePlannedApps.length){await expect(suite.getByRole('heading',{name:'Coming to SplatWorks Desktop',exact:true})).toBeVisible();for(const name of catalog.corePlannedApps)await expect(suite.locator('.desktop-roadmap')).toContainText(name);await expect(suite.locator('.desktop-roadmap')).toContainText('being integrated and tested');}
});
