const {test,expect}=require('@playwright/test');const fs=require('node:fs');const path=require('node:path');
test.beforeEach(async({page})=>{await page.route('**/setup/options',r=>r.fulfill({json:{databaseMode:'bundled',bundledAvailable:true}}));await page.route('**/setup.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(__dirname,'../server/mysql-backend/static/setup.js'),'utf8')}));});
test('first installation shows unique editable starter credentials without browser persistence',async({page})=>{
 await page.goto('/server/mysql-backend/static/setup.html');await expect(page.locator('#admin-email')).toHaveValue('admin@localhost.test');await expect(page.locator('#admin-password')).toHaveAttribute('type','password');const first=await page.locator('#admin-password').inputValue();expect(first.length).toBeGreaterThanOrEqual(20);
 expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).not.toContain(first);
 await page.locator('#show-admin-password').check();await expect(page.locator('#admin-password')).toHaveAttribute('type','text');await page.reload();expect(await page.locator('#admin-password').inputValue()).not.toBe(first);
});
test('installation saves edited credentials and completion provides the matching login details',async({page})=>{
 let submitted;await page.route('**/setup',route=>{submitted=route.request().postDataJSON();return route.fulfill({json:{ok:true,message:'Setup complete.'}});});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.copiedLogin=value;}}}));
 await page.goto('/server/mysql-backend/static/setup.html');await page.locator('#setup-key').fill('test-setup-key');await page.locator('#admin-email').fill('district-admin@school.example');await page.locator('#admin-password').fill('test-only-chosen-password');await page.getByRole('button',{name:'Finish setup'}).click();await expect(page.locator('#setup-login-details')).toBeVisible();expect(submitted.adminEmail).toBe('district-admin@school.example');expect(submitted.adminPassword).toBe('test-only-chosen-password');await expect(page.locator('#installed-admin-email')).toHaveValue('district-admin@school.example');await expect(page.locator('#installed-admin-password')).toHaveValue('test-only-chosen-password');await page.getByRole('button',{name:'Copy login details'}).click();await expect(page.locator('#copy-login-status')).toHaveText('Login details copied.');expect(await page.evaluate(()=>window.copiedLogin)).toContain('district-admin@school.example');
});

test('bundled mode excludes autofill and switching to own database explicitly includes settings',async({page})=>{
 const bodies=[];await page.route('**/setup',r=>{bodies.push(r.request().postDataJSON());return r.fulfill({json:{ok:true,database:'MariaDB'}})});
 await page.goto('/server/mysql-backend/static/setup.html');await page.locator('#setup-key').fill('test-key');await expect(page.locator('#database-overrides')).toBeHidden();
 await page.locator('#db-user').evaluate(el=>el.value='autofilled-wrong-user');await page.locator('#db-password').evaluate(el=>el.value='autofilled-wrong-password');await page.locator('#test-db').click();expect(bodies[0].databaseMode).toBe('bundled');expect(bodies[0].username).toBeUndefined();expect(bodies[0].password).toBeUndefined();await expect(page.locator('#setup-status')).toHaveText('MariaDB connection works.');
 await page.locator('#database-mode').selectOption('external');await expect(page.locator('#database-overrides')).toBeVisible();await page.locator('#test-db').click();expect(bodies[1].databaseMode).toBe('external');expect(bodies[1].username).toBe('autofilled-wrong-user');
});
test('native installer opens with own database fields and masked starter password',async({page})=>{
 await page.route('**/setup/options',r=>r.fulfill({json:{databaseMode:'external',bundledAvailable:false}}));await page.goto('/server/mysql-backend/static/setup.html');await expect(page.locator('#database-overrides')).toBeVisible();await expect(page.locator('#database-mode')).toHaveValue('external');await expect(page.locator('#admin-password')).toHaveAttribute('type','password');
});
