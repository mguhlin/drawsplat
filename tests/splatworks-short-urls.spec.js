const {test,expect}=require('@playwright/test');
for(const app of ['plansplat','layoutsplat','writesplat','showsplat','gridsplat','listsplat'])test(`${app} short URL preserves query and fragment on static hosts`,async({page})=>{
 await page.goto('/'+app+'/?source=short-link#guide');await page.waitForURL('**/splatworks/'+app+'/?source=short-link#guide');
 await expect(page.locator('meta[name="splatworks-app"]')).toHaveAttribute('content',app);
});
test('terms cover the ecosystem, component storage, and existing district services',async({page})=>{
 await page.goto('/legal/terms-privacy.html');await expect(page.locator('main h1')).toHaveText('Security, privacy and terms');await expect(page.locator('main')).toContainText('SplatWorks is the ecosystem; DrawSplat is the whiteboard');
 for(const name of ['WriteSplat','GridSplat','ListSplat','ShowSplat','LayoutSplat'])await expect(page.locator('main')).toContainText(name);
 await expect(page.locator('main')).toContainText('Each domain and browser profile has separate storage');await expect(page.locator('main')).toContainText('do not automatically apply to standalone apps or district database records');
 expect(await page.locator('main').textContent()).not.toContain('future MySQL storage');
});
