const {chromium}=require('../../../node_modules/@playwright/test');
const assert=require('node:assert/strict');
const origin=process.env.CLIPSPLAT_ORIGIN||'http://127.0.0.1:4186';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:1280,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(origin+'/solutions/clipsplat/');assert.equal(await page.locator('details.details').count(),0);
const link=page.locator('header a[href="tutorial/"]');assert.equal(await link.getAttribute('target'),'_blank');const popup=page.waitForEvent('popup');await link.click();const tutorial=await popup;await tutorial.waitForLoadState();assert.match(tutorial.url(),/\/solutions\/clipsplat\/tutorial\//);
assert.equal(await tutorial.locator('.format-card').count(),3);assert.equal(await tutorial.locator('.steps>li').count(),5);
for(const href of await tutorial.locator('.contents a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))))assert.equal(await tutorial.locator(href).count(),1);
assert.ok(await tutorial.locator('.brand img').evaluate(img=>img.complete&&img.naturalWidth>0));
for(const width of [1280,390]){await tutorial.setViewportSize({width,height:950});assert.ok(await tutorial.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');await tutorial.screenshot({path:`/tmp/clipsplat-tutorial-${width}.png`,fullPage:true});}
assert.deepEqual(errors,[]);console.log('PASS: Tutorial links/open separate tab, editor notes removed, 3 format cards, 5 steps, section anchors, logo, desktop/mobile layout',origin);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
