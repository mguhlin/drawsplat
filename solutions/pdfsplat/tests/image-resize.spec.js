const { test, expect } = require('@playwright/test');
const { PDFDocument } = require('../vendor/pdf-lib.min.js');

async function openImage(page) {
  const pdf = await PDFDocument.create(); pdf.addPage([400, 600]);
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name: 'image.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.locator('#addImageButton')).toBeEnabled();
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 200; c.height = 100;
    c.getContext('2d').fillRect(0, 0, 200, 100);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#imageInput').setInputFiles({ name: 'image.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.locator('.image-object')).toBeVisible();
}

for (const corner of ['nw', 'ne', 'se', 'sw']) {
  test(`image ${corner} handle resizes proportionally and supports undo`, async ({ page }) => {
    await openImage(page);
    const image = page.locator('.image-object');
    const before = await image.boundingBox();
    const handle = await image.locator(`.${corner}`).boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + (corner.includes('w') ? -25 : 25), handle.y + handle.height / 2 + (corner.includes('n') ? -15 : 15), { steps: 5 });
    await page.mouse.up();
    const after = await image.boundingBox();
    expect(after.width).toBeGreaterThan(before.width + 10);
    expect(after.width / after.height).toBeCloseTo(before.width / before.height, 1);
    expect(corner.includes('w') ? after.x + after.width : after.x).toBeCloseTo(corner.includes('w') ? before.x + before.width : before.x, 0);
    await page.locator('#undoButton').click();
    await expect.poll(async () => (await image.boundingBox())?.width).toBeCloseTo(before.width, 0);
    await page.locator('#redoButton').click();
    await expect.poll(async () => (await image.boundingBox())?.width).toBeCloseTo(after.width, 0);
  });
}

test('image handles fit a phone viewport and resize with keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openImage(page);
  const image = page.locator('.image-object');
  const before = await image.boundingBox();
  await image.locator('.se').press('Shift+ArrowRight');
  expect((await image.boundingBox()).width).toBeGreaterThan(before.width);
  await expect(image.locator('.image-resize-handle')).toHaveCount(4);
});

test('resized image dimensions are preserved in the saved PDF', async ({ page }) => {
  await openImage(page);
  await page.locator('.image-object .se').press('Shift+ArrowRight');
  const size = await page.locator('.image-object').evaluate(node => [parseFloat(node.style.width) * 4, parseFloat(node.style.height) * 6]);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#saveAsSelect').selectOption('pdf');
  const bytes = await require('fs/promises').readFile(await (await downloadPromise).path());
  const transforms = await page.evaluate(async bytes => {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
    const ops = await (await pdf.getPage(1)).getOperatorList();
    const transforms = ops.fnArray.flatMap((fn, index) => fn === pdfjsLib.OPS.transform ? [ops.argsArray[index]] : []);
    await pdf.destroy(); return transforms;
  }, [...bytes]);
  expect(transforms.some(matrix => Math.abs(matrix[0] - size[0]) < .1 && Math.abs(matrix[3] - size[1]) < .1)).toBe(true);
});
