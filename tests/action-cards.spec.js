const {test,expect}=require('@playwright/test');
for(const width of [1280,390]){
  for(const url of ['/','/studio/','/pages/tools.html','/admin/admin.html','/splatworks/showsplat/','/splatworks/writesplat/','/splatworks/listsplat/','/splatworks/gridsplat/','/solutions/imagesplat/','/games/lightsout/']){
    test(`explained cards keep ${url} usable at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:900});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(url);
      await expect(page.locator('script[src*="action-cards.js"]')).toHaveCount(1);
      if(url==='/splatworks/gridsplat/')await page.getByRole('button',{name:'New Sheet',exact:true}).click();
      const trigger=page.locator('details.menu > summary, details.landing-nav-dropdown > summary, .menu > button, .dropdown-menu > button').first();
      if(!['/','/studio/','/admin/admin.html','/games/lightsout/'].includes(url)){
        await expect(trigger).toBeVisible();
        await trigger.click();
        const menu=page.locator('.menu-panel:visible,.landing-nav-menu:visible,.menu-popover:visible').first();
        await expect(menu).toBeVisible();
        const card=menu.locator('.ds-action-card').first();
        await expect(card).toBeVisible();
        await expect(card).toHaveAttribute('aria-description',/.+/);
        const bounds=await menu.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
        expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(901);
        await page.screenshot({path:`.tmp/action-menu-${url.replace(/\W+/g,'-')}-${width}.png`});
        await page.mouse.click(width-2,898);
        await expect(menu).toBeHidden();
        await trigger.click();
        await page.keyboard.press('Escape');
        await expect(page.locator('.menu-panel:visible,.landing-nav-menu:visible,.menu-popover:visible')).toHaveCount(0);
      }
      await page.screenshot({path:`.tmp/action-cards-${url.replace(/\W+/g,'-')}-${width}.png`});
      expect(errors).toEqual([]);
    });
  }
}
test('launcher descriptions retain searchable navigation',async({page})=>{
  await page.goto('/studio/');
  await page.locator('[data-ds-app-launcher]').first().click();
  const dialog=page.locator('.ds-launcher');await expect(dialog).toBeVisible();
  await dialog.locator('input').fill('slides');
  const link=dialog.locator('.ds-launcher-results a').first();
  await expect(link.locator('small')).not.toBeEmpty();
  await expect(link).toHaveAttribute('href',/showsplat/);
  await link.click();await expect(page).toHaveURL(/showsplat/);
});
test('card labels and editing handlers remain intact',async({page})=>{
  await page.goto('/splatworks/showsplat/');
  await page.locator('details.menu > summary').filter({hasText:/^Insert$/}).click();
  const button=page.locator('.menu-panel [data-action="add-text"]');
  await expect(button).toHaveAccessibleName('Text box');
  const count=await page.locator('#slideCanvas .slide-object').count();
  await button.click();
  await expect(page.locator('#slideCanvas .slide-object')).toHaveCount(count+1);
});
