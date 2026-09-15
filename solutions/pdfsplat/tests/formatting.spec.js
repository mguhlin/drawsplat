const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts, rgb, PDFName, PDFString } = require('../vendor/pdf-lib.min.js');
const JSZip = require('../../../vendor/jszip.min.js');
const fs = require('fs/promises');

async function fixture() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const page = doc.addPage([500, 700]);
  const draw = (text, x, y, size = 12, font = regular) => page.drawText(text, { x, y, size, font });
  draw('Formatting sample', 40, 650, 24, bold);
  draw('A useful section', 40, 612, 18, bold);
  draw('This paragraph begins here and continues onto', 40, 578);
  draw('a second line with the same style and alignment.', 40, 562);
  draw('This is a separate paragraph after a larger gap.', 40, 526);
  let x = 40;
  for (const [text, font] of [['Normal ', regular], ['bold', bold], [' and ', regular], ['italic', italic], [' text.', regular]]) {
    draw(text, x, 494, 12, font); x += font.widthOfTextAtSize(text, 12);
  }
  draw('• First bullet', 40, 456); draw('• Second bullet', 40, 436);
  draw('1. Numbered entry', 40, 402); draw('2. Another entry', 40, 382);
  draw('Visit example', 40, 340);
  const link = doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [40, 337, 130, 354], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: PDFString.of('https://example.com/?a=1&b=2') } }));
  page.node.set(PDFName.of('Annots'), doc.context.obj([link]));
  page.drawRectangle({ x: 40, y: 240, width: 180, height: 60, color: rgb(.1, .4, .8) });
  const second = doc.addPage([500, 700]);
  second.drawText('Second page', { x: 40, y: 650, font: bold, size: 24 });
  second.drawRectangle({ x: 80, y: 280, width: 280, height: 120, color: rgb(.8, .2, .1) });
  return Buffer.from(await doc.save());
}
async function openFixture(page) {
  await page.goto('/solutions/pdfsplat/');
  await page.locator('#fileInput').setInputFiles({ name: 'formatting.pdf', mimeType: 'application/pdf', buffer: await fixture() });
  await expect(page.locator('#saveAsSelect')).toBeEnabled();
}
async function download(page, format, appearance = false) {
  await page.locator('#saveAsSelect').selectOption(format);
  if (appearance) await page.locator(format === 'epub' ? '#epubLayout' : '#textSaveLayout').selectOption('appearance');
  const promise = page.waitForEvent('download');
  await page.locator(format === 'epub' ? '#epubRun' : '#textSaveRun').click();
  const result = await promise;
  await expect(page.locator(format === 'epub' ? '#epubDialog' : '#textSaveDialog')).toBeHidden();
  return fs.readFile(await result.path());
}
async function validateXml(page, zip) {
  const files = Object.values(zip.files).filter(file => /\.(xml|rels|xhtml|opf|ncx)$/.test(file.name));
  const contents = await Promise.all(files.map(file => file.async('string')));
  expect(await page.evaluate(contents => contents.every(xml => !new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror')), contents)).toBe(true);
}

for (const format of ['markdown', 'docx', 'odt', 'epub', 'json']) {
  test(`${format} preserves headings, emphasis, paragraphs, lists, and links`, async ({ page }, testInfo) => {
    await openFixture(page);
    const bytes = await download(page, format);
    if (testInfo.project.name === 'chromium') {
      await fs.mkdir('/tmp/pdfsplat-rich', { recursive: true });
      await fs.writeFile(`/tmp/pdfsplat-rich/formatted.${format === 'markdown' ? 'md' : format}`, bytes);
    }
    if (format === 'markdown') {
      const md = bytes.toString();
      expect(md).toContain('### **Formatting sample**');
      expect(md).toContain('#### **A useful section**');
      expect(md).toContain('**bold**'); expect(md).toContain('*italic*');
      expect(md).toContain('continues onto a second line');
      expect(md).toContain('- First bullet'); expect(md).toContain('1. Numbered entry');
      expect(md).toContain('[Visit example](<https://example.com/?a=1&b=2>)');
    } else if (format === 'json') {
      const data = JSON.parse(bytes.toString()), blocks = data.pages[0].blocks;
      expect(data.pages[0].text).toContain('Formatting sample');
      expect(blocks[0]).toMatchObject({ type: 'heading', level: 1 });
      expect(blocks[1]).toMatchObject({ type: 'heading', level: 2 });
      expect(blocks[2].text).toContain('continues onto a second line');
      expect(blocks.flatMap(block => block.spans).some(span => span.text === 'bold' && span.bold)).toBe(true);
      expect(blocks.flatMap(block => block.spans).some(span => span.text === 'italic' && span.italic)).toBe(true);
    } else {
      const zip = await JSZip.loadAsync(bytes); await validateXml(page, zip);
      if (format === 'docx') {
        const text = await zip.file('word/document.xml').async('string');
        expect(text).toContain('<w:pStyle w:val="Heading1"/>');
        expect(text).toContain('<w:pStyle w:val="Heading2"/>');
        expect(text).toContain('<w:b/>'); expect(text).toContain('<w:i/>');
        expect(text).toContain('<w:numPr>'); expect(text).toContain('<w:hyperlink');
        expect(await zip.file('word/_rels/document.xml.rels').async('string')).toContain('https://example.com/?a=1&amp;b=2');
      } else if (format === 'odt') {
        const text = await zip.file('content.xml').async('string');
        expect(text).toContain('text:outline-level="1"'); expect(text).toContain('text:outline-level="2"');
        expect(text).toContain('fo:font-weight="bold"'); expect(text).toContain('fo:font-style="italic"');
        expect(text).toContain('<text:list '); expect(text).toContain('<text:a ');
      } else {
        const html = await zip.file('EPUB/chapter-1.xhtml').async('string');
        expect(html).toContain('<h1'); expect(html).toContain('<h2');
        expect(html).toContain('<strong>bold</strong>'); expect(html).toContain('<em>italic</em>');
        expect(html).toContain('<ul>'); expect(html).toContain('<ol start="1">');
        expect(html).toContain('href="https://example.com/?a=1&amp;b=2"');
      }
    }
  });
}

for (const format of ['docx', 'odt', 'epub']) {
  test(`${format} page appearance embeds the edited visual pages`, async ({ page }, testInfo) => {
    await openFixture(page);
    await page.locator('#addTextButton').click();
    await page.locator('#textValue').fill('Visible edit');
    const bytes = await download(page, format, true);
    const zip = await JSZip.loadAsync(bytes); await validateXml(page, zip);
    const images = Object.values(zip.files).filter(file => /page-\d+\.png$/.test(file.name));
    expect(images).toHaveLength(2);
    for (const image of images) {
      const imageBytes = await image.async('uint8array');
      expect(Buffer.from(imageBytes).subarray(1, 4).toString()).toBe('PNG');
      expect(imageBytes.length).toBeGreaterThan(2000);
    }
    if (testInfo.project.name === 'chromium') {
      await fs.mkdir('/tmp/pdfsplat-rich', { recursive: true });
      await fs.writeFile(`/tmp/pdfsplat-rich/appearance.${format}`, bytes);
      await fs.writeFile('/tmp/pdfsplat-rich/appearance-page.png', await images[0].async('nodebuffer'));
    }
    if (format === 'epub') {
      expect(await zip.file('EPUB/package.opf').async('string')).toContain('media-type="image/png"');
      expect(await zip.file('EPUB/chapter-1.xhtml').async('string')).toContain('class="page-image"');
    }
  });
}

test('unsafe links remain text and wrapped words retain emphasis', async ({ page }) => {
  await page.goto('/solutions/pdfsplat/');
  const result = await page.evaluate(async () => {
    const { blocksHtml, structureLines, formattedLines } = await import('/solutions/pdfsplat/src/rich-text.js?v=20260914-formatting');
    const items = [{ str: 'Safe text', transform: [12, 0, 0, 12, 40, 400], width: 70, link: 'javascript:alert(1)', bold: true }];
    return blocksHtml(structureLines(formattedLines(items)));
  });
  expect(result).not.toContain('javascript:');
  expect(result).toContain('<strong>Safe text</strong>');
});
