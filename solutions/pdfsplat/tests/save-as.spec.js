const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts } = require('../vendor/pdf-lib.min.js');
const JSZip = require('../../../vendor/jszip.min.js');
const fs = require('fs/promises');

async function openDocument(page, blank = false) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const first = pdf.addPage([400, 600]);
  if (!blank) first.drawText('Original text & <example>', { x: 40, y: 500, size: 16, font });
  await page.goto('/solutions/pdfsplat/');
  await expect(page.getByRole('combobox', { name: 'Save as', exact: true })).toBeDisabled();
  await page.locator('#fileInput').setInputFiles({ name: 'formats.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.locator('#saveAsSelect')).toBeEnabled();
}

for (const format of ['markdown', 'docx', 'odt', 'json']) {
  test(`Save as ${format} includes edited text in a valid file`, async ({ page }, testInfo) => {
    await openDocument(page);
    await page.locator('#addTextButton').click();
    await page.locator('#textValue').fill('Added text & <safe>');
    await page.locator('#saveAsSelect').selectOption(format);
    await expect(page.locator('#textSaveDialog')).toBeVisible();
    await page.locator('#textSaveTitle').fill('Example & title');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#textSaveRun').click();
    const download = await downloadPromise;
    const bytes = await fs.readFile(await download.path());
    const extension = format === 'markdown' ? 'md' : format;
    expect(download.suggestedFilename()).toBe(`Example & title.${extension}`);
    await expect(page.locator('#textSaveDialog')).toBeHidden();
    await expect(page.locator('#status')).toContainText('downloaded');
    if (testInfo.project.name === 'chromium') {
      await fs.mkdir('/tmp/pdfsplat-formats', { recursive: true });
      await fs.writeFile(`/tmp/pdfsplat-formats/example.${extension}`, bytes);
    }
    if (format === 'json') {
      const doc = JSON.parse(bytes.toString());
      expect(doc.schemaVersion).toBe(1);
      expect(doc.pageCount).toBe(1);
      expect(doc.pages[0].text).toContain('Original text & <example>');
      expect(doc.pages[0].text).toContain('Added text & <safe>');
    } else if (format === 'markdown') {
      expect(bytes.toString()).toContain('Added text &amp; &lt;safe\\>');
      expect(bytes.toString()).toContain('## Page 1');
    } else {
      const zip = await JSZip.loadAsync(bytes);
      const xmlFiles = Object.values(zip.files).filter(file => /\.(xml|rels)$/.test(file.name));
      const contents = await Promise.all(xmlFiles.map(file => file.async('string')));
      expect(await page.evaluate(contents => contents.every(xml => !new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror')), contents)).toBe(true);
      const content = await zip.file(format === 'docx' ? 'word/document.xml' : 'content.xml').async('string');
      expect(content).toContain('Added text &amp; &lt;safe&gt;');
      expect(content).toContain('Original text &amp; &lt;example&gt;');
      if (format === 'odt') {
        expect(await zip.file('mimetype').async('string')).toBe('application/vnd.oasis.opendocument.text');
        expect(bytes.readUInt16LE(8)).toBe(0); // First ZIP entry is stored, not compressed.
        expect(bytes.subarray(30, 38).toString()).toBe('mimetype');
      }
    }
  });
}

test('text conversion respects replacements, masks, crops and current page order', async ({ page }) => {
  await openDocument(page);
  const result = await page.evaluate(async () => {
    const { collectTextDocument } = await import('/solutions/pdfsplat/src/document-export.js?v=20260914-save-as');
    const pdf = await PDFLib.PDFDocument.create();
    const first = pdf.addPage([400, 600]);
    first.drawText('Covered original', { x: 40, y: 500, size: 16 });
    first.drawText('Visible line', { x: 40, y: 300, size: 16 });
    const second = pdf.addPage([400, 600]);
    second.drawText('Second page first', { x: 40, y: 400, size: 16 });
    const source = await pdfjsLib.getDocument({ data: await pdf.save() }).promise;
    const doc = await collectTextDocument({ title: 'Test', language: 'en', sourceName: 'test.pdf', sources: new Map([['s', { pdf: source }]]), pages: [
      { sourceId: 's', sourceIndex: 1, annotations: [] },
      { sourceId: 's', sourceIndex: 0, annotations: [{ type: 'text', cover: true, text: 'Replacement', x: .1, y: .14, w: .6, h: .05, fontSize: 16 }] },
      { sourceId: 's', sourceIndex: 0, crop: { top: .3, left: 0, right: 0, bottom: 0 }, annotations: [] },
      { sourceId: 's', sourceIndex: 0, annotations: [{ type: 'mask', x: 0, y: 0, w: 1, h: 1 }] },
    ] });
    await source.destroy();
    return doc;
  });
  expect(result.pages[0].text).toContain('Second page first');
  expect(result.pages[1].text).toContain('Replacement');
  expect(result.pages[1].text).not.toContain('Covered original');
  expect(result.pages[2].text).toBe('Visible line');
  expect(result.pages[3].text).toBe('');
});

test('blank scans report missing text without inventing OCR output', async ({ page }) => {
  await openDocument(page, true);
  await page.locator('#saveAsSelect').selectOption('json');
  await page.locator('#textSaveRun').click();
  await expect(page.locator('#textSaveDialog')).toBeHidden();
  await expect(page.locator('#status')).toContainText('1 of 1 pages have no selectable text');
  await expect(page.locator('#saveAsSelect')).toHaveValue('');
});

test('Save as offers all six formats on a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDocument(page);
  await expect(page.locator('#saveAsSelect option')).toHaveText(['Save as…', 'PDF (.pdf)', 'Markdown (.md)', 'Word — DOCX (.docx)', 'OpenDocument — ODF (.odt)', 'EPUB (.epub)', 'JSON (.json)']);
  const box = await page.locator('#saveAsSelect').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.locator('#saveAsSelect').selectOption('odt');
  await expect(page.locator('#textSaveDialog')).toBeVisible();
  await page.locator('#textSaveClose').click();
  await expect(page.locator('#saveAsSelect')).toHaveValue('');
});
