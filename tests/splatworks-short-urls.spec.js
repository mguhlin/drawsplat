const {test,expect}=require('@playwright/test');
for(const app of ['plansplat','layoutsplat','writesplat','showsplat','gridsplat','listsplat'])for(const slash of ['', '/'])test(`${app}${slash} short URL preserves query and fragment on static hosts`,async({page})=>{
 await page.goto('/'+app+slash+'?source=short-link#guide');await page.waitForURL('**/splatworks/'+app+'/?source=short-link#guide');
 await expect(page.locator('meta[name="splatworks-app"]')).toHaveAttribute('content',app);
});
test('terms cover the ecosystem, component storage, and existing district services',async({page})=>{
 await page.goto('/legal/terms-privacy.html');await expect(page.locator('main h1')).toHaveText('Security, privacy and terms');await expect(page.locator('main')).toContainText('SplatWorks is the ecosystem; DrawSplat is the whiteboard');
 for(const name of ['WriteSplat','GridSplat','ListSplat','ShowSplat','LayoutSplat'])await expect(page.locator('main')).toContainText(name);
 await expect(page.locator('main')).toContainText('Each domain and browser profile has separate storage');await expect(page.locator('main')).toContainText('do not automatically apply to standalone apps or district database records');
 expect(await page.locator('main').textContent()).not.toContain('future MySQL storage');
});

const shortcuts=require('../data/splatworks-short-urls.json');
test('every branded short URL targets an existing app and has matching production redirects',async({request})=>{
 const fs=require('node:fs'),path=require('node:path'),redirects=fs.readFileSync(path.join(__dirname,'../_redirects'),'utf8').split('\n').map(line=>line.trim().split(/\s+/).join(' ')).join('\n');expect(shortcuts).toHaveLength(28);let dynamic=false;for(const line of redirects.split('\n').filter(l=>l.startsWith('/'))){if(/[*:]/.test(line.split(' ')[0]))dynamic=true;else expect(dynamic,'Exact redirects must precede wildcard rules').toBe(false);}
 for(const shortcut of shortcuts){expect(shortcut.target).not.toContain('/wiki/');expect(fs.existsSync(path.join(__dirname,'..',shortcut.target,shortcut.target.endsWith('/')?'index.html':''))).toBe(true);for(const suffix of ['', '/'])expect(redirects).toContain(`${shortcut.path}${suffix} ${shortcut.target} 301`);const response=await request.get(shortcut.path+'/');expect(response.ok()).toBe(true);expect(await response.text()).toContain(shortcut.target);}
});
