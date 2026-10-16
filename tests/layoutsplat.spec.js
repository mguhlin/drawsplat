const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
async function ready(page) { await page.goto('/splatworks/layoutsplat/'); await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true); }
async function snapshot(page) { return page.evaluate(() => LayoutSplat.getPublication()); }
async function selectStory(page) { const doc = await snapshot(page); const story = Object.values(doc.stories).find(s => s.frames.length === 3); await page.locator('#pageSurface').locator(`[data-object-id="${story.frames[0]}"]`).click(); return story; }
async function replaceStoryText(page, text) {
  // Use real selection events: fill() sets a DOM range which ProseMirror's
  // delayed focus handler can reset before Playwright inserts the replacement.
  const editor = page.locator('#storyText');
  await editor.click(); await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
}
test('the two-page proof renders with real pictures, Arabic text, and all local resources', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); const failures = []; page.on('response', r => { if (r.status() >= 400 && !r.url().includes('favicon')) failures.push(r.url()); });
  await ready(page); const doc = await snapshot(page);
  expect(doc.pages).toHaveLength(2); expect(await page.locator('#pageSurface .object-image').evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(page.locator('#pageSurface .text-content[dir=rtl]')).toContainText('مرحباً');
  await expect(page.locator('#pageSurface')).toContainText('THE COMMUNITY EDITION');
  await expect(page.locator('#exitPreview')).toBeHidden();
  await expect(page.locator('#i18nSwitcher option')).toHaveCount(6);
  expect(errors).toEqual([]); expect(failures).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('layoutsplat-desktop.png'), fullPage: true });
});
test('changing all five units and zoom preserves the exact publication geometry', async ({ page }) => {
  await ready(page); const before = await snapshot(page); await selectStory(page);
  for (const unit of ['cm', 'pc', 'pt', 'px', 'in']) { await page.locator('#unitSelect').selectOption(unit); await expect(page.locator('#rulerH .tick')).not.toHaveCount(0); expect(await snapshot(page)).toEqual(before); }
  await page.locator('#zoomSelect').selectOption('1'); expect(await snapshot(page)).toEqual(before);
  await page.locator('#unitSelect').selectOption('cm'); await page.locator('#propX').fill('2.54'); await page.locator('#propX').press('Tab');
  const after = await snapshot(page); const id = Object.values(before.stories).find(s => s.frames.length === 3).frames[0];
  expect(after.pages[0].objects.find(o => o.id === id).x).toBeCloseTo(72, 9);
});
test('linked flow conserves story content through editing, resizing, continuation, and undo', async ({ page }) => {
  await ready(page); const story = await selectStory(page);
  await page.locator('[data-action=editStory]').click(); const text = ('Every word stays in its story. مرحباً بكم. 👩🏽‍🏫\n\n').repeat(50); await replaceStoryText(page, text); await page.locator('#applyStory').click();
  async function conservation() {
    return page.evaluate(() => { const d = LayoutSplat.getPublication(), l = LayoutSplat.getLayout(); const s = Object.values(d.stories).find(s => s.frames.length >= 3); const parts = s.frames.map(id => l.fragments.find(([key]) => key === id)[1]); return { source: s.text, flowed: parts.map(p => p.text).join(''), overflow: l.overflows.find(o => o.storyId === Object.keys(d.stories).find(id => d.stories[id] === s))?.remaining || 0, fragments: parts }; });
  }
  let state = await conservation(); expect(state.source).toBe(text); expect(state.flowed).toBe(text.slice(0, text.length - state.overflow));
  await page.locator('#unitSelect').selectOption('pt'); await page.locator('#propH').fill('40'); await page.locator('#propH').press('Tab');
  state = await conservation(); expect(state.source).toBe(text); expect(state.flowed).toBe(text.slice(0, text.length - state.overflow)); expect(state.overflow).toBeGreaterThan(0);
  await page.locator('[data-action=continue]').click(); await expect(page.locator('#pageLabel')).toHaveText('Page 3 of 3');
  state = await conservation(); expect(state.source).toBe(text); expect(state.flowed).toBe(text.slice(0, text.length - state.overflow));
  await page.locator('#undoBtn').click(); expect((await snapshot(page)).pages).toHaveLength(2);
  expect(Object.values((await snapshot(page)).stories).find(s => s.frames[0] === story.frames[0]).text).toBe(text);
});
test('the original language picker translates the shell without changing publication text or coordinates', async ({ page }) => {
  await ready(page); const before = await snapshot(page);
  for (const lang of ['es', 'vi', 'ar', 'zh', 'uh', 'en']) {
    await page.locator('#i18nSwitcher').selectOption(lang); expect(await snapshot(page)).toEqual(before);
    expect(await page.evaluate(() => localStorage.getItem('drawsplat.language'))).toBe(lang);
    expect(await page.locator('[data-i18n=properties]').textContent()).not.toBe('properties');
  }
  await page.locator('#i18nSwitcher').selectOption('ar'); await expect(page.locator('html')).toHaveAttribute('dir', 'rtl'); await expect(page.locator('#sheetWrap')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('[data-i18n=properties]')).toHaveText('الخصائص');
});
test('portable project archives and HTML exports preserve text and embedded pictures', async ({ page, context }) => {
  await ready(page); const before = await snapshot(page);
  const pending = page.waitForEvent('download'); await page.locator('.header-actions [data-action=save]').click(); const download = await pending; const path = await download.path(); const bytes = await fs.readFile(path);
  expect(download.suggestedFilename()).toMatch(/\.layoutsplat$/); expect(bytes.subarray(0, 2).toString()).toBe('PK');
  page.on('dialog', d => d.accept()); await page.locator('[data-action=text]').click(); await page.locator('#projectInput').setInputFiles({ name: 'publication.layoutsplat', mimeType: 'application/zip', buffer: bytes });
  await expect.poll(async () => JSON.stringify(await snapshot(page))).toBe(JSON.stringify(before));
  const htmlDownload = page.waitForEvent('download'); await page.locator('#fileMenu > summary').click(); await page.locator('#fileExport > summary').click(); await page.locator('[data-action=export-html]').click(); await page.locator('#exportDownload').click(); const html = await fs.readFile(await (await htmlDownload).path(), 'utf8');
  expect(html).toContain('data:image/png;base64,'); expect(html).toContain('مرحباً'); expect(html).not.toContain('<script');
  const viewer = await context.newPage(); await viewer.setContent(html); await expect(viewer.locator('.publication-page')).toHaveCount(2);
  expect(await viewer.locator('.object-image').evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
});
test('numeric edits autosave and recover on reload, invalid files cannot replace the document', async ({ page }) => {
  await ready(page); await selectStory(page); await page.locator('#unitSelect').selectOption('pt'); await page.locator('#propX').fill('80'); await page.locator('#propX').press('Tab');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('layoutsplat.autosave.v1'))?.pages[0].objects.some(o => o.x === 80))).toBe(true);
  const before = await snapshot(page); await page.reload(); await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true); expect(await snapshot(page)).toEqual(before);
  await page.locator('#projectInput').setInputFiles({ name: 'bad.layoutsplat.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"LayoutSplat","version":99}') });
  await expect(page.locator('#statusText')).toContainText('Could not open'); expect(await snapshot(page)).toEqual(before);
});
test('double-click editing, keyboard placement, dragging, resizing and custom guides work', async ({ page }) => {
  await ready(page); const story = await selectStory(page); const frame = page.locator(`#pageSurface [data-object-id="${story.frames[0]}"]`);
  await frame.dblclick(); await expect(page.locator('#storyDialog')).toBeVisible(); await page.locator('#storyDialog [value=cancel]').last().click();
  await page.locator('#unitSelect').selectOption('pt'); await frame.click(); await page.keyboard.press('ArrowRight'); await expect(page.locator('#propX')).toHaveValue('37');
  const box = await frame.boundingBox(); await page.mouse.move(box.x + 40, box.y + 30); await page.mouse.down(); await page.keyboard.down('Alt'); await page.mouse.move(box.x + 60, box.y + 45); await page.mouse.up(); await page.keyboard.up('Alt');
  expect(Number(await page.locator('#propX').inputValue())).toBeGreaterThan(50);
  await frame.scrollIntoViewIfNeeded(); const resize = await page.locator('.resize-handle').boundingBox(); const width = Number(await page.locator('#propW').inputValue()); await page.mouse.move(resize.x + resize.width / 2, resize.y + resize.height / 2); await page.mouse.down(); await page.mouse.move(resize.x + 30, resize.y + 20); await page.mouse.up(); expect(Number(await page.locator('#propW').inputValue())).toBeGreaterThan(width);
  await page.locator('#canvasScroll').evaluate(el => el.scrollTop = 0); const ruler = await page.locator('#rulerH').boundingBox(), surface = await page.locator('#pageSurface').boundingBox(); await page.mouse.move(ruler.x + 70, ruler.y + 8); await page.mouse.down(); await page.mouse.move(surface.x + 90, surface.y + 90); await page.mouse.up();
  expect((await snapshot(page)).guides.vertical).toHaveLength(1);
});
test('design checking finds overflow and small pictures; imported text stays inert', async ({ page }) => {
  await ready(page); await selectStory(page); await page.locator('[data-action=editStory]').click(); const content = '<img src=x onerror=alert(1)>\n' + 'Long text '.repeat(3000); await replaceStoryText(page, content); await page.locator('#applyStory').click();
  await page.locator('#fileMenu > summary').click(); await page.locator('#fileMenu [data-action=check]').click(); await expect(page.locator('.finding.error').first()).toContainText('characters');
  expect(await page.locator('#pageSurface .text-content img').count()).toBe(0);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
  await page.locator('#pictureInput').setInputFiles({ name: 'tiny.png', mimeType: 'image/png', buffer: png }); await expect(page.locator('.finding.warning').filter({ hasText: 'resolution' })).toBeVisible();
});
test('PDF proof prints two real Letter pages with selectable text', async ({ page }, testInfo) => {
  await ready(page); await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ path: testInfo.outputPath('layoutsplat-letter-proof.pdf'), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-'); expect(pdf.length).toBeGreaterThan(15000);
  await expect(page.locator('#printPages .publication-page')).toHaveCount(2); const box = await page.locator('#printPages .publication-page').first().boundingBox(); expect(box.width).toBeCloseTo(816, 0); expect(box.height).toBeCloseTo(1056, 0);
  await expect(page.locator('#printPages .publication-page').nth(1)).toContainText('readers');
});
test('phone layout keeps controls usable and preserves page proportions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page); await expect(page.locator('.header-actions [data-action=save]')).toBeVisible(); await expect(page.locator('#i18nSwitcher')).toBeVisible();
  const doc = await snapshot(page); expect(doc.width / doc.height).toBeCloseTo(8.5 / 11, 9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('layoutsplat-phone.png'), fullPage: true });
});
test('a corrupted draft recovers its previous autosave without losing the saved project', async ({ page }) => {
  await ready(page); await expect.poll(() => page.evaluate(() => !!localStorage.getItem('layoutsplat.autosave.v1'))).toBe(true);
  const backup = await snapshot(page); await selectStory(page); await page.locator('#unitSelect').selectOption('pt'); await page.locator('#propX').fill('80'); await page.locator('#propX').press('Tab');
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem('layoutsplat.recovery.v1'))).toBe(true);
  await page.evaluate(() => localStorage.setItem('layoutsplat.autosave.v1', '{broken')); await page.reload(); await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true);
  expect(await snapshot(page)).toEqual(backup); await expect(page.locator('#statusText')).toContainText('Recovered');
});
test('a LayoutSplat archive chosen in ShowSplat opens an isolated LayoutSplat draft', async ({ page, context }) => {
  await ready(page); const before = await snapshot(page); const pendingDownload = page.waitForEvent('download'); await page.locator('.header-actions [data-action=save]').click(); const bytes = await fs.readFile(await (await pendingDownload).path());
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem('layoutsplat.autosave.v1'))).toBe(true);
  await page.evaluate(() => localStorage.setItem('layoutsplat.autosave.v1', 'keep-the-original-layout-draft'));
  const show = await context.newPage(); await show.goto('/splatworks/showsplat/'); await expect(show.locator('#slideCanvas')).toBeVisible(); const source = await show.evaluate(() => localStorage.getItem('showsplat.deck.v1'));
  const pending = show.waitForEvent('popup'); await show.locator('#deckFileInput').setInputFiles({ name: 'newsletter.layoutsplat', mimeType: 'application/zip', buffer: bytes }); const target = await pending;
  await target.waitForURL(/\/splatworks\/layoutsplat\//); await expect.poll(() => target.evaluate(() => !!window.LayoutSplat)).toBe(true); expect(await snapshot(target)).toEqual(before);
  expect(await target.evaluate(() => localStorage.getItem('layoutsplat.autosave.v1'))).toBe('keep-the-original-layout-draft'); expect(await show.evaluate(() => localStorage.getItem('showsplat.deck.v1'))).toBe(source);
  await expect(target.locator('#statusText')).toContainText('separate draft');
});
test('the shared Apps launcher discovers LayoutSplat and its public roadmap', async ({ page }) => {
  await ready(page); await page.locator('[data-ds-app-launcher]').click(); await expect(page.locator('a[href="/splatworks/layoutsplat/"]')).toBeVisible();
  expect((await page.request.get('/splatworks/ROADMAP.md')).ok()).toBe(true); expect((await page.request.get('/splatworks/layoutsplat/IMPLEMENTATION_PLAN.md')).ok()).toBe(true);
});
