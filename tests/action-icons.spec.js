const {test,expect}=require('@playwright/test');
for(const route of ['/solutions/imagesplat/','/solutions/pdfsplat/','/splatworks/showsplat/','/solutions/audiosplat/','/solutions/videosplat/','/solutions/mediasplat/','/splatworks/writesplat/','/splatworks/listsplat/','/splatworks/gridsplat/']) test(`labelled action icons keep ${route} usable`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(route);
 if(route.includes('gridsplat'))await page.getByRole('button',{name:'New Sheet',exact:true}).click();
 if(route.includes('videosplat'))await page.getByRole('button',{name:/Edit video/}).click();
 if(route.includes('writesplat')||route.includes('gridsplat'))await page.locator('details.menu > summary,.dropdown-menu > button,.menu > button').first().click();
 const buttons=page.locator('.ds-action-button:visible,.ds-symbol-action:visible');await expect(buttons.first()).toBeVisible();
 const info=await buttons.evaluateAll(nodes=>nodes.filter(n=>n.offsetWidth&&n.offsetHeight).map(n=>({name:n.textContent.trim(),icon:getComputedStyle(n,'::before').maskImage,width:parseFloat(getComputedStyle(n,'::before').width)})));
 expect(info.length).toBeGreaterThan(0);for(const b of info){expect(b.name).toMatch(/\p{L}/u);expect(b.icon).toContain('/assets/icons/actions/');expect(b.width).toBeGreaterThan(0);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();expect(errors).toEqual([]);
 await page.screenshot({path:`/tmp/action-icons-${route.replace(/\W/g,'-')}-${test.info().project.name}.png`});
});
test('ImageSplat toolbar icons retain accessible labels, localization, export and undo handlers',async({page})=>{
 await page.goto('/solutions/imagesplat/');for(const name of ['undo','redo','exportPng','copyPng']){const b=page.locator(`.toolbar [data-action="${name}"]`);await expect(b).toHaveClass(/ds-action-button/);await expect(b).not.toHaveClass(/ds-action-card/);await expect(b).toHaveAccessibleName(/\p{L}/u);}
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=40;c.height=30;c.getContext('2d').fillRect(0,0,40,30);return c.toDataURL().split(',')[1]});await page.locator('#imageInput').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(page.locator('#docInfo')).toContainText('1 layers');
 const pending=page.waitForEvent('download');await page.locator('.toolbar [data-action="exportPng"]').click();const download=await pending;expect(download.suggestedFilename()).toMatch(/\.png$/);
 await page.locator('.toolbar [data-action="undo"]').click();await expect(page.locator('#docInfo')).toContainText('0 layers');await page.locator('.toolbar [data-action="redo"]').click();await expect(page.locator('#docInfo')).toContainText('1 layers');
 const picker=page.locator('select').filter({has:page.locator('option[value="es"]')}).first();await picker.selectOption('es');const button=page.locator('.toolbar [data-action="undo"]');await expect(button).toContainText('Deshacer');await expect(button).toHaveClass(/ds-action-button/);await expect(button).toHaveAccessibleName('Deshacer');
 const icon=await button.evaluate(n=>getComputedStyle(n,'::before').maskImage);expect(icon).toContain('undo.svg');const response=await page.request.get('/assets/icons/actions/undo.svg');expect(response.ok()).toBeTruthy();
});
