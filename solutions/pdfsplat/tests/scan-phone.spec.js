const { test, expect } = require('@playwright/test');
const { PDFDocument } = require('../vendor/pdf-lib.min.js');

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

async function openScanner(page) {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#scanStartButton').tap();
  await expect(page.locator('#scanDialog')).toBeVisible();
}

async function takePhoto(page) {
  const chooserPromise = page.waitForEvent('filechooser');
  // Tap the visible control, not setInputFiles on an otherwise unreachable input.
  await page.locator('#scanTakePhoto').tap();
  const chooser = await chooserPromise;
  expect(await chooser.element().getAttribute('capture')).toBe('environment');
  expect(chooser.isMultiple()).toBe(false);
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 240, 320);
    ctx.fillStyle = 'black';
    ctx.fillText('Phone scan', 30, 50);
    return canvas.toDataURL('image/jpeg').split(',')[1];
  });
  await chooser.setFiles({ name: 'camera.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(data, 'base64') });
}

test('native phone camera picker works without live camera access and creates a PDF', async ({ page }) => {
  await page.addInitScript(() => {
    window.liveCameraCalls = 0;
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => {
      window.liveCameraCalls++;
      throw new DOMException('Permission denied', 'NotAllowedError');
    } } });
    // Catch regressions to a proxy button calling a hidden input's click().
    HTMLInputElement.prototype.click = function () { throw new Error('Use the native file input'); };
  });
  await openScanner(page);
  await takePhoto(page);
  await expect(page.locator('#scanPages li')).toHaveCount(1);
  await page.locator('#scanSave').tap();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#scanDownload').tap();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect((await PDFDocument.load(Buffer.concat(chunks))).getPageCount()).toBe(1);
  expect(await page.evaluate(() => window.liveCameraCalls)).toBe(0);
});

test('blocked live preview leaves the native camera and gallery usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); } } });
  });
  await openScanner(page);
  await page.locator('#scanCamera').tap();
  await expect(page.locator('#scanStatus')).toContainText('Android Settings');
  await expect(page.locator('#scanCamera')).toBeEnabled();
  await expect(page.locator('#scanCameraPanel')).toBeHidden();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('#scanUpload').tap();
  const chooser = await chooserPromise;
  expect(chooser.isMultiple()).toBe(true);
  await chooser.setFiles([]);
  await takePhoto(page);
  await expect(page.locator('#scanPages li')).toHaveCount(1);
});

test('native camera selection cancels a pending live request and releases a late stream', async ({ page }) => {
  await page.addInitScript(() => {
    window.cameraStopped = false;
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: () => new Promise(resolve => {
      window.finishCamera = () => resolve({ getTracks: () => [{ stop: () => { window.cameraStopped = true; } }] });
    }) } });
  });
  await openScanner(page);
  await page.locator('#scanCamera').tap();
  await expect(page.locator('#scanCamera')).toBeDisabled();
  await expect.poll(() => page.evaluate(() => typeof window.finishCamera)).toBe('function');
  await takePhoto(page);
  await page.evaluate(() => window.finishCamera());
  await expect.poll(() => page.evaluate(() => window.cameraStopped)).toBe(true);
  await expect(page.locator('#scanCameraPanel')).toBeHidden();
  await expect(page.locator('#scanPages li')).toHaveCount(1);
});
