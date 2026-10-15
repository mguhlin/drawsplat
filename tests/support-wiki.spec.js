const {test,expect}=require('@playwright/test');
const policyLegacyLinks=require('../data/policy-legacy-links.json');

test('one policy entry exposes the complete policy and prints optional details without losing reader choices',async({page})=>{
 await page.goto('/wiki/');
 const privacy=page.getByRole('navigation',{name:'Wiki topics'}).locator('section').filter({has:page.getByRole('heading',{name:'Privacy and district review',exact:true})});
 await expect(privacy.getByRole('link')).toHaveCount(1);
 await privacy.getByRole('link',{name:'Security, privacy and terms',exact:true}).click();
 await expect(page.locator('main h1')).toHaveText('Security, privacy and terms');
 await expect(page.getByRole('link',{name:'Manage browser data and connections',exact:true})).toBeVisible();
 await page.getByText('Retention schedule by data type',{exact:true}).click();
 await expect(page.getByRole('table',{name:'Retention by data type',exact:true})).toBeVisible();
 const before=await page.locator('main .policy-details').evaluateAll(nodes=>nodes.map(n=>n.open));
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 expect(await page.locator('main .policy-details').evaluateAll(nodes=>nodes.every(n=>n.open))).toBeTruthy();
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 expect(await page.locator('main .policy-details').evaluateAll(nodes=>nodes.map(n=>n.open))).toEqual(before);
 await page.goto('/wiki/?q=security+privacy+terms');
 await expect(page.locator('.wiki-results a').first()).toHaveText('Security, privacy and terms');
});

test('legacy policy URLs retain all incoming fragments and a single canonical policy on static hosts',async({page})=>{
 for(const entry of policyLegacyLinks){
  const response=await page.request.get('/'+entry.path);expect(response.ok(),entry.path).toBeTruthy();
  const html=await response.text();
  for(const fragment of entry.fragments)expect(html,entry.path+'#'+fragment).toContain('id="'+fragment+'"');
 }
 await page.goto('/legal/protect-review.html#score-this-deployment');
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://splatworks.org/legal/terms-privacy');
 await expect(page.locator('#protect-review')).toBeVisible();
 const ids=await page.locator('main [id]').evaluateAll(nodes=>nodes.map(n=>n.id));expect(new Set(ids).size).toBe(ids.length);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('search covers article text, supports deep links and browser history',async({page})=>{
 await page.goto('/wiki/');
 await page.getByLabel('Search the wiki',{exact:true}).fill('bundled autofilled');
 await page.getByRole('button',{name:'Search',exact:true}).click();
 await expect(page.locator('.wiki-results')).toBeVisible();
 await expect(page.locator('.wiki-results a').filter({hasText:'MySQL / MariaDB setup'})).toBeVisible();
 await expect(page).toHaveURL(/q=bundled\+autofilled/);
 await page.reload();await expect(page.locator('.wiki-results')).toBeVisible();
 await page.getByRole('button',{name:'Back to article'}).click();
 await expect(page.locator('main h1')).toHaveText('SplatWorks Wiki');
 await page.goBack();await expect(page.locator('.wiki-results')).toBeVisible();
});
for(const query of ['NDPA','OAuth','AGPL','native','feedback','retention']){
 test(`find current reference for ${query}`,async({page})=>{
  await page.goto('/wiki/?q='+query);await expect(page.locator('.wiki-results li').first()).toBeVisible();
  await expect(page.locator('.wiki-result-status')).toContainText('matching');
 });
}
test('original MySQL guide URL has wiki navigation and current district workflow',async({page})=>{
 await page.goto('/guides/mysql-setup.html');
 await expect(page.getByRole('navigation',{name:'Wiki topics'})).toBeVisible();
 await expect(page.locator('main')).toContainText('Bundled database');
 await expect(page.locator('main')).toContainText('assignments');
 await page.getByRole('navigation',{name:'On this page'}).getByRole('link',{name:'Understand the accounts'}).click();
 await expect(page).toHaveURL(/#understand-the-accounts/);
 await expect(page.getByRole('navigation',{name:'Wiki topics'}).getByRole('link',{name:'MySQL / MariaDB setup'})).toHaveAttribute('aria-current','page');
});
test('mobile topics collapse and search remains usable without overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/wiki/');
 await expect(page.locator('.wiki-topics')).not.toHaveAttribute('open','');
 await page.locator('.wiki-topics>summary').click();
 await page.getByLabel('Search the wiki',{exact:true}).fill('CSV');await page.getByRole('button',{name:'Search',exact:true}).click();
 await expect(page.locator('.wiki-results')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('search treats query as text and handles empty results',async({page})=>{
 await page.goto('/wiki/?q='+encodeURIComponent('<img src=x onerror=alert(1)>'));
 await expect(page.locator('.wiki-result-status')).toContainText('No articles');
 await expect(page.locator('.wiki-results img')).toHaveCount(0);
});
test('wiki articles work without JavaScript and print shows article',async({browser,page})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const reader=await context.newPage();
 await reader.goto('http://127.0.0.1:4183/guides/compliance-guide.html');
 await expect(reader.locator('main')).toContainText('do not automatically administer');
 await expect(reader.getByRole('navigation',{name:'Wiki topics'})).toBeVisible();await context.close();
 await page.goto('/wiki/district-classrooms.html');await page.emulateMedia({media:'print'});
 await expect(page.locator('main')).toBeVisible();await expect(page.locator('.wiki-sidebar')).toBeHidden();
});
test('home and blog route help through wiki without Community links',async({page})=>{
 for(const url of ['/','/blog/','/pages/tools.html']){
  await page.goto(url);await expect(page.locator('nav a[href*="community"]')).toHaveCount(0);
  expect(await page.locator('a[href*="wiki/"]').count()).toBeGreaterThan(0);
 }
});

test('Wiki brand returns readers to the main DrawSplat site',async({page})=>{
 for(const url of ['/wiki/','/wiki/district-classrooms.html','/guides/mysql-setup.html']){
  await page.goto(url);
  await page.locator('.wiki-brand').click();
  await expect(page).toHaveURL('http://127.0.0.1:4183/index.html');
 }
});
test('SplatWorks has dedicated searchable guides and stays inside its article column',async({page})=>{
 await page.goto('/wiki/');
 const group=page.getByRole('navigation',{name:'Wiki topics'}).locator('section').filter({has:page.getByRole('heading',{name:'SplatWorks',exact:true})});
 await expect(group.getByRole('link')).toHaveCount(10);
 await expect(group.locator('a[href$="writesplat.html"]')).toHaveCount(2);
 for(const name of ['LayoutSplat','WriteSplat','ListSplat','ShowSplat','GridSplat']){
  await page.goto('/wiki/?q='+name);await expect(page.locator('.wiki-results a').filter({hasText:name}).first()).toBeVisible();
 }
 for(const width of [1636,1280,390]){
  await page.setViewportSize({width,height:906});await page.goto('/pages/splatworks.html');
  const bounds=await page.evaluate(()=>{
   const main=document.querySelector('main').getBoundingClientRect();
   return ['.splatworks-hero h1','.splatworks-hero-image'].every(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return r.right<=main.right+1 && r.left>=main.left-1}) && document.documentElement.scrollWidth<=innerWidth;
  });expect(bounds).toBeTruthy();
  if(width===1636)await page.screenshot({path:'/tmp/drawsplat-splatworks-wiki.png',fullPage:true});
 }
});
test('audience guides keep teaching concise and route school and family setup correctly',async({page})=>{
 await page.goto('/wiki/');
 const topics=page.getByRole('navigation',{name:'Wiki topics'});
 const educators=topics.locator('section').filter({has:page.getByRole('heading',{name:'For educators',exact:true})});
 await expect(educators.getByRole('link')).toHaveCount(8);
 await expect(topics.getByRole('heading',{name:'For technology admins',exact:true})).toBeVisible();
 await expect(topics.getByRole('heading',{name:'For parents and students',exact:true})).toBeVisible();
 for(const [url,title] of [['for-educators','For educators'],['for-technology-admins','For technology admins'],['for-parents-and-students','For parents and students']]){
  await page.goto('/wiki/'+url+'.html');await expect(page.locator('main h1')).toHaveText(title);
  const links=await page.locator('main a').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
  for(const link of links.filter(link=>!link.startsWith('#')&&!link.startsWith('http')&&!link.startsWith('mailto:'))){
   const response=await page.request.get(new URL(link,page.url()).href);expect(response.ok(),link).toBeTruthy();
  }
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 }
 await page.goto('/wiki/?q=parents+students');await expect(page.locator('.wiki-results a').filter({hasText:'Learning, saving, and getting help'})).toBeVisible();
 await page.goto('/wiki/?q=technology+admins');await expect(page.locator('.wiki-results a').filter({hasText:'School setup and operations'})).toBeVisible();
 await page.goto('/wiki/?q=scratch');await expect(page.locator('.wiki-results a').filter({hasText:'Scratch art'})).toBeVisible();
});
test('FAQ is in Start here, searchable, linkable, and readable without JavaScript',async({page,browser})=>{
 await page.goto('/wiki/');
 const start=page.getByRole('navigation',{name:'Wiki topics'}).locator('section').filter({has:page.getByRole('heading',{name:'Start here',exact:true})});
 await start.getByRole('link',{name:'Frequently asked questions (FAQs)',exact:true}).click();
 await expect(page.locator('main h1')).toHaveText('Frequently asked questions (FAQs)');
 expect(await page.locator('main h3').count()).toBeGreaterThan(30);
 await expect(page.getByRole('navigation',{name:'On this page'}).getByRole('link',{name:'Installation and maintenance'})).toBeVisible();
 await page.getByRole('navigation',{name:'On this page'}).getByRole('link',{name:'Installation and maintenance'}).click();
 await expect(page).toHaveURL(/#installation-and-maintenance$/);
 const links=await page.locator('main a').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
 for(const link of links.filter(link=>!link.startsWith('http')&&!link.startsWith('mailto:'))){
  const url=new URL(link,page.url());const response=await page.request.get(url.href);expect(response.ok(),link).toBeTruthy();
  if(url.hash)expect((await response.text()).includes('id="'+url.hash.slice(1)+'"'),link+' anchor').toBeTruthy();
 }
 await page.goto('/wiki/?q=universal+password');await expect(page.locator('.wiki-results a').filter({hasText:'Frequently asked questions'})).toBeVisible();
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const reader=await context.newPage();
 await reader.goto('http://127.0.0.1:4183/wiki/faq.html#does-drawsplat-save-my-work-automatically');
 await expect(reader.locator('#does-drawsplat-save-my-work-automatically')).toBeVisible();
 await expect(reader.locator('main')).toContainText('It does not upload the board to a school account.');
 expect(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await reader.screenshot({path:'/tmp/drawsplat-faq-mobile.png'});await context.close();
 await page.goto('/wiki/faq.html');await page.emulateMedia({media:'print'});await expect(page.locator('main h3').last()).toBeVisible();
});
test('developer page is last in Wiki topics and addresses project contact correctly',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('drawsplat.googleScriptUrl','https://script.google.com/macros/s/school-example/exec'));
 let posts=0;await page.route('https://script.google.com/**',route=>{posts++;route.abort()});
 await page.goto('/wiki/');
 const links=page.getByRole('navigation',{name:'Wiki topics'}).getByRole('link');
 await expect(links.last()).toHaveText('About the Developer');await links.last().click();
 await expect(page.locator('main')).toContainText('J. M. Guhlin');
 await expect(page.locator('main')).toContainText('multilingual classrooms');
 await expect(page.locator('main a[href="https://buymeacoffee.com/drawsplat"]')).toBeVisible();
 await page.locator('#contactName').fill('Test visitor');await page.locator('#contactEmail').fill('visitor@example.com');
 await page.locator('#contactTopic').selectOption('general_question');await page.locator('#contactDetails').fill('A question about classroom tools & language support.');
 await page.getByRole('button',{name:'Open email draft'}).click();
 await expect(page.locator('#contactStatus')).toContainText('drawsplat@gmail.com');
 const draft=await page.getByRole('link',{name:'Open the prepared email'}).getAttribute('href');
 const address=new URL(draft);expect(address.pathname).toBe('drawsplat@gmail.com');
 expect(address.searchParams.get('body')).toContain('A question about classroom tools & language support.');
 expect(address.searchParams.get('body')).toContain('visitor@example.com');expect(posts).toBe(0);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto('/wiki/?q=developer+multilingual');await expect(page.locator('.wiki-results a').filter({hasText:'About the Developer'})).toBeVisible();
});
test('FAQ page menu jumps to seven sections and separates Docker and native ports',async({page})=>{
 await page.goto('/wiki/');await expect(page.locator('.wiki-faq-menu')).toHaveCount(0);
 await page.getByRole('navigation',{name:'Wiki topics'}).getByRole('link',{name:'Frequently asked questions (FAQs)',exact:true}).click();
 await page.getByRole('navigation',{name:'FAQ sections'}).getByRole('link',{name:'Saving and sharing',exact:true}).click();
 await expect(page).toHaveURL(/faq.html#saving-and-sharing$/);
 await expect(page.getByRole('navigation',{name:'FAQ sections'}).getByRole('link')).toHaveCount(7);
 await expect(page.locator('main hr')).toHaveCount(6);
 await page.getByRole('navigation',{name:'FAQ sections'}).getByRole('link',{name:'Installation and maintenance'}).click();
 await expect(page).toHaveURL(/#installation-and-maintenance$/);
 const docker=await page.locator('main').evaluate(el=>{const heading=[...el.querySelectorAll('h3')].find(h=>h.textContent.startsWith('What does Docker hosting'));let text='';for(let next=heading.nextElementSibling;next&&next.tagName!=='H3'&&next.tagName!=='H2';next=next.nextElementSibling)text+=next.textContent;return text});
 expect(docker).toContain('not published to the host');expect(docker).toContain('8787');expect(docker).toContain('3306');
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole('navigation',{name:'FAQ sections'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'/tmp/drawsplat-faq-navigation-mobile.png'});
});
test('Wiki language menu offers opt-in public-page translations without sending search terms',async({page})=>{
 let remoteRequests=0;await page.route('https://translate.google.com/**',route=>{remoteRequests++;route.abort()});
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto('/wiki/faq.html?q=private-query');
  await page.locator('.wiki-language>summary').click();
  const link=page.locator('.wiki-language').getByRole('link',{name:'Español',exact:true});await expect(link).toBeVisible();
  const url=new URL(await link.getAttribute('href'));expect(url.hostname).toBe('translate.google.com');expect(url.searchParams.get('tl')).toBe('es');
  expect(url.searchParams.get('u')).toBe('https://drawsplat.org/wiki/faq.html');await expect(link).toHaveAttribute('target','_blank');
  expect(remoteRequests).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.keyboard.press('Escape');await expect(page.locator('.wiki-language')).not.toHaveAttribute('open','');
 }
});

test('ecosystem reference covers registry components, categories, and searchable features',async({page})=>{
 const registry=require('../data/drawsplat-tools.json');
 const components=registry.tools.filter(t=>['tool','widget','game','workspace'].includes(t.type));
 await page.goto('/wiki/');
 await expect(page.locator('main')).toContainText('whole SplatWorks ecosystem');
 await page.locator('main').getByRole('link',{name:'Explore tools, widgets, and features by category'}).click();
 for(const category of registry.categories)await expect(page.locator('main h2').filter({hasText:category.name})).toHaveCount(1);
 for(const component of components){
 const links=page.locator('main a').filter({hasText:'Open '+component.name});
 await expect(links.first()).toHaveAttribute('href','..'+component.url);
 }
 await expect(page.locator('main')).toContainText('Widgets inside the whiteboard');
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto('/wiki/?q=multitrack');
 await expect(page.locator('.wiki-results a').filter({hasText:'Ecosystem tools, widgets and features'})).toBeVisible();
});

test('guide headers show complete illustrations and text-only guides get a hero',async({page})=>{
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  for(const url of ['/guides/google-setup.html','/guides/mysql-setup.html','/wiki/district-classrooms.html']){
   await page.goto(url);
   const image=page.locator('main .guide-hero-image, main .wiki-guide-hero').first();
   await expect(image).toBeVisible();
   await expect.poll(()=>image.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
   const metrics=await image.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{ratio:r.width/r.height,natural:el.naturalWidth/el.naturalHeight,fit:s.objectFit,overflow:document.documentElement.scrollWidth>innerWidth};});
   expect(metrics.ratio).toBeCloseTo(metrics.natural,1);expect(metrics.fit).not.toBe('cover');expect(metrics.overflow).toBe(false);
  }
 }
});
