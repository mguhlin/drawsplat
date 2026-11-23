const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
for(const width of [1360,390])test('schools have one visible route to privacy, agreements and setup at '+width+'px',async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/wiki/');
 const primary=page.getByRole('navigation',{name:'Primary navigation',exact:true});await expect(primary.getByRole('link',{name:'Schools & Districts',exact:true})).toBeVisible();
 const school=page.locator('main .help-schools');await expect(school).toBeInViewport();for(const label of ['Privacy policy','DPA / NDPA','FERPA / COPPA','GDPR'])await expect(school).toContainText(label);
 await school.getByRole('link',{name:'Schools & Districts',exact:true}).click();await expect(page).toHaveURL(/\/schools\/(?:index.html)?$/);await expect(page.locator('main h1')).toHaveText('Schools & Districts');
 const jumps=page.getByRole('list',{name:'School review topics'});for(const label of ['Privacy and student data','DPA / NDPA agreements','FERPA and COPPA','GDPR and UK GDPR'])await expect(jumps.getByRole('link',{name:label,exact:true})).toBeInViewport();
 for(const label of ['District Privacy Addendum','NDPA / DPA review worksheet','State & District DPA Register','Accessibility statement and known limitations','Download desktop apps','Download the district suite','Install the district suite'])await expect(page.locator('main').getByRole('link',{name:label,exact:true})).toBeVisible();
 await jumps.getByRole('link',{name:'GDPR and UK GDPR',exact:true}).click();await expect(page.locator('#gdpr-and-uk-gdpr')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // Everything is ordinary content, available without opening accordion panels.
 expect(await page.locator('main details').count()).toBe(0);
});
test('every school resource reaches a real page and valid section',async({page})=>{
 await page.goto('/schools/');const links=await page.locator('main a[href]').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
 for(const href of [...new Set(links)]){
  if(/^(?:https?:|mailto:)/.test(href))continue;
  const url=new URL(href,page.url());const response=await page.request.get(url.pathname+url.search);expect(response.ok(),href).toBe(true);
  if(url.hash){const text=await response.text();expect(text,href).toContain('id="'+decodeURIComponent(url.hash.slice(1))+'"');}
 }
});
test('FERPA and GDPR policy links reveal the actual section',async({page})=>{
 await page.goto('/schools/');await page.locator('main').getByRole('link',{name:'FERPA/COPPA and state-law responsibilities',exact:true}).click();await expect(page.locator('#regional-review')).toBeVisible();await expect(page.locator('#regional-review')).toBeInViewport();
 await expect(page.locator('main')).toContainText('FERPA/COPPA');await expect(page.locator('main')).toContainText('EU/UK deployments');
 await page.goto('/legal/terms-privacy.html#district-review');await expect(page.locator('#district-review')).toBeInViewport();
});
for(const query of ['FERPA','GDPR','DPA'])test('school review resources are easy to find by '+query,async({page})=>{
 await page.goto('/wiki/?q='+query);await expect(page.locator('.wiki-results a').first()).toHaveText('Schools & Districts · Privacy, DPA, FERPA and GDPR');
});
test('school overview works without JavaScript and remains printable',async({browser,page})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const reader=await context.newPage();await reader.goto(new URL('/schools/',test.info().project.use.baseURL||'http://127.0.0.1:4183').href);await expect(reader.locator('main h1')).toHaveText('Schools & Districts');await expect(reader.locator('main').getByRole('link',{name:'District Privacy Addendum',exact:true})).toBeVisible();await reader.locator('.school-jumps a[href="#dpa-and-district-agreements"]').click();await expect(reader.locator('#dpa-and-district-agreements')).toBeInViewport();await context.close();
 await page.goto('/schools/');await page.emulateMedia({media:'print'});await expect(page.locator('main')).toBeVisible();await expect(page.locator('.wiki-header')).toBeHidden();await expect(page.locator('.school-jumps')).toBeHidden();for(const heading of ['FERPA and COPPA','GDPR and UK GDPR','DPA and district agreements'])await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
});
test('school resource remains documented and protected against injected analytics',async()=>{
 const source=fs.readFileSync('docs/schools-and-districts.md','utf8');for(const term of ['FERPA','GDPR','NDPA','COPPA'])expect(source).toContain(term);
 const headers=fs.readFileSync('_headers','utf8');expect(headers).toMatch(/\/schools\/\*\n\s+Cache-Control: no-transform/);
 expect(source).not.toMatch(/last updated|last modified|generated on|reviewed on/i);
});
