const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

async function fixture(page) {
  await page.goto('/splatworks/layoutsplat/');
  await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true);
  page.on('dialog', dialog => dialog.accept());
  const doc = await page.evaluate(async () => {
    const { newPublication, uid, shape, frame, textStyle } = await import('/splatworks/layoutsplat/engine.mjs');
    const d = newPublication(true); d.title = 'Editable office proof'; d.width = 720; d.height = 540; d.margin = 24;
    const addText = (page, text, box, style = {}) => {
      const id = uid(), f = Object.assign(frame(id, ...box), { padding: 0 });
      d.stories[id] = { text, frames: [f.id], style: { ...textStyle(), size: 16, ...style } }; page.objects.push(f); return f;
    };
    const master = { id: uid(), name: 'Brand', objects: [shape(0, 0, 720, 9, '#7c3aed')] };
    addText(master, 'MASTER ELEMENT', [24, 14, 300, 28], { size: 12 }); d.masters = [master];
    const p1 = { id: uid(), masterId: master.id, objects: [] }, p2 = { id: uid(), masterId: master.id, masterOverrides: [master.objects[0].id], objects: [] }; d.pages = [p1, p2];
    const rich = addText(p1, 'Editable rich text — Café & quotes\n\nSecond paragraph\twith tab.', [24, 60, 400, 115]);
    const s = d.stories[rich.storyId];
    s.marks = [{ from: 0, to: 8, bold: true, italic: true, underline: true, color: '#dd2244', size: 21, tracking: .6, link: 'https://example.test/?a=1&b=2' }, { from: 9, to: 13, font: 'Georgia', size: 18 }];
    s.paragraphs = [{ from: 0, to: 33, align: 'left', leading: 25, spaceBefore: 2, spaceAfter: 3, indentLeft: 8, firstLineIndent: 4 }, { from: 34, to: 34, align: 'left', leading: 20 }, { from: 35, to: s.text.length, align: 'right', leading: 22, indentRight: 6 }];
    // Use exact newline boundaries rather than assuming UTF-16 lengths.
    let offset = 0; s.paragraphs = s.text.split('\n').map((line, i) => { const p = { ...s.paragraphs[i], from: offset, to: offset + line.length }; offset += line.length + 1; return p; });
    const linked = addText(p1, 'Linked story conservation: '.repeat(12) + 'END LINKED.', [24, 200, 200, 82], { size: 12, lineHeight: 1.2 });
    const next = frame(linked.storyId, 24, 60, 420, 220); next.padding = 0; next.columns = 2; next.columnGap = 16; next.rotation = 7;
    p2.objects.push(next); d.stories[linked.storyId].frames.push(next.id);
    addText(p2, 'مرحبا بالنص القابل للتحرير', [450, 60, 240, 60], { size: 18, direction: 'rtl', align: 'right' });
    p1.objects.push({ id: uid(), type: 'table', x: 24, y: 330, w: 400, h: 100, rotation: 0, locked: false, cells: [['Name', 'Score'], ['Ada & Co', '98']], header: true, fontSize: 12 });
    p1.objects.push({ ...shape(470, 185, 100, 50, '#22aa55', 'ellipse'), rotation: 22, opacity: .6 });
    p1.objects.push({ ...shape(470, 255, 100, 60, '#ff9900', 'triangle'), stroke: '#25304b', strokeWidth: 2 });
    p1.objects.push({ ...shape(470, 330, 100, 60, '#22aa55', 'heart'), rotation: -12 });
    p2.objects.push({ ...shape(470, 330, 100, 60, '#4455cc'), gradient: { type: 'linear', angle: 30, stops: [{ offset: 0, color: '#ff0000', opacity: 1 }, { offset: .5, color: '#00ff00', opacity: 1 }, { offset: 1, color: '#0000ff', opacity: 1 }] } });
    p2.objects.push({ ...shape(470, 420, 100, 60, '#993399', 'border'), opacity: .7 });
    const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 100; const c = canvas.getContext('2d'); c.fillStyle = '#ff0000'; c.fillRect(0, 0, 80, 100); c.fillStyle = '#0000ff'; c.fillRect(80, 0, 80, 100);
    const id = uid(); d.assets[id] = { name: 'Original two-color picture', alt: 'Red left and blue right', width: 160, height: 100, src: canvas.toDataURL('image/png') };
    p1.objects.push({ id: uid(), type: 'image', assetId: id, x: 470, y: 60, w: 100, h: 100, fit: 'stretch', crop: { x: 0, y: 0, w: 2, h: 1 }, rotation: 0, opacity: 1, locked: false });
    return d;
  });
  await page.locator('#projectInput').setInputFiles({ name: 'native.layoutsplat.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await expect.poll(() => page.evaluate(() => LayoutSplat.getPublication().title)).toBe(doc.title);
  return doc;
}
for (const kind of ['pptx', 'odp']) test(`${kind} default export preserves editable rich text, native shapes, pictures, tables and linked fragments`, async ({ page }, info) => {
  await fixture(page); const before = await page.evaluate(() => LayoutSplat.getPublication());
  await page.locator('#fileMenu > summary').click(); await page.locator('#fileExport > summary').click(); await page.locator(`[data-action=export-${kind}]`).click();
  await expect(page.locator('#exportPresentationMode')).toHaveValue('editable'); await expect(page.locator('#exportFormatHint')).toContainText('remain editable');
  const waiting = page.waitForEvent('download'); await page.locator('#exportDownload').click(); const download = await waiting;
  await download.saveAs(info.outputPath(`editable.${kind}`));
  const bytes = await fs.readFile(await download.path());
  await expect(page.locator('#importReportDialog')).toBeVisible(); await expect(page.locator('#importReportDialog')).toContainText('decorative border');
  const result = await page.evaluate(async ({ data, kind }) => {
    const zip = await JSZip.loadAsync(Uint8Array.from(atob(data), c => c.charCodeAt(0))), docs = [], errors = [];
    for (const [name, entry] of Object.entries(zip.files)) if (/\.(xml|rels)$/.test(name)) {
      const doc = new DOMParser().parseFromString(await entry.async('string'), 'application/xml'); if (doc.querySelector('parsererror')) errors.push(name);
      if (kind === 'pptx' ? /^ppt\/slides\/slide\d+\.xml$/.test(name) : name === 'content.xml') docs.push(doc);
    }
    const ns = { a: 'http://schemas.openxmlformats.org/drawingml/2006/main', p: 'http://schemas.openxmlformats.org/presentationml/2006/main', d: 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0', t: 'urn:oasis:names:tc:opendocument:xmlns:text:1.0', table: 'urn:oasis:names:tc:opendocument:xmlns:table:1.0' };
    if (kind === 'odp') for (const doc of docs) {
      for (const space of [...doc.getElementsByTagNameNS(ns.t, 's')]) space.replaceWith(doc.createTextNode(' '.repeat(Number(space.getAttributeNS(ns.t, 'c') || 1))));
      for (const tab of [...doc.getElementsByTagNameNS(ns.t, 'tab')]) tab.replaceWith(doc.createTextNode('\t'));
    }
    const elements = (prefix, name) => docs.flatMap(doc => [...doc.getElementsByTagNameNS(ns[prefix], name)]);
    const text = kind === 'pptx' ? elements('a', 't').map(e => e.textContent).join('') : elements('t', 'span').map(e => e.textContent).join('');
    const actualText = kind === 'odp' ? text.replaceAll('\t', '') : text;
    const report = await zip.file('LayoutSplat-conversion.txt').async('string');
    const rich = kind === 'pptx' ? elements('a', 'r').find(r => r.textContent === 'Editable')?.firstElementChild.outerHTML : elements('t', 'span').find(r => r.textContent === 'Editable')?.outerHTML;
    const nativeShapes = kind === 'pptx' ? elements('p', 'sp').length : elements('d', 'rect').length + elements('d', 'ellipse').length + elements('d', 'path').length;
    const tableCount = kind === 'pptx' ? elements('a', 'tbl').length : elements('table', 'table').length;
    const boxes = kind === 'pptx' ? elements('p', 'txBody').length : elements('d', 'text-box').length;
    const pictureCount = kind === 'pptx' ? elements('p', 'pic').length : elements('d', 'image').length;
    const columnText = kind === 'pptx' ? elements('p', 'sp').filter(s => s.getElementsByTagNameNS(ns['p'], 'cNvPr')[0]?.getAttribute('name').includes('column')).map(s => [...s.getElementsByTagNameNS(ns.a, 't')].map(t => t.textContent).join('')) : elements('d', 'frame').filter(s => s.getAttributeNS(ns.d, 'name')?.includes('column')).map(s => [...s.getElementsByTagNameNS(ns.t, 'span')].map(t => t.textContent).join(''));
    const images = Object.keys(zip.files).filter(n => /(?:media|Pictures)\/object\d+\.png$/.test(n));
    const last = await createImageBitmap(await zip.file(images.at(-1)).async('blob')), canvas = document.createElement('canvas'); canvas.width = last.width; canvas.height = last.height; canvas.getContext('2d').drawImage(last, 0, 0); last.close();
    return { errors, text: actualText, report, rich, nativeShapes, tableCount, boxes, pictureCount, columnText, styles: kind === 'odp' ? await zip.file('content.xml').async('string') : '', transparentFallback: canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data[3] };
  }, { data: bytes.toString('base64'), kind });
  expect(result.errors).toEqual([]); expect(result.nativeShapes).toBeGreaterThanOrEqual(4); expect(result.tableCount).toBe(1); expect(result.boxes).toBeGreaterThanOrEqual(6);
  expect(result.text).toContain('Editable rich text — Café & quotes'); expect(result.text).toContain('Ada & Co98'); expect(result.text).toContain('مرحبا بالنص القابل للتحرير');
  expect(result.text.match(/MASTER ELEMENT/g)).toHaveLength(2);
  const linked = before.stories[before.pages[0].objects.find(o => o.type === 'text' && before.stories[o.storyId].text.startsWith('Linked story')).storyId].text;
  expect(result.columnText.filter(t => t.includes('Linked') || t.includes('story') || t.includes('END LINKED.')).join('')).toBe(linked);
  if (kind === 'pptx') { expect(result.rich).toContain('b="1"'); expect(result.rich).toContain('i="1"'); expect(result.rich).toContain('u="sng"'); expect(result.rich).toContain('sz="2100"'); expect(result.pictureCount).toBe(2); }
  else { expect(result.styles).toContain('fo:font-weight="bold"'); expect(result.styles).toContain('fo:font-style="italic"'); expect(result.styles).toContain('style:text-underline-style="solid"'); expect(result.styles).toContain('fo:font-size="21pt"'); expect(result.pictureCount).toBe(3); }
  expect(result.transparentFallback).toBe(0); expect(await page.evaluate(() => LayoutSplat.getPublication())).toEqual(before);
  await fs.writeFile(info.outputPath('editable-source.json'), JSON.stringify(before));
});
