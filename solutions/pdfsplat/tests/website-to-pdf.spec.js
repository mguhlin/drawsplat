const { test, expect } = require('@playwright/test');
const { PDFDocument } = require('../vendor/pdf-lib.min.js');

test('unsupported browsers explain capture availability without a URL or print workflow', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { configurable: true, value: undefined }));
  await page.goto('/solutions/pdfsplat/');
  await page.getByRole('button', { name: 'Capture to PDF', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Capture an open tab or window', exact: true })).toBeVisible();
  await expect(page.locator('#websiteShare')).toBeDisabled();
  await expect(page.locator('#websiteStatus')).toContainText('desktop browser');
  await expect(page.locator('#websiteUrl')).toHaveCount(0);
  await expect(page.locator('#websiteDialog')).not.toContainText('Print');
});

async function fakeSharing(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { configurable: true, value: async options => {
      window.captureOptions = options;
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 480;
      const paint = () => {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = 'black'; ctx.font = '28px sans-serif';
        ctx.fillText('Unpublished preview', 20, 100);
      };
      paint();
      const timer = setInterval(paint, 50);
      const stream = canvas.captureStream(20);
      const track = stream.getVideoTracks()[0], stop = track.stop.bind(track);
      track.stop = () => { clearInterval(timer); stop(); window.sharingStopped = true; };
      return stream;
    } });
  });
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#websiteButton').click();
  await page.locator('#websiteShare').click();
  await expect(page.locator('#websiteStatus')).toContainText('Sharing is ready');
}

test('captures multiple pages, removes one, downloads a valid PDF and stops sharing', async ({ page }) => {
  await fakeSharing(page);
  await page.locator('#websiteCapture').click();
  await expect(page.locator('#websitePages li')).toHaveCount(1);
  await page.locator('#websiteCapture').click();
  await expect(page.locator('#websitePages li')).toHaveCount(2);
  await page.getByRole('button', { name: 'Remove page 1', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.locator('#websiteDownload').click();
  const file = await download;
  const pdf = await PDFDocument.load(require('fs').readFileSync(await file.path()));
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getSize()).toEqual({ width: 480, height: 360 });
  expect(await page.evaluate(() => window.sharingStopped)).toBe(true);
  expect(await page.evaluate(() => window.captureOptions.audio)).toBe(false);
});

test('adds captures into editor and clears the closed session', async ({ page }) => {
  await fakeSharing(page);
  await page.locator('#websiteCapture').click();
  await expect(page.locator('#websitePages li')).toHaveCount(1);
  await page.locator('#websiteAdd').click();
  await expect(page.locator('#websiteDialog')).not.toBeVisible();
  await expect(page.locator('#pageCount')).toHaveText('1');
  expect(await page.evaluate(() => window.sharingStopped)).toBe(true);
  await page.locator('#websiteButton').click();
  await expect(page.locator('#websitePages li')).toHaveCount(0);
});

test('canceling sharing leaves a usable retry', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { value: async () => { throw new DOMException('Denied', 'NotAllowedError'); } }));
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#websiteButton').click();
  await page.locator('#websiteShare').click();
  await expect(page.locator('#websiteStatus')).toContainText('canceled or denied');
  await expect(page.locator('#websiteShare')).toBeEnabled();
  await expect(page.locator('#websiteCapture')).toBeDisabled();
});

test('closing during the screen picker stops a late-arriving stream', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { value: () => new Promise(resolve => { window.finishPicker = () => resolve({ getTracks: () => [{ stop: () => { window.lateStreamStopped = true; } }] }); }) }));
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#websiteButton').click();
  await page.locator('#websiteShare').click();
  await page.locator('#websiteClose').click();
  await page.evaluate(() => window.finishPicker());
  await expect.poll(() => page.evaluate(() => window.lateStreamStopped)).toBe(true);
  await page.locator('#websiteButton').click();
  await expect(page.locator('#websiteShare')).toBeEnabled();
});
