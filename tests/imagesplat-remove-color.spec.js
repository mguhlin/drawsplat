const { test, expect } = require('@playwright/test');

async function openTool(page) {
  await page.goto('/solutions/imagesplat/');
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1000; c.height = 100;
    const x = c.getContext('2d'); x.fillStyle = '#00ff00'; x.fillRect(0, 0, 1000, 100);
    x.fillStyle = '#ff0000'; x.fillRect(400, 0, 100, 100);
    return c.toDataURL().split(',')[1];
  });
  await page.locator('#imageInput').setInputFiles({ name: 'green-screen.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.locator('#docInfo')).toContainText('1 layers');
  await reopen(page);
}
async function reopen(page) {
  await page.getByRole('button', { name: 'Effects', exact: true }).click();
  await page.getByRole('button', { name: 'Remove color…', exact: true }).click();
  await expect(page.locator('#removeColorDialog')).toBeVisible();
}
async function previewPixel(page, x) {
  return page.locator('#colorResult').evaluate((c, x) => [...c.getContext('2d').getImageData(Math.floor(x * c.width), 10, 1, 1).data], x);
}
async function pick(page) {
  const box = await page.locator('#colorOriginal').boundingBox();
  await page.locator('#colorOriginal').click({ position: { x: box.width * .1, y: box.height * .5 } });
}
for (const mode of ['all', 'connected']) {
  test(`green screen ${mode} removal downloads original resolution with correct alpha`, async ({ page }) => {
    await openTool(page);
    await page.getByRole('button', { name: 'Green screen', exact: true }).click();
    await page.locator('#colorMode').selectOption(mode);
    if (mode === 'connected') {
      await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
      await pick(page);
    }
    await expect.poll(() => previewPixel(page, .1)).toEqual([0, 0, 0, 0]);
    expect((await previewPixel(page, .45))[3]).toBe(255);
    expect((await previewPixel(page, .9))[3]).toBe(mode === 'all' ? 0 : 255);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('green-screen-transparent.png');
    const fs = require('node:fs');
    const base64 = fs.readFileSync(await download.path()).toString('base64');
    const decoded = await page.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      return { width: c.width, height: c.height, alpha: [100, 450, 900].map(p => x.getImageData(p, 50, 1, 1).data[3]) };
    }, base64);
    expect(decoded).toEqual({ width: 1000, height: 100, alpha: [0, 255, mode === 'all' ? 0 : 255] });
    await expect(page.locator('#removeColorDialog')).toHaveCount(0);
  });
}

test('apply, undo, cancel and reset retain original image data', async ({ page }) => {
  await openTool(page);
  await pick(page);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  expect((await previewPixel(page, .1))[3]).toBe(255);
  await pick(page);
  await page.getByRole('button', { name: 'Apply to layer' }).click();
  await expect(page.locator('#removeColorDialog')).toHaveCount(0);
  await reopen(page);
  expect((await previewPixel(page, .1))[3]).toBe(0);
  await page.locator('#removeColorDialog').getByRole('button', { name: 'Close', exact: true }).click();
  // Original image data must remain available beyond the old object-URL expiry.
  await page.waitForTimeout(1600);
  await page.locator('.toolbar [data-action="undo"]').click();
  // Undo clears selection. Select the image through its layer row.
  await page.locator('.layer .name').click();
  await reopen(page);
  expect((await previewPixel(page, .1))[3]).toBe(255);
  await pick(page);
  await page.keyboard.press('Escape');
  await reopen(page);
  expect((await previewPixel(page, .1))[3]).toBe(255);
});

test('tolerance and smoothing preserve source alpha and disconnected pixels', async ({ page }) => {
  await page.goto('/solutions/imagesplat/');
  const result = await page.evaluate(async () => {
    const { removeColor } = await import('/solutions/imagesplat/remove-color.js?v=20260915');
    const source = new ImageData(new Uint8ClampedArray([0,255,0,255, 30,225,30,128, 255,0,0,255, 0,255,0,255]), 4, 1);
    const options = {color:[0,255,0], tolerance:10, smoothing:40};
    return { soft:[...removeColor(source, options).data], hard:[...removeColor(source,{...options,smoothing:0}).data], connected:[...removeColor(source,{...options,mode:'connected',seed:{x:0,y:0}}).data], source:[...source.data] };
  });
  expect(result.soft[3]).toBe(0);
  expect(result.soft[7]).toBe(64);
  expect(result.hard[7]).toBe(128);
  expect(result.soft[11]).toBe(255);
  expect(result.connected[15]).toBe(255);
  expect(result.source[3]).toBe(255);
});
