const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
test('native Publisher bytes decode entirely in a browser worker, without a desktop service', async ({ page }) => {
  test.setTimeout(120000); await page.goto('/splatworks/layoutsplat/'); await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true);
  const bytes = await fs.readFile(path.join(__dirname, 'fixtures/layoutsplat/native-publisher.pub'));
  const result = await page.evaluate(data => new Promise((resolve, reject) => {
    const worker = new Worker('/splatworks/layoutsplat/publisher/worker.mjs', { type: 'module' }); const timer = setTimeout(() => { worker.terminate(); reject(Error('Publisher decoding timed out.')); }, 60000);
    worker.onmessage = event => { clearTimeout(timer); worker.terminate(); resolve(event.data); }; worker.onerror = error => { clearTimeout(timer); worker.terminate(); reject(Error(error.message)); };
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0)); worker.postMessage(bytes.buffer, [bytes.buffer]);
  }), bytes.toString('base64'));
  expect(result.error).toBeUndefined(); expect(result.events.filter(e => e.op === 'startPage')).toHaveLength(2); expect(result.events.filter(e => e.op === 'startTextObject')).toHaveLength(1);
  const text = result.events.filter(e => e.op === 'insertText').map(e => e.data).join(''); console.log('Native Publisher text:', text); expect(text.length).toBeGreaterThan(8);
});
test('native Publisher opening preserves its original bytes and decodes explicit legacy Cyrillic', async ({ page }) => {
  test.setTimeout(120000); await page.goto('/splatworks/layoutsplat/'); await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true);
  page.on('dialog', dialog => dialog.accept()); await page.locator('#fileMenu > summary').click(); await page.locator('#fileImport > summary').click(); await page.locator('[data-action=publisherSettings]').click(); await page.locator('#pubEncoding').selectOption('windows-1251'); await page.locator('#publisherSettingsDialog button').click();
  await page.locator('#projectInput').setInputFiles(path.join(__dirname, 'fixtures/layoutsplat/native-publisher.pub'));
  await expect.poll(() => page.evaluate(() => LayoutSplat.getPublication().importedFrom), { timeout: 60000 }).toBe('Microsoft Publisher');
  const doc = await page.evaluate(() => LayoutSplat.getPublication()); expect(doc.pages).toHaveLength(2); expect(Object.values(doc.stories).map(s => s.text).join('')).toContain('Русский текст'); expect(doc.originalPublisher.src).toMatch(/^data:application\/octet-stream;base64,/);
  await expect(page.locator('#importReportDialog')).toBeVisible(); await page.locator('#importReportDialog button').click();
  await page.locator('#projectInput').setInputFiles({ name: 'invalid.pub', mimeType: 'application/octet-stream', buffer: Buffer.from('Not a Publisher document') });
  await expect(page.locator('#importReportDialog')).toBeVisible(); expect(await page.evaluate(() => LayoutSplat.getPublication())).toEqual(doc);
});

// Exercise an extracted standalone package with all external requests blocked.
test.beforeEach(async({context})=>{if(process.env.LAYOUTSPLAT_OFFLINE_CHECK)await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());});
