const {test,expect}=require('@playwright/test');
for(const app of ['layoutsplat','writesplat','showsplat','gridsplat','listsplat'])test(`${app} short URL preserves query and fragment on static hosts`,async({page})=>{
 await page.goto('/'+app+'/?source=short-link#guide');await page.waitForURL('**/splatworks/'+app+'/?source=short-link#guide');
 await expect(page.locator('meta[name="splatworks-app"]')).toHaveAttribute('content',app);
});
test('terms cover the ecosystem, component storage, and existing district services',async({page})=>{
 await page.goto('/legal/terms-privacy.html');await expect(page.locator('main h1')).toHaveText('SplatWorks™ Terms of Service and Privacy Policy');await expect(page.locator('main')).toContainText('SplatWorks is the ecosystem; DrawSplat is the whiteboard');
 for(const name of ['WriteSplat™','GridSplat™','ListSplat™','ShowSplat™','LayoutSplat™'])await expect(page.locator('main')).toContainText(name);
 await expect(page.locator('main')).toContainText('browser drafts and permissions are separate for each origin');await expect(page.locator('main')).toContainText('not automatically applied to standalone SplatWorks™ browser projects');
 expect(await page.locator('main').textContent()).not.toContain('future MySQL storage');
});
