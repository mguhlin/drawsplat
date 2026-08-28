const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts } = require('../vendor/pdf-lib.min.js');
const JSZip = require('../../../vendor/jszip.min.js');

async function makePdf(label, size = [300, 500]) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  document.addPage(size).drawText(label, { x: 30, y: size[1] - 50, font, size: 20 });
  return document.save();
}

test('opens, edits, reorders, rotates, exports, and reopens a PDF', async ({ page }) => {
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  source.addPage([300, 500]).drawText('First page', { x: 30, y: 450, font, size: 20 });
  source.addPage([500, 300]).drawText('Second page', { x: 30, y: 250, font, size: 20 });
  const bytes = await source.save();

  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name: 'lesson.pdf', mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
  await expect(page.locator('#status')).toContainText('2 pages');
  await expect(page.locator('#dropZone')).toBeHidden();
  await expect(page.locator('#documentView')).toBeVisible();
  await expect(page.locator('#pdfCanvas')).toBeVisible();
  await page.getByRole('button', { name: 'Add text' }).click();
  await page.locator('#textValue').fill('Teacher directions');
  await page.locator('#textValue').press('Tab');

  const thumbs = page.locator('.thumbnail');
  await thumbs.nth(0).dragTo(thumbs.nth(1));
  await page.getByRole('button', { name: 'Rotate right' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('lesson-edited.pdf');
  const exported = await PDFDocument.load(await require('fs/promises').readFile(await download.path()));
  expect(exported.getPageCount()).toBe(2);
  expect(exported.getPage(0).getSize()).toEqual({ width: 500, height: 300 });
  expect(exported.getPage(1).getSize()).toEqual({ width: 300, height: 500 });
  expect(exported.getPage(1).getRotation().angle).toBe(90);
});

test('turns clicked extractable PDF text into an editable replacement', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'editable.pdf', mimeType:'application/pdf', buffer:Buffer.from(await makePdf('Click this text')) });
  await page.getByRole('button', { name:'Edit PDF text' }).click();
  const textRun = page.getByRole('button', { name:'Edit text: Click this text' });
  await expect(textRun).toBeVisible();
  await textRun.click();
  await expect(page.locator('#textValue')).toHaveValue('Click this text');
  await page.locator('#textValue').fill('Replacement text');
  await page.locator('#textValue').press('Tab');
  await expect(page.locator('.text-object')).toContainText('Replacement text');
});

test('merges PDFs and separates page ranges into a ZIP', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'one.pdf', mimeType:'application/pdf', buffer:Buffer.from(await makePdf('One')) });
  await expect(page.locator('#status')).toContainText('1 pages');
  await page.locator('#mergeInput').setInputFiles({ name:'two.pdf', mimeType:'application/pdf', buffer:Buffer.from(await makePdf('Two', [500, 300])) });
  await expect(page.locator('#status')).toContainText('pages from two.pdf added');
  await expect(page.locator('.thumbnail')).toHaveCount(2);

  await page.getByRole('button', { name:'Separate / Split' }).click();
  await page.locator('#splitRanges').fill('1, 2');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#splitForm').getByRole('button', { name:'Download' }).click();
  const download = await downloadPromise;
  const archive = await JSZip.loadAsync(await require('fs/promises').readFile(await download.path()));
  expect(Object.keys(archive.files).sort()).toEqual(['part-1.pdf', 'part-2.pdf']);
  expect((await PDFDocument.load(await archive.file('part-1.pdf').async('uint8array'))).getPageCount()).toBe(1);
});

test('protects an edited PDF with CipherSplat and unlocks it back into the editor', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'private.pdf', mimeType:'application/pdf', buffer:Buffer.from(await makePdf('Private')) });
  await expect(page.locator('#status')).toContainText('1 pages');
  await page.getByRole('button', { name:'Protect' }).click();
  await page.locator('#vaultPassword').fill('classroom-safe-password');
  await page.locator('#vaultConfirm').fill('classroom-safe-password');
  const encryptedDownload = page.waitForEvent('download');
  await page.getByRole('button', { name:'Protect and download' }).click();
  const encrypted = await encryptedDownload;
  expect(encrypted.suggestedFilename()).toBe('private-edited.pdf.csplat');

  await page.locator('#vaultInput').setInputFiles(await encrypted.path());
  await page.locator('#vaultPassword').fill('classroom-safe-password');
  await page.getByRole('button', { name:'Unlock and open' }).click();
  await expect(page.locator('#status')).toContainText('authenticated, decrypted, and opened locally', { timeout:120000 });
  await expect(page.locator('.thumbnail')).toHaveCount(1);
});
