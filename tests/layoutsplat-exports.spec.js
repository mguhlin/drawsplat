const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

async function ready(page) {
  await page.goto('/splatworks/layoutsplat/');
  await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true);
  page.on('dialog', dialog => dialog.accept());
}
async function fixture(page) {
  const doc = await page.evaluate(async () => {
    const { newPublication, uid, shape, frame, textStyle } = await import('/splatworks/layoutsplat/engine.mjs');
    const doc = newPublication(true); doc.title = 'Export <proof> & "colors" العربية'; doc.width = 360; doc.height = 216;
    doc.pages = ['#ff0000', '#00ff00', '#0000ff', '#ff9900'].map((color, index) => {
      const story = uid(), box = frame(story, 12, 12, 320, 50);
      doc.stories[story] = { text: `Page ${index + 1} — Export proof`, style: { ...textStyle(), color: '#ffffff', weight: 'bold' }, frames: [box.id] };
      return { id: uid(), objects: [shape(0, 0, 360, 216, color), box] };
    });
    return doc;
  });
  await page.locator('#projectInput').setInputFiles({ name: 'proof.layoutsplat.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await expect.poll(() => page.evaluate(() => LayoutSplat.getPublication().title)).toBe(doc.title);
  return doc;
}
async function open(page, kind) {
  await page.locator('#fileMenu > summary').click();
  if (!await page.locator('#fileExport').evaluate(e => e.open)) await page.locator('#fileExport > summary').click();
  await page.locator(`[data-action="export-${kind}"]`).click();
  await expect(page.locator('#exportFormat')).toHaveValue(kind);
}

for (const kind of ['pptx', 'odp']) test(`${kind} downloads selected physical pages as a valid presentation package`, async ({ page }, info) => {
  await ready(page); const before = await fixture(page); await open(page, kind);
  await expect(page.locator('#exportFormatHint')).toContainText('not separately editable');
  await expect(page.locator('#exportGifOptions')).toBeHidden();
  await page.locator('#exportPages').fill('1, 3-4'); await page.locator('#exportPpi').selectOption('150');
  const waiting = page.waitForEvent('download'); await page.locator('#exportDownload').click(); const download = await waiting;
  expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${kind}$`));
  await download.saveAs(info.outputPath(`page-sequence.${kind}`)); const bytes = await fs.readFile(await download.path());
  const result = await page.evaluate(async ({ bytes, kind }) => {
    const zip = await JSZip.loadAsync(Uint8Array.from(atob(bytes), c => c.charCodeAt(0))), errors = [];
    for (const [name, entry] of Object.entries(zip.files)) if (/\.(xml|rels)$/.test(name)) {
      if (new DOMParser().parseFromString(await entry.async('string'), 'application/xml').querySelector('parsererror')) errors.push(name);
    }
    const images = Object.keys(zip.files).filter(name => /(?:media|Pictures)\/page\d+\.png$/.test(name));
    const colors = [];
    for (const name of images) {
      const bitmap = await createImageBitmap(await zip.file(name).async('blob')), canvas = document.createElement('canvas');
      canvas.width = bitmap.width; canvas.height = bitmap.height; canvas.getContext('2d').drawImage(bitmap, 0, 0); bitmap.close();
      colors.push({ size: [canvas.width, canvas.height], rgb: [...canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data].slice(0, 3) });
    }
    const xml = await zip.file(kind === 'pptx' ? 'ppt/presentation.xml' : 'styles.xml').async('string');
    return { errors, images, colors, xml, content: kind === 'odp' ? await zip.file('content.xml').async('string') : await zip.file('ppt/slides/slide1.xml').async('string'), type: kind === 'odp' ? await zip.file('mimetype').async('string') : '' };
  }, { bytes: bytes.toString('base64'), kind });
  expect(result.errors).toEqual([]); expect(result.images).toHaveLength(3);
  expect(result.colors.map(c => c.rgb)).toEqual([[255, 0, 0], [0, 0, 255], [255, 153, 0]]);
  expect(result.colors.every(c => c.size[0] === 750 && c.size[1] === 450)).toBe(true);
  expect(result.content).toContain('&lt;proof&gt; &amp; &quot;colors&quot;');
  if (kind === 'pptx') { expect(result.xml).toContain('cx="4572000" cy="2743200"'); expect(result.xml.match(/<p:sldId /g)).toHaveLength(3); }
  else {
    expect(result.xml).toContain('fo:page-width="360pt" fo:page-height="216pt"'); expect(result.content.match(/<draw:page /g)).toHaveLength(3);
    expect(result.type).toBe('application/vnd.oasis.opendocument.presentation');
    expect(bytes.readUInt16LE(8)).toBe(0); expect(bytes.subarray(30, 38).toString()).toBe('mimetype'); expect(bytes.readUInt16LE(28)).toBe(0);
  }
  expect(await page.evaluate(() => LayoutSplat.getPublication())).toEqual(before);
});

test('animated GIF exports distinct selected pages with chosen dimensions and timing', async ({ page }, info) => {
  await ready(page); const before = await fixture(page); await open(page, 'gif');
  await expect(page.locator('#exportGifOptions')).toBeVisible(); await expect(page.locator('#exportPpi')).toBeDisabled(); await expect(page.locator('#exportBleed')).toBeDisabled();
  await page.locator('#exportPages').fill('1,3-4'); await page.locator('#exportGifSeconds').fill('0.7'); await page.locator('#exportGifSize').selectOption('480');
  const download = page.waitForEvent('download'); await page.locator('#exportDownload').click(); const output = await download;
  await output.saveAs(info.outputPath('page-sequence.gif')); const bytes = await fs.readFile(await output.path());
  expect(output.suggestedFilename()).toMatch(/\.gif$/); expect(bytes.subarray(0, 6).toString()).toBe('GIF89a');
  expect(bytes.readUInt16LE(6)).toBe(480); expect(bytes.readUInt16LE(8)).toBe(288); expect(bytes.includes(Buffer.from('NETSCAPE2.0'))).toBe(true);
  const checks = await page.evaluate(async () => {
    const { exportPublication } = await import('/splatworks/layoutsplat/exports.mjs'), doc = LayoutSplat.getPublication(), errors = [];
    for (const options of [{ pages: [] }, { pages: [5] }, { gifDelayMs: 0 }, { gifDelayMs: 61000 }, { gifMaxSize: 1700 }, { pages: Array(40).fill(0), gifMaxSize: 1440 }]) {
      try { await exportPublication('gif', doc, {}, options); errors.push('unexpected success'); } catch (e) { errors.push(e.message); }
    }
    return errors;
  });
  expect(checks[0]).toContain('valid publication page'); expect(checks[1]).toContain('valid publication page');
  expect(checks[2]).toContain('duration'); expect(checks[3]).toContain('duration'); expect(checks[4]).toContain('dimension'); expect(checks[5]).toContain('24 million');
  expect(await page.evaluate(() => LayoutSplat.getPublication())).toEqual(before);
});

test('export failures recover controls and edited inputs invalidate prepared sharing', async ({ page }) => {
  await ready(page); await fixture(page); await open(page, 'gif');
  await page.locator('#exportGifSeconds').fill('0'); await page.locator('#exportDownload').click();
  await expect(page.locator('#exportSummary')).toContainText('duration'); await expect(page.locator('#exportDownload')).toBeEnabled(); await expect(page.locator('#exportFormat')).toBeEnabled();
  await page.locator('#exportFormat').selectOption('json');
  await page.evaluate(() => {
    window.sharedExports = [];
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async ({ files }) => window.sharedExports.push(files[0].name) });
  });
  await page.locator('#exportShare').click(); await expect(page.locator('#exportSummary')).toContainText('ready');
  // Input events can precede change/blur. Share must regenerate rather than send the old JSON.
  await page.evaluate(() => { const el = document.getElementById('exportPages'); el.value = '99'; el.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('exportShare').click(); });
  await expect(page.locator('#exportSummary')).toContainText('outside'); expect(await page.evaluate(() => sharedExports)).toEqual([]);
  await page.locator('#exportPages').fill('1'); await page.locator('#exportFormat').selectOption('gif'); await page.locator('#exportGifSeconds').fill('0.3'); await page.locator('#exportGifSize').selectOption('480');
  await page.locator('#exportShare').click(); await expect(page.locator('#exportSummary')).toContainText('ready');
  await page.locator('#exportShare').click(); await expect.poll(() => page.evaluate(() => sharedExports)).toEqual([expect.stringMatching(/\.gif$/)]);
});

test('a missing GIF worker produces an error without leaving export busy', async ({ page }) => {
  await ready(page); await fixture(page); await open(page, 'gif'); await page.locator('#exportPages').fill('1');
  await page.route('**/gif-export-worker.js', route => route.abort()); await page.locator('#exportDownload').click();
  await expect(page.locator('#exportSummary')).toContainText('encoder'); await expect(page.locator('#exportDownload')).toBeEnabled();
});
