const { test, expect } = require('@playwright/test');
const { PDFDocument } = require('../vendor/pdf-lib.min.js');

test('production opens a PDF and enables editing', async ({ page }) => {
  test.skip(!process.env.PDFSPLAT_PRODUCTION_TEST, 'Run explicitly against production.');
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const document = await PDFDocument.create();
  document.addPage([400, 600]);
  const bytes = await document.save();
  await page.goto('https://drawsplat.org/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'smoke.pdf', mimeType:'application/pdf', buffer:Buffer.from(bytes) });
  await expect(page.locator('#status')).toContainText('opened');
  await expect(page.locator('#dropZone')).toBeHidden();
  await expect(page.locator('#documentView')).toBeVisible();
  await expect(page.locator('#pdfCanvas')).toBeVisible();
  await expect(page.locator('#addTextButton')).toBeEnabled();
  await page.locator('#addTextButton').click();
  await expect(page.locator('.text-object')).toHaveCount(1);
  expect(errors).toEqual([]);
});
