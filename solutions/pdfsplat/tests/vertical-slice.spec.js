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
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  const sourcePage = source.addPage([500, 300]);
  const firstRun = 'QualityFix Ap';
  const secondRun = 'pliance Repair Service';
  sourcePage.drawText(firstRun, { x:30, y:240, size:20, font });
  sourcePage.drawText(secondRun, { x:30 + font.widthOfTextAtSize(firstRun, 20), y:240, size:20, font });
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'editable.pdf', mimeType:'application/pdf', buffer:Buffer.from(await source.save()) });
  await page.getByRole('button', { name:'Edit PDF text' }).click();
  const textRun = page.getByRole('button', { name:'Edit text: QualityFix Appliance Repair Service' });
  await expect(textRun).toBeVisible();
  await textRun.click();
  await expect(page.locator('#textValue')).toHaveValue('QualityFix Appliance Repair Service');
  const inPlaceEditor = page.getByRole('textbox', { name:'Edit replacement text in place' });
  await expect(inPlaceEditor).toBeFocused();
  await inPlaceEditor.fill('Replacement text');
  await inPlaceEditor.press('Tab');
  await expect(page.locator('.text-object')).toContainText('Replacement text');
});

test('multi-selects thumbnails and applies page actions to the selection', async ({ page }) => {
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  for (let index = 1; index <= 4; index++) source.addPage([300, 500]).drawText(`Page ${index}`, { x:30, y:450, font, size:20 });

  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'packet.pdf', mimeType:'application/pdf', buffer:Buffer.from(await source.save()) });
  const thumbs = page.locator('.thumbnail');
  await thumbs.nth(0).click();
  await thumbs.nth(2).click({ modifiers:['Control'] });
  await expect(page.locator('.thumbnail.selected')).toHaveCount(2);

  await thumbs.nth(2).click({ button:'right' });
  await expect(page.getByRole('heading', { name:'Move selected pages' })).toBeVisible();
  await page.locator('#movePagePosition').fill('2');
  await page.getByRole('button', { name:'Move pages' }).click();
  await expect(page.locator('#status')).toContainText('positions 2–3');
  await expect(page.locator('.thumbnail.selected')).toHaveCount(2);

  await page.locator('.thumbnail.selected').first().dragTo(page.locator('.thumbnail').last());
  await expect(page.locator('#status')).toContainText('positions 3–4');
  await expect(page.locator('.thumbnail.selected')).toHaveCount(2);

  await page.getByRole('button', { name:'Rotate right' }).click();
  await page.getByRole('button', { name:'Duplicate page' }).click();
  await expect(page.locator('.thumbnail')).toHaveCount(6);
  await expect(page.locator('.thumbnail.selected')).toHaveCount(2);
  await page.getByRole('button', { name:'Delete page' }).click();
  await expect(page.locator('.thumbnail')).toHaveCount(4);

  await page.locator('.thumbnail').nth(0).click();
  await page.locator('.thumbnail').nth(2).click({ modifiers:['Shift'] });
  await expect(page.locator('.thumbnail.selected')).toHaveCount(3);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name:'Extract page' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('packet-selected-pages.pdf');
  expect((await PDFDocument.load(await require('fs/promises').readFile(await download.path()))).getPageCount()).toBe(3);
});

test('visually removes any selected page area and keeps the cover editable', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'remove.pdf', mimeType:'application/pdf', buffer:Buffer.from(await makePdf('Remove this object')) });
  await page.getByRole('button', { name:'Remove area' }).click();
  const layer = page.locator('#annotationLayer');
  const box = await layer.boundingBox();
  await page.mouse.move(box.x + 30, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 90);
  await page.mouse.up();
  await expect(page.locator('.mask-object')).toHaveCount(1);
  await expect(page.locator('#status')).toContainText('not secure redaction');
  await page.locator('.mask-object').click();
  await page.keyboard.press('Delete');
  await expect(page.locator('.mask-object')).toHaveCount(0);
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
  await page.getByRole('button', { name:'Protect / Unprotect' }).click();
  await expect(page.locator('#vaultIntro')).toContainText('AES-256-GCM');
  await page.getByRole('button', { name:'Protect this PDF' }).click();
  await page.locator('#vaultPassword').fill('classroom-safe-password');
  await page.locator('#vaultConfirm').fill('classroom-safe-password');
  const encryptedDownload = page.waitForEvent('download');
  await page.getByRole('button', { name:'Protect and download' }).click();
  const encrypted = await encryptedDownload;
  expect(encrypted.suggestedFilename()).toBe('private-edited.pdf.csplat');

  await page.getByRole('button', { name:'Protect / Unprotect' }).click();
  await page.getByRole('button', { name:'Unprotect a PDF' }).click();
  await page.locator('#vaultInput').setInputFiles(await encrypted.path());
  await page.locator('#vaultPassword').fill('classroom-safe-password');
  await page.getByRole('button', { name:'Unprotect and open' }).click();
  await expect(page.locator('#status')).toContainText('authenticated, decrypted, and opened locally', { timeout:120000 });
  await expect(page.locator('.thumbnail')).toHaveCount(1);
});
