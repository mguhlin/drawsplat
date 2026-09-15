const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const manifest = require('../assets/coloring-book/manifest.json');

async function open(page, route = '/app/whiteboard.html') {
  await page.addInitScript(() => {
    localStorage.setItem('drawsplat.welcomed', '1');
    localStorage.setItem('drawsplat.consent.accepted', '1');
    localStorage.setItem('drawsplat.lastStartupTipDate', new Date().toISOString().slice(0, 10));
  });
  await page.goto(route);
  await expect(page.locator('#canvasToolHud')).toBeVisible();
}
async function activate(page, id) { await page.locator('#' + id).evaluate(el => el.click()); }
async function saved(page) {
  const waiting = page.waitForEvent('download');
  await activate(page, 'saveLocalBtn');
  return JSON.parse(await fs.readFile(await (await waiting).path(), 'utf8'));
}

for (const route of ['/app/whiteboard.html', '/languages/index-sp.html']) {
  test(`Smithsonian thumbnails and inserted photos load at ${route}`, async ({ page }) => {
    await open(page, route);
    await activate(page, 'imageBtn');
    await page.locator('#imageSourceGalleryBtn').click();
    const tiles = page.locator('[data-gallery-src*="smithsonian-animals"]');
    await expect(tiles).toHaveCount(10);
    for (const tile of await tiles.all()) {
      await tile.scrollIntoViewIfNeeded();
      await expect.poll(() => tile.locator('img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
      expect(await tile.locator('img').getAttribute('src')).toMatch(/^\.\.\/assets\//);
    }
    await tiles.first().click();
    await expect(page.locator('#imageGalleryDialog')).not.toBeVisible();
    const board = await saved(page);
    expect(board.panels[0].objects.at(-1).src).toMatch(/^data:image\//);
  });

  test(`Smithsonian Picture Graph photo presets load at ${route}`, async ({ page }) => {
    await open(page, route);
    await activate(page, 'openPictureGraphDialogBtn');
    const preview = page.locator('#pictureGraphPreview svg');
    const box = await preview.boundingBox();
    await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.91);
    const select = page.locator('#pictureGraphSelectedPreset');
    await expect(select).toBeVisible();
    const values = await select.locator('option').evaluateAll(options => options.map(o => o.value).filter(v => v.includes('smithsonian-animals')));
    expect(values).toHaveLength(10);
    for (const value of values) {
      await select.selectOption(value);
      await expect.poll(() => page.locator('#pictureGraphDialog').evaluate(el => el._itemSymbols[el.dataset.selectedPictureKey] || '')).toMatch(/^data:image\//);
      await page.locator('#pictureGraphSelectedRemoveBtn').click();
    }
  });
}

test('curated coloring picker matches manifest and every image is full size', async ({ page }) => {
  await open(page);
  await activate(page, 'openColoringBookDialogBtn');
  const tiles = page.locator('#coloringBookGrid [data-coloring-id]');
  await expect(tiles).toHaveCount(manifest.length);
  expect(await tiles.evaluateAll(es => es.map(e => e.dataset.coloringId))).toEqual(manifest.map(x => x.id));
  for (const tile of await tiles.all()) {
    await expect.poll(() => tile.locator('img').evaluate(img => img.naturalWidth)).toBeGreaterThanOrEqual(800);
  }
  await page.locator('[data-coloring-category="space"]').click();
  await expect(tiles).toHaveCount(1);
  await tiles.first().click();
  await expect(page.locator('#coloringBookDialog')).not.toBeVisible();
  const board = await saved(page);
  const image = board.panels[0].objects.at(-1);
  expect(image.coloringBookId).toBe('space-lunar-rover');
  expect(image.naturalW).toBeGreaterThanOrEqual(1024);
  expect(image.naturalH).toBeGreaterThanOrEqual(1536);
  expect(image.src).toMatch(/^data:image\/png/);
  await page.reload();
  expect((await saved(page)).panels[0].objects.at(-1).src).toBe(image.src);
});

test('Smithsonian photo can be used as a background', async ({ page }) => {
  await open(page);
  await activate(page, 'loadBgImageBtn');
  await page.locator('#backgroundSourceGalleryBtn').click();
  await page.locator('[data-gallery-src*="smithsonian-animals"]').first().click();
  await expect(page.locator('#imageGalleryDialog')).not.toBeVisible();
  const board = await saved(page);
  expect(JSON.stringify(board.panels[0])).toContain('data:image/');
});
