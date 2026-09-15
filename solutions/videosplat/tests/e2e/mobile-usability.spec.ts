import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('videosplat-splash-seen', '1'));
});
test('phone users can reach media, preview and title controls', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('./');
  const panels = page.getByRole('group', {name:'Editor panels'});
  await panels.getByRole('button',{name:'Media',exact:true}).click();
  await expect(page.locator('.media-panel')).toBeVisible();
  await page.getByRole('button',{name:'＋ Title',exact:true}).click();
  await panels.getByRole('button',{name:'Clip controls'}).click();
  await expect(page.locator('.inspector')).toBeVisible();
  await expect(page.locator('.inspector').getByRole('heading',{name:'Clip',exact:true})).toBeVisible();
  await panels.getByRole('button',{name:'Preview',exact:true}).click();
  await expect(page.locator('.stage')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('missing screen capture defaults to camera with guidance', async ({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{value:undefined}));
  await page.goto('./');
  await page.getByRole('button',{name:'Record video',exact:true}).click();
  await expect(page.getByLabel('Recording source')).toHaveValue('camera');
  await expect(page.getByText(/Screen sharing is unavailable/)).toBeVisible();
});
test('missing WebM support explains why recording is unavailable', async ({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'MediaRecorder',{value:undefined}));
  await page.goto('./');
  await page.getByRole('button',{name:'Record video',exact:true}).click();
  await expect(page.getByRole('button',{name:'Start recording',exact:true})).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('cannot encode WebM');
});

test('phone users can import an image and adjust its green screen settings', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('./');
  const panels=page.getByRole('group',{name:'Editor panels'});
  await panels.getByRole('button',{name:'Media',exact:true}).click();
  await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({name:'green.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="lime"/><rect x="60" y="20" width="40" height="70" fill="red"/></svg>')});
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await page.locator('.timeline-clip').click();
  await panels.getByRole('button',{name:'Clip controls'}).click();
  await page.getByLabel('Remove green / blue screen',{exact:true}).check();
  await panels.getByRole('button',{name:'Preview',exact:true}).click();
  await expect(page.getByLabel('Green screen preview')).toBeVisible();
  await expect.poll(()=>page.getByLabel('Green screen preview').evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(5,5,1,1).data[3])).toBe(0);
  await expect(page.getByText('Autosaved locally',{exact:true})).toBeVisible();
  await page.reload();
  await page.getByRole('menuitem',{name:'File',exact:true}).click();
  await page.getByRole('menuitem',{name:'Open project…'}).click();
  await page.locator('.recent-list li').filter({hasText:'1 media'}).getByRole('button').first().click();
  await expect(page.locator('.timeline-clip')).toHaveCount(1);
  await expect(page.getByLabel('Green screen preview')).toBeVisible();
  await expect.poll(()=>page.locator('.visual-layer > img').evaluate((image:HTMLImageElement)=>image.naturalWidth)).toBe(160);
});
