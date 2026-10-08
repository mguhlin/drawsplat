const {test,expect}=require('@playwright/test');
const games=['cipher-chase','wordfall-reactor','story-sprint','paws-and-keys-adventure'];
for(const path of ['/pages/features.html','/pages/download.html','/pages/release-notes.html','/games/','/blog/typing-games.html']){
 test(`${path}: current game menu and responsive layout`,async({page})=>{
  await page.goto(path);for(const slug of games)await expect(page.locator(`.studio-nav-menu a[href$="games/${slug}/"]`)).toHaveCount(1);
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()}
 });
}
test('homepage and feature cards point to all four games',async({page})=>{
 await page.goto('/');for(const width of [390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()}for(const slug of games)await expect(page.locator(`.workspace-card[href="games/${slug}/"]`)).toBeVisible();await expect(page.getByRole('link',{name:'Typing Games',exact:true})).toHaveAttribute('href','games/typing-games/');
 await page.goto('/pages/features.html');for(const slug of games)await expect(page.locator(`.standalone-tool-card[href$="games/${slug}/"]`)).toHaveCount(1);await expect(page.locator('.standalone-tool-card[href$="games/typing-games/"]')).not.toContainText('falling block');
});
test('blog feed includes the new preserved local announcement',async({page})=>{
 await page.goto('/blog/');await expect(page.locator('#blogList a[href="https://drawsplat.org/blog/typing-games.html"]').first()).toBeVisible();const response=await page.request.get('/blog/drawsplat.rss');const text=await response.text();expect(text).toContain('drawsplat-release-v3-1-29-typing-adventures');expect(text).toContain('<source url="https://drawsplat.org/">DrawSplat Updates</source>');
 await page.goto('/blog/typing-games.html');await expect(page.locator('h1')).toHaveText('Four typing adventures. One place to start.');await expect(page.locator('main')).toContainText('95 everyday words');await expect(page.locator('main')).toContainText('definition clue');
});
test('downloads include the new full and Games packages and measured sizes',async({page})=>{
 await page.goto('/pages/download.html');for(const prefix of ['drawsplat','drawsplat-games']){const name=prefix+'-selfhost-v3.1.29.zip';await expect(page.locator(`a[href$="/${name}"]`)).toHaveCount(1);await expect(page.locator(`[data-package="${name}"]`)).toContainText(/ZIP: [\d.]+ MB · Unpacked: [\d.]+ MB/)}await expect(page.locator('#typing-games-update')).toContainText('four independent adventures');await expect(page.locator('a[href$="/SHA256SUMS-v3.1.29.txt"]')).toHaveCount(1);
});
test('teacher visibility controls recognize new games and the group',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('drawsplat.disabledGames'))localStorage.setItem('drawsplat.disabledGames',JSON.stringify(['typing-games']))});await page.goto('/pages/features.html');for(const slug of games)await expect(page.locator(`.standalone-tool-card[href$="games/${slug}/"]`)).toBeHidden();
 await page.evaluate(()=>DrawSplatGamesFilter.setDisabled(['wordfall-reactor']));await page.reload();await expect(page.locator('.standalone-tool-card[href$="games/wordfall-reactor/"]')).toBeHidden();await expect(page.locator('.standalone-tool-card[href$="games/cipher-chase/"]')).toBeVisible();
});
