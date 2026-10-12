const {test,expect}=require('@playwright/test');
test('GridSplat preserves other app caches and excludes private API and transfer URLs',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{const cache=await caches.open('another-app-cache');await cache.put('/cache-keep',new Response('keep'));});
 await page.goto('/splatworks/gridsplat/');await expect(page.getByRole('button',{name:'New Sheet',exact:true})).toBeVisible();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
 await page.route('**/api/cache-check',route=>route.fulfill({status:200,contentType:'application/json',body:'{"private":true}'}));
 await page.evaluate(async()=>{await fetch('/api/cache-check');await fetch('/splatworks/gridsplat/?open-file=cache-check');});
 expect(await page.evaluate(async()=>{const keys=await caches.keys();const urls=(await Promise.all(keys.map(async key=>(await (await caches.open(key)).keys()).map(r=>r.url)))).flat();return {keep:!!await caches.match('/cache-keep'),private:urls.some(u=>u.includes('/api/cache-check')),transfer:urls.some(u=>u.includes('open-file='))};})).toEqual({keep:true,private:false,transfer:false});
});
