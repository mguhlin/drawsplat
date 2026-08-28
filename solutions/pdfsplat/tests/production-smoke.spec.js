const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts } = require('../vendor/pdf-lib.min.js');

test('production opens a PDF and enables editing', async ({ page }) => {
  test.skip(!process.env.PDFSPLAT_PRODUCTION_TEST, 'Run explicitly against production.');
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  document.addPage([400, 600]).drawText('Production text', { x:40, y:520, size:20, font });
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
  await page.locator('#editTextButton').click();
  await page.getByRole('button', { name:'Edit text: Production text' }).click();
  await expect(page.locator('#textValue')).toHaveValue('Production text');
  const applicationErrors = errors.filter(message => !message.includes('static.cloudflareinsights.com/beacon.min.js'));
  expect(applicationErrors).toEqual([]);
});
