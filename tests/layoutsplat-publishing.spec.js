const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const fixture = name => path.join(__dirname, 'fixtures/layoutsplat', name);
async function ready(page) { await page.goto('/splatworks/layoutsplat/'); await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true); page.on('dialog', d => d.type() === 'prompt' ? d.accept('Brand master') : d.accept()); }
const snapshot = page => page.evaluate(() => LayoutSplat.getPublication());
async function blank(page) { await page.locator('#fileMenu summary').click(); await page.locator('[data-action=blank]').click(); await expect.poll(async () => Object.keys((await snapshot(page)).stories).length).toBe(0); }
async function closeReport(page) { if (await page.locator('#importReportDialog').isVisible()) await page.locator('#importReportDialog button').click(); }
async function output(page, format, pages = '1') { await page.locator('[data-action=exports]').click(); await page.locator('#exportFormat').selectOption(format); await page.locator('#exportPages').fill(pages); const download = page.waitForEvent('download', { timeout: 120000 }); await page.locator('#exportDownload').click(); return await download; }
test('editable templates, main bold italic underline, columns, and rich ranges survive JSON reopen', async ({ page }) => {
  await ready(page); await page.locator('#fileMenu summary').click(); await page.locator('[data-action=templates]').click(); await expect(page.locator('[data-template]')).toHaveCount(7); await page.locator('[data-template=flyer]').click();
  const before = await snapshot(page), object = before.pages[0].objects.find(o => o.type === 'text'); await page.locator(`#pageSurface [data-object-id="${object.id}"]`).click();
  for (const key of ['bold', 'italic', 'underline']) await page.locator(`[data-action=text-${key}]`).click();
  await page.locator('#propColumns').fill('2'); await page.locator('#propColumns').press('Tab');
  await page.locator('#propDropCap').fill('2'); await page.locator('#propDropCap').press('Tab');
  const doc = await snapshot(page), style = doc.stories[object.storyId].style; expect(style.italic).toBe(true); expect(style.underline).toBe(true); expect(doc.pages[0].objects.find(o => o.id === object.id).columns).toBe(2);
  const download = await output(page, 'json', ''); expect(download.suggestedFilename()).toMatch(/\.layoutsplat.json$/); const bytes = await fs.readFile(await download.path()); expect(JSON.parse(bytes)).toEqual(doc);
  await page.locator('#exportDialog [value=cancel]').last().click(); await blank(page); await page.locator('#projectInput').setInputFiles({ name: 'saved.layoutsplat.json', mimeType: 'application/json', buffer: bytes }); await expect.poll(async () => JSON.stringify(await snapshot(page))).toBe(JSON.stringify(doc));
});
test('master updates and overrides, grouped numeric placement, and editable table insertion work', async ({ page }) => {
  await ready(page); await blank(page); await page.locator('#shapesMenu summary').click(); await page.locator('[data-action=rect]').click(); await page.locator('[data-action=masters]').click(); await page.locator('[data-action=createMaster]').click(); await page.locator('[data-action=editMaster]').click(); await expect(page.locator('#masterModeNotice')).toBeVisible();
  await page.locator('#pageSurface .object.shape').click(); await page.locator('#propFill').fill('#009944'); await page.locator('#propFill').dispatchEvent('change'); await page.locator('[data-action=masters]').click(); await page.locator('[data-action=editMaster]').click(); await expect(page.locator('#masterModeNotice')).toBeHidden();
  await page.locator('[data-action=masters]').click(); const doc = await snapshot(page); await page.locator('#masterObjectOverride').selectOption(doc.masters[0].objects[0].id); await page.locator('[data-action=hideMasterObject]').click(); await page.locator('#mastersDialog [value=cancel]').last().click(); await expect(page.locator('#pageSurface .master-object')).toHaveCount(0);
  await page.locator('#shapesMenu summary').click(); await page.locator('[data-action=rect]').click(); await page.locator('#shapesMenu summary').click(); await page.locator('[data-action=ellipse]').click(); await page.locator('#arrangePanel summary').click(); await page.locator('[data-action=selectAll]').click(); await page.locator('[data-action=group]').click(); const grouped = await snapshot(page); expect(grouped.pages[0].objects.every(o => o.groupIds?.length === 1)).toBe(true);
  await page.locator('#unitSelect').selectOption('pt'); await page.locator('#propX').fill('80'); await page.locator('#propX').press('Tab'); expect(Math.min(...(await snapshot(page)).pages[0].objects.map(o => o.x))).toBe(80);
  await page.locator('.more-tools:not(#shapesMenu) summary').click(); await page.locator('.more-tools [data-action=table]').click(); await page.locator('#tableCells').fill('Name\tScore\nAda\t98'); await page.locator('#applyTable').click(); await expect(page.locator('#pageSurface table')).toContainText('Ada'); expect((await snapshot(page)).pages[0].objects.at(-1).cells[1]).toEqual(['Ada', '98']);
});
test('CSV mapping generates separate personalized business cards without saving recipient source data', async ({ page }) => {
  await ready(page); await page.locator('#fileMenu summary').click(); await page.locator('[data-action=templates]').click(); await page.locator('[data-template=business-card]').click(); await page.locator('[data-action=merge]').click();
  await page.locator('#mergeFile').setInputFiles({ name: 'recipients.csv', mimeType: 'text/csv', buffer: Buffer.from('Name,Role,Email,Phone\n"Ada, A.",Teacher,ada@example.test,0012\nGrace,Principal,grace@example.test,0034') }); await expect(page.locator('#mergeSummary')).toContainText('2 records'); await page.locator('#mergePreviewBtn').click(); await expect(page.locator('#mergePreview')).toContainText('Ada, A.');
  await page.locator('#mergeGenerate').click(); const doc = await snapshot(page); expect(doc.pages).toHaveLength(4); const text = Object.values(doc.stories).map(s => s.text).join('\n'); expect(text).toContain('Ada, A.'); expect(text).toContain('Grace'); expect(text).toContain('0012'); expect(text).not.toContain('{{Name}}'); expect(doc.records).toBeUndefined();
});
test('browser images, TIFF, PSD, and HEIC become printable local pictures', async ({ page }) => {
  test.setTimeout(180000); await ready(page); await blank(page); const errors = []; page.on('pageerror', e => errors.push(e.message));
  for (const name of ['sample.png', 'sample.jpg', 'sample.webp', 'sample.bmp', 'sample.gif', 'sample.tiff', 'sample.psd', 'sample.heic']) {
    const count = Object.keys((await snapshot(page)).assets).length; await page.locator('#pictureInput').setInputFiles(fixture(name)); await expect.poll(async () => Object.keys((await snapshot(page)).assets).length, { timeout: 90000, message: name }).toBe(count + 1); await closeReport(page); const asset = Object.values((await snapshot(page)).assets).at(-1); expect(asset.width).toBe(160); expect(asset.height).toBe(100); expect(asset.src).toMatch(/^data:image\/png;base64,/);
  }
  expect(errors).toEqual([]); await expect(page.locator('#pageSurface .object-image')).toHaveCount(8);
});
test('native MP4 and converted AVI retain playable media, posters, and JSON round-trip fidelity', async ({ page, context }) => {
  test.setTimeout(180000); await ready(page); await blank(page);
  for (const name of ['sample.mp4', 'sample.avi']) { const count = Object.keys((await snapshot(page)).assets).length; await page.locator('#videoInput').setInputFiles(fixture(name)); await expect.poll(async () => Object.keys((await snapshot(page)).assets).length, { timeout: 90000, message: name }).toBe(count + 1); await closeReport(page); }
  const doc = await snapshot(page); expect(Object.values(doc.assets).every(a => a.media.kind === 'video' && a.media.src.startsWith('data:video/mp4;base64,') && a.src.startsWith('data:image/png;base64,'))).toBe(true);
  await page.locator('#previewMediaButton').click(); await expect(page.locator('#mediaPreviewDialog video')).toBeVisible(); await expect.poll(() => page.locator('#mediaPreviewDialog video').evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2); await page.locator('#mediaPreviewDialog button').click();
  const json = await output(page, 'json'); const bytes = await fs.readFile(await json.path()); await page.locator('#exportDialog [value=cancel]').last().click(); await blank(page); await page.locator('#projectInput').setInputFiles({ name: 'video.layoutsplat.json', mimeType: 'application/json', buffer: bytes }); await expect.poll(async () => JSON.stringify(await snapshot(page))).toBe(JSON.stringify(doc));
  const html = await output(page, 'html'); const text = await fs.readFile(await html.path(), 'utf8'); expect(text).toContain('<video'); expect(text).toContain('motion-poster'); const viewer = await context.newPage(); await viewer.setContent(text); await expect(viewer.locator('video')).toHaveCount(2); await expect.poll(() => viewer.locator('video').first().evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2); await viewer.emulateMedia({ media: 'print' }); await expect(viewer.locator('video').first()).toBeHidden(); await expect(viewer.locator('.motion-poster').first()).toBeVisible();
});
test('SVG and desktop interchange packages retain a lossless native publication and valid XML', async ({ page }) => {
  test.setTimeout(120000); await ready(page); await blank(page); await page.locator('[data-action=text]').click(); const before = await snapshot(page);
  for (const kind of ['svg', 'idml', 'sla']) {
    const download = await output(page, kind); const bytes = await fs.readFile(await download.path()); await page.locator('#exportDialog [value=cancel]').last().click();
    await page.locator('#projectInput').setInputFiles({ name: download.suggestedFilename(), mimeType: kind === 'svg' ? 'image/svg+xml' : 'application/zip', buffer: bytes }); await expect.poll(async () => JSON.stringify(await snapshot(page))).toBe(JSON.stringify(before));
    if (kind !== 'svg') {
      const result = await page.evaluate(async data => { const zip = await JSZip.loadAsync(Uint8Array.from(atob(data), c => c.charCodeAt(0))); const native = JSON.parse(await zip.file('publication.layoutsplat.json').async('string')); let errors = [];
        const inspect = async z => { for (const [name, entry] of Object.entries(z.files)) if (/\.(xml|sla)$/.test(name)) { const parsed = new DOMParser().parseFromString(await entry.async('string'), 'application/xml'); if (parsed.querySelector('parsererror')) errors.push(name); } };
        await inspect(zip); if (zip.file('publication.idml')) await inspect(await JSZip.loadAsync(await zip.file('publication.idml').async('uint8array'))); return { native, errors, report: !!zip.file('CONVERSION-REPORT.txt') }; }, bytes.toString('base64'));
      expect(result.native).toEqual(before); expect(result.errors).toEqual([]); expect(result.report).toBe(true);
    }
  }
});
test('high-resolution PNG and downloadable PDF use measured page size, bleed, and trim boxes', async ({ page }, info) => {
  test.setTimeout(120000); await ready(page); await blank(page); await page.locator('[data-action=text]').click(); await page.locator('[data-action=exports]').click(); await page.locator('#exportFormat').selectOption('png'); await page.locator('#exportPages').fill('1'); await page.locator('#exportPpi').selectOption('150'); const pngWait = page.waitForEvent('download'); await page.locator('#exportDownload').click(); const png = await fs.readFile(await (await pngWait).path()); expect(png.readUInt32BE(16)).toBe(1275); expect(png.readUInt32BE(20)).toBe(1650);
  await page.locator('#exportFormat').selectOption('pdf'); await page.locator('#exportBleed').fill('9'); await page.locator('#exportMarks').check(); const pdfWait = page.waitForEvent('download'); await page.locator('#exportDownload').click(); const pdf = await pdfWait; await pdf.saveAs(info.outputPath('layoutsplat-bleed-proof.pdf')); expect((await fs.readFile(await pdf.path())).subarray(0, 5).toString()).toBe('%PDF-');
});
