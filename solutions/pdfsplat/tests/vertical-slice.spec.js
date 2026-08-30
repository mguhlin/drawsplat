const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts } = require('../vendor/pdf-lib.min.js');
const JSZip = require('../../../vendor/jszip.min.js');

async function makePdf(label, size = [300, 500]) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  document.addPage(size).drawText(label, { x: 30, y: size[1] - 50, font, size: 20 });
  return document.save();
}

test('uses the supplied PDFsplat artwork for app and splash branding', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', './pdfsplat.png');
  await expect(page.locator('.brand img')).toHaveAttribute('src', './pdfsplat.png');
  await expect(page.locator('.drop-logo')).toBeVisible();
  await expect(page.locator('.drop-logo')).toHaveJSProperty('naturalWidth', 1254);
});

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
  const textBoxBefore = await page.locator('.text-object').boundingBox();
  const resizeHandle = await page.getByRole('button', { name:'Resize text' }).boundingBox();
  await page.mouse.move(resizeHandle.x + resizeHandle.width / 2, resizeHandle.y + resizeHandle.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizeHandle.x + 90, resizeHandle.y + 45, { steps:5 });
  await page.mouse.up();
  const textBoxAfter = await page.locator('.text-object').boundingBox();
  expect(textBoxAfter.width).toBeGreaterThan(textBoxBefore.width + 50);
  expect(textBoxAfter.height).toBeGreaterThan(textBoxBefore.height + 20);
  await page.locator('#textValue').fill('Teacher directions');
  await page.locator('#textValue').press('Tab');

  const thumbs = page.locator('.thumbnail');
  await thumbs.nth(0).dragTo(thumbs.nth(1));
  await page.getByRole('button', { name: 'Rotate right' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact:true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('lesson-edited.pdf');
  const exported = await PDFDocument.load(await require('fs/promises').readFile(await download.path()));
  expect(exported.getPageCount()).toBe(2);
  expect(exported.getPage(0).getSize()).toEqual({ width: 500, height: 300 });
  expect(exported.getPage(1).getSize()).toEqual({ width: 300, height: 500 });
  expect(exported.getPage(1).getRotation().angle).toBe(90);
});

test('navigates pages with visible arrows and keyboard arrow keys', async ({ page }) => {
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  for (let number = 1; number <= 3; number++) source.addPage([300, 500]).drawText(`Page ${number}`, { x:30, y:450, font, size:20 });
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'navigation.pdf', mimeType:'application/pdf', buffer:Buffer.from(await source.save()) });
  await expect(page.locator('#pagePosition')).toHaveText('1 / 3');
  await expect(page.getByRole('button', { name:'Previous page' })).toBeDisabled();
  await page.getByRole('button', { name:'Next page' }).click();
  await expect(page.locator('#pagePosition')).toHaveText('2 / 3');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#pagePosition')).toHaveText('3 / 3');
  await expect(page.getByRole('button', { name:'Next page' })).toBeDisabled();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#pagePosition')).toHaveText('2 / 3');
  await page.getByRole('button', { name:'Add text' }).click();
  await page.locator('#textValue').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#pagePosition')).toHaveText('2 / 3');
});

test('reverses pages, inserts and removes blank pages, and adds publishing marks', async ({ page }) => {
  const source = await PDFDocument.create(), font = await source.embedFont(StandardFonts.Helvetica);
  source.addPage([300, 500]).drawText('First', { x:30, y:450, font, size:20 });
  source.addPage([300, 500]);
  source.addPage([300, 500]).drawText('Last', { x:30, y:450, font, size:20 });
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'organize.pdf', mimeType:'application/pdf', buffer:Buffer.from(await source.save()) });
  await page.getByRole('button', { name:'Reverse page order' }).click();
  await expect(page.locator('#status')).toContainText('Page order reversed');
  await page.getByRole('button', { name:'Insert blank page' }).click();
  await expect(page.locator('.thumbnail')).toHaveCount(4);
  await page.getByRole('button', { name:'Remove blank pages' }).click();
  await expect(page.locator('.thumbnail')).toHaveCount(2);
  await page.locator('.thumbnail').first().click();
  await page.locator('.thumbnail').last().click({ modifiers:['Shift'] });
  await page.getByRole('button', { name:'Headers, footers & numbers' }).click();
  await page.locator('#headerText').fill('Class packet');
  await page.getByRole('button', { name:'Apply', exact:true }).click();
  await page.getByRole('button', { name:'Add signature' }).click();
  await page.locator('#signatureText').fill('Teacher Name');
  await page.getByRole('button', { name:'Add typed signature' }).click();
  await expect(page.locator('.text-object').filter({ hasText:'Teacher Name' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name:'Export', exact:true }).click();
  const exported = await PDFDocument.load(await require('fs/promises').readFile(await (await downloadPromise).path()));
  expect(exported.getPageCount()).toBe(2);
});

test('crops pages and applies fine deskew rotation', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'crop.pdf', mimeType:'application/pdf', buffer:Buffer.from(await makePdf('Crop me', [400, 600])) });
  await page.getByRole('button', { name:'Crop pages' }).click();
  for (const id of ['cropTop','cropRight','cropBottom','cropLeft']) await page.locator(`#${id}`).fill('10');
  await page.getByRole('button', { name:'Apply crop' }).click();
  await page.getByRole('button', { name:'Deskew / custom rotation' }).click();
  await page.locator('#customRotation').fill('2');
  await page.getByRole('button', { name:'Apply rotation' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name:'Export', exact:true }).click();
  const exported = await PDFDocument.load(await require('fs/promises').readFile(await (await downloadPromise).path()));
  const size = exported.getPage(0).getSize();
  expect(size.width).toBeGreaterThan(320);
  expect(size.width).toBeLessThan(340);
  expect(size.height).toBeGreaterThan(480);
  expect(size.height).toBeLessThan(495);
});

test('imports image pages, exports PNG, and creates a rasterized sanitized copy', async ({ page }) => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  const source = await PDFDocument.create(); source.setTitle('Sensitive metadata'); source.addPage([300, 500]);
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'safe.pdf', mimeType:'application/pdf', buffer:Buffer.from(await source.save()) });
  await page.locator('#imagePagesInput').setInputFiles({ name:'photo.png', mimeType:'image/png', buffer:png });
  await expect(page.locator('.thumbnail')).toHaveCount(2);
  await page.locator('.thumbnail').first().click();
  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name:'Export pages as images' }).click();
  expect((await pngDownload).suggestedFilename()).toBe('safe-page-1.png');
  const sanitizeDownload = page.waitForEvent('download');
  await page.getByRole('button', { name:'Sanitize PDF copy' }).click();
  await page.getByRole('button', { name:'Sanitize and download' }).click();
  const sanitizedFile = await sanitizeDownload;
  expect(sanitizedFile.suggestedFilename()).toBe('safe-sanitized.pdf');
  const sanitized = await PDFDocument.load(await require('fs/promises').readFile(await sanitizedFile.path()));
  expect(sanitized.getTitle() || '').not.toContain('Sensitive');
  expect(sanitized.getPageCount()).toBe(2);
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
  await expect(page.getByRole('heading', { name:'2 selected pages' })).toBeVisible();
  await page.getByRole('menuitem', { name:'Move to page…' }).click();
  await expect(page.getByRole('heading', { name:'Move selected pages' })).toBeVisible();
  await page.locator('#movePagePosition').fill('2');
  await page.getByRole('button', { name:'Move pages' }).click();
  await expect(page.locator('#status')).toContainText('positions 2–3');
  await expect(page.locator('.thumbnail.selected')).toHaveCount(2);

  await page.locator('.thumbnail').last().scrollIntoViewIfNeeded();
  await page.locator('.thumbnail.selected').last().dragTo(page.locator('.thumbnail').last());
  await expect(page.locator('#status')).toContainText('positions 3–4');
  await expect(page.locator('.thumbnail.selected')).toHaveCount(2);

  await page.getByRole('button', { name:'Rotate right' }).click();
  await page.locator('.thumbnail.selected').first().click({ button:'right' });
  await page.getByRole('menuitem', { name:'Duplicate' }).click();
  await expect(page.locator('.thumbnail')).toHaveCount(6);
  await expect(page.locator('.thumbnail.selected')).toHaveCount(2);
  await page.locator('.thumbnail.selected').first().click({ button:'right' });
  await page.getByRole('menuitem', { name:'Delete' }).click();
  await expect(page.locator('.thumbnail')).toHaveCount(4);

  await page.locator('.thumbnail').nth(0).click();
  await page.locator('.thumbnail').nth(2).click({ modifiers:['Shift'] });
  await expect(page.locator('.thumbnail.selected')).toHaveCount(3);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.thumbnail.selected').first().click({ button:'right' });
  await page.getByRole('menuitem', { name:'Extract' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('packet-selected-pages.pdf');
  expect((await PDFDocument.load(await require('fs/promises').readFile(await download.path()))).getPageCount()).toBe(3);

  await page.locator('.thumbnail.selected').first().click({ button:'right' });
  await page.getByRole('menuitem', { name:'Separate / Split' }).click();
  await expect(page.getByRole('heading', { name:'Separate PDF' })).toBeVisible();
  await expect(page.locator('#splitRanges')).toHaveValue('1-3');
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

test('converts the edited PDF to a reflowable EPUB 3 locally', async ({ page }) => {
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  source.addPage([400, 600]).drawText('Chapter One', { x:40, y:540, font, size:26 });
  source.getPage(0).drawText('A readable first paragraph.', { x:40, y:500, font, size:14 });
  source.addPage([400, 600]).drawText('Chapter Two', { x:40, y:540, font, size:26 });
  source.getPage(1).drawText('A readable second paragraph.', { x:40, y:500, font, size:14 });

  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'reader.pdf', mimeType:'application/pdf', buffer:Buffer.from(await source.save()) });
  await page.getByRole('button', { name:'Convert to EPUB' }).click();
  await expect(page.getByRole('heading', { name:'Convert PDF to EPUB' })).toBeVisible();
  await page.locator('#epubTitle').fill('Reader Edition');
  await page.locator('#epubAuthor').fill('Test Author');
  await page.locator('#epubPublisher').fill('PDFSplat Press');
  await page.locator('#epubDescription').fill('A test publication.');
  await page.locator('#epubRights').fill('© 2026 Test Author');
  await page.locator('#epubLanguage').fill('en-US');
  await page.locator('#epubCover').setInputFiles({ name:'cover.png', mimeType:'image/png', buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
  await page.locator('#epubCoverAlt').fill('A simple test cover');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name:'Convert and download' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Reader Edition.epub');
  const bytes = await require('fs/promises').readFile(await download.path());
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
  const epub = await JSZip.loadAsync(bytes);
  expect(await epub.file('mimetype').async('string')).toBe('application/epub+zip');
  const packageXml = await epub.file('EPUB/package.opf').async('string');
  expect(packageXml).toContain('<dc:title>Reader Edition</dc:title>');
  expect(packageXml).toContain('<dc:creator>Test Author</dc:creator>');
  expect(packageXml).toContain('<dc:language>en-US</dc:language>');
  expect(packageXml).toContain('<dc:publisher>PDFSplat Press</dc:publisher>');
  expect(packageXml).toContain('schema:accessMode');
  expect(packageXml).toContain('properties="cover-image"');
  expect(await epub.file('EPUB/nav.xhtml').async('string')).toContain('chapter-2.xhtml');
  expect(await epub.file('EPUB/nav.xhtml').async('string')).toContain('epub:type="page-list"');
  const firstChapter = await epub.file('EPUB/chapter-1.xhtml').async('string');
  expect(firstChapter).toContain('A readable first paragraph.');
  expect(firstChapter).toContain('epub:type="pagebreak"');
  expect(await epub.file('EPUB/cover.xhtml').async('string')).toContain('A simple test cover');
  await expect(page.locator('#status')).toContainText('Reader Edition.epub downloaded');
  await expect(page.locator('#epubPreflight')).toContainText('EPUB 3 package');
});

test('protects an edited PDF with CipherSplat and unlocks it back into the editor', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name:'private.pdf', mimeType:'application/pdf', buffer:Buffer.from(await makePdf('Private')) });
  await expect(page.locator('#status')).toContainText('1 pages');
  await page.getByRole('button', { name:'Protect / Unprotect' }).click();
  await expect(page.locator('#vaultIntro')).toContainText('AES-256-GCM');
  await page.getByRole('button', { name:'Protect this PDF' }).click();
  const generatorLink = page.getByRole('link', { name:'Generate a secure password with CipherSplat' });
  await expect(generatorLink).toHaveAttribute('target', '_blank');
  await expect(generatorLink).toHaveAttribute('rel', /noopener/);
  const generatorTabPromise = page.waitForEvent('popup');
  await generatorLink.click();
  const generatorTab = await generatorTabPromise;
  await expect(generatorTab.getByRole('heading', { name:'Create a vault password' })).toBeVisible();
  await generatorTab.close();
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
