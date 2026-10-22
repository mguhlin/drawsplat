import {test,expect} from '@playwright/test';

test('wiki and feature catalogue explain ImageSplat replacement backgrounds and the language picker',async({page})=>{
  await page.goto('/wiki/backdropsplat.html');
  await expect(page.locator('main')).toContainText('ImageSplat');
  await expect(page.locator('main')).toContainText('Language picker');
  await expect(page.locator('main')).toContainText('closing the studio cancels pending background loads');
  await expect(page.locator('main')).toContainText('v3.1.45');
});

test('the SplatWorks blog links a published walkthrough with bundled artwork and matching downloads',async({page})=>{
  await page.goto('/blog/');await page.getByRole('heading',{name:'Keep the Subject. Change the Scene.'}).first().getByRole('link').click();
  await expect(page.locator('main h1')).toHaveText('Keep the Subject. Change the Scene.');
  await expect(page.locator('main')).toContainText('ImageSplat');await expect(page.locator('main')).toContainText('Hindi/Urdu');
  for(const image of await page.locator('main img').all())await expect.poll(()=>image.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('download and release pages identify the new packages, versions and background dependencies',async({page})=>{
  await page.goto('/pages/download.html');
  await expect(page.locator('small[data-package]')).toHaveCount(16);
  for(const filename of await page.locator('small[data-package]').evaluateAll(nodes=>nodes.map(n=>n.dataset.package)))expect(filename==='CipherSplat-offline.zip'||filename.endsWith('-v3.1.45.zip')).toBe(true);
  await expect(page.locator('#backgrounds-release')).toContainText('photo models download on first use');
  await expect(page.locator('a[href*="/v3.1.45/drawsplat-district-suite-v3.1.45.zip"]').first()).toBeAttached();
  await page.goto('/pages/release-notes.html');await expect(page.locator('#v3145-backgrounds')).toContainText('ImageSplat');
});
