const { test, expect } = require('@playwright/test');

async function openStudio(page) {
  await page.goto('/solutions/imagesplat/');
  await page.getByRole('button', { name: 'Effects', exact: true }).click();
  await page.getByRole('button', { name: 'Green Screen Studio…', exact: true }).click();
  await expect(page.locator('#greenScreenDialog')).toBeVisible();
}
async function photo(page, role, type) {
  await page.locator('#gsLayer').selectOption(String(role));
  const data = await page.evaluate(type => {
    const c = document.createElement('canvas'); c.width = 320; c.height = 180;
    const ctx = c.getContext('2d'); ctx.fillStyle = type === 'background' ? '#0000ff' : '#00ff00'; ctx.fillRect(0, 0, 320, 180);
    if (type === 'subject') { ctx.fillStyle = '#ff0000'; ctx.fillRect(100, 20, 120, 160); }
    return c.toDataURL().split(',')[1];
  }, type);
  await page.locator('#gsPhoto').setInputFiles({ name: type + '.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
  await expect(page.locator('#gsSourceName')).toHaveText(type + '.png');
}
const pixel = (page, id, x, y) => page.locator(id).evaluate((c, p) => [...c.getContext('2d').getImageData(Math.floor(c.width * p.x), Math.floor(c.height * p.y), 1, 1).data], { x, y });
async function decoded(page, download) {
  const b64 = require('node:fs').readFileSync(await download.path()).toString('base64');
  return page.evaluate(async data => {
    const img = new Image(); img.src = 'data:image/png;base64,' + data; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    return { width: c.width, height: c.height, left: [...ctx.getImageData(10, 10, 1, 1).data], center: [...ctx.getImageData(c.width / 2, c.height / 2, 1, 1).data] };
  }, b64);
}

test('replaces a green background with an image and downloads the composed scene', async ({ page }) => {
  await openStudio(page);
  await expect(page.locator('#gsDownload')).toBeDisabled();
  await photo(page, 1, 'subject');
  await photo(page, 0, 'background');
  await expect.poll(() => pixel(page, '#gsPreview', .05, .05)).toEqual([0, 0, 255, 255]);
  expect(await pixel(page, '#gsPreview', .5, .5)).toEqual([255, 0, 0, 255]);
  const pending = page.waitForEvent('download'); await page.locator('#gsDownload').click(); const file = await pending;
  expect(file.suggestedFilename()).toBe('imagesplat-green-screen.png');
  expect(await decoded(page, file)).toEqual({ width: 1280, height: 720, left: [0, 0, 255, 255], center: [255, 0, 0, 255] });
  await expect(page.locator('#greenScreenDialog')).toHaveCount(0);
});

test('manual masks can be erased, restored and undone; scene insertion is undoable', async ({ page }) => {
  await openStudio(page); await photo(page, 0, 'background'); await photo(page, 1, 'subject');
  const source = page.locator('#gsSource');
  await page.locator('#gsTool').selectOption('erase');
  let box = await source.boundingBox(); await source.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect.poll(() => pixel(page, '#gsPreview', .5, .5)).toEqual([0, 0, 255, 255]);
  await page.locator('#gsTool').selectOption('restore'); box = await source.boundingBox();
  await source.click({ position: { x: box.width / 2, y: box.height / 2 } });
  expect(await pixel(page, '#gsPreview', .5, .5)).toEqual([255, 0, 0, 255]);
  await page.locator('#gsUndoMask').click();
  expect(await pixel(page, '#gsPreview', .5, .5)).toEqual([0, 0, 255, 255]);
  await page.locator('#gsClearMask').click();
  expect(await pixel(page, '#gsPreview', .5, .5)).toEqual([255, 0, 0, 255]);
  await page.locator('#gsInsert').click();
  await expect(page.locator('#greenScreenDialog')).toHaveCount(0);
  await expect(page.locator('#docInfo')).toContainText('1 layers');
  await expect(page.locator('.layer .name')).toHaveText('Green-screen scene');
  await page.locator('.toolbar [data-action="undo"]').click();
  await expect(page.locator('#docInfo')).toContainText('0 layers');
});

test('crop, transform, three-layer ordering and chroma toggle affect composed pixels', async ({ page }) => {
  await page.goto('/solutions/imagesplat/');
  const actual = await page.evaluate(async () => {
    const { composite } = await import('/solutions/imagesplat/green-screen.js?v=20260915-studio');
    const source = color => { const c = document.createElement('canvas'); c.width = c.height = 100; const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, 100, 100); return c; };
    const settings = { key: false, color: '#00ff00', tolerance: 10, smoothing: 0, spill: false, x: 0, y: 0, scale: 100, rotation: 0, flip: false, left: 0, right: 0, top: 0, bottom: 0, strokes: [] };
    const back = { role: 'background', source: source('#0000ff'), settings: { ...settings } };
    const subject = { role: 'subject', source: source('#00ff00'), settings: { ...settings, key: true } };
    const front = { role: 'overlay', source: source('#ff0000'), settings: { ...settings, scale: 50, x: 25, left: 40 } };
    const points = c => [10, 55, 90].map(x => [...c.getContext('2d').getImageData(x, 50, 1, 1).data]);
    const keyed = points(composite([back, subject, front], 100, 100)); subject.settings.key = false;
    const unkeyed = points(composite([back, subject, front], 100, 100));
    return { keyed, unkeyed };
  });
  expect(actual.keyed).toEqual([[0, 0, 255, 255], [0, 0, 255, 255], [255, 0, 0, 255]]);
  expect(actual.unkeyed).toEqual([[0, 255, 0, 255], [0, 255, 0, 255], [255, 0, 0, 255]]);
});

test('camera denial leaves native phone capture and image upload available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => { throw new DOMException('denied', 'NotAllowedError'); } } });
  });
  await openStudio(page); await page.locator('#gsCamera').click();
  await expect(page.locator('#gsStatus')).toContainText('Camera access is blocked');
  await expect(page.locator('#gsCapture')).toHaveAttribute('capture', 'environment');
  await expect(page.locator('#gsPhoto')).toBeEnabled();
  await photo(page, 1, 'subject');
  await expect(page.locator('#gsDownload')).toBeEnabled();
});

async function fakeCamera(page, delayed = false) {
  await page.addInitScript(delayed => {
    window.__stops = 0;
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => {
      const c = document.createElement('canvas'); c.width = 320; c.height = 180; const ctx = c.getContext('2d');
      const draw = () => { ctx.fillStyle = '#00ff00'; ctx.fillRect(0, 0, 320, 180); ctx.fillStyle = '#ff0000'; ctx.fillRect(100, 20, 120, 160); };
      draw(); const stream = c.captureStream(15), timer = setInterval(draw, 65);
      for (const track of stream.getTracks()) { const stop = track.stop.bind(track); track.stop = () => { window.__stops++; clearInterval(timer); stop(); }; }
      if (delayed) return new Promise(resolve => { window.__allowCamera = () => resolve(stream); });
      return stream;
    } } });
  }, delayed);
}

test('live camera composites and freezes while releasing camera tracks', async ({ page }) => {
  await fakeCamera(page); await openStudio(page); await photo(page, 0, 'background'); await page.locator('#gsLayer').selectOption('1');
  await page.locator('#gsCamera').click(); await expect(page.locator('#gsSourceName')).toHaveText('Live camera');
  await expect.poll(() => pixel(page, '#gsPreview', .05, .05)).toEqual([0, 0, 255, 255]);
  expect(await pixel(page, '#gsPreview', .5, .5)).toEqual([255, 0, 0, 255]);
  await page.locator('#gsFreeze').click();
  await expect(page.locator('#gsSourceName')).toHaveText('Camera snapshot');
  expect(await page.evaluate(() => window.__stops)).toBe(1);
  await page.locator('#gsCamera').click(); await expect(page.locator('#gsSourceName')).toHaveText('Live camera');
  await page.locator('#gsClose').click();
  await expect.poll(() => page.evaluate(() => window.__stops)).toBe(2);
});

test('closing while camera permission is pending stops a late camera stream', async ({ page }) => {
  await fakeCamera(page, true); await openStudio(page); await page.locator('#gsCamera').click();
  await expect.poll(() => page.evaluate(() => typeof window.__allowCamera)).toBe('function');
  await page.locator('#gsClose').click(); await page.evaluate(() => window.__allowCamera());
  await expect.poll(() => page.evaluate(() => window.__stops)).toBe(1);
  await expect(page.locator('#greenScreenDialog')).toHaveCount(0);
});
