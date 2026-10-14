// Legacy iWork XML layout import. Modern IWA packages are detected explicitly.
import { newPublication, uid, frame, shape, textStyle, validatePublication } from './engine.mjs';
import { parseXml, fontFamily } from './compatibility.mjs';
import { readZip } from './desktop-formats.mjs';
import { importMedia, readData } from './media.mjs';
const attr = (el, key, fallback = '') => [...(el?.attributes || [])].find(a => a.localName === key)?.value ?? fallback;
const child = (el, name) => [...(el?.children || [])].find(e => e.localName === name);
const descendants = (el, name) => [...(el?.getElementsByTagName('*') || [])].filter(e => e.localName === name);
const number = (el, key, fallback = 0) => { const n = Number(attr(el, key, fallback)); return Number.isFinite(n) ? n : fallback; };
const bounded = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function rgb(el) {
  if (!el) return '#25304b'; let values;
  if (attr(el, 'r') !== '') values = ['r', 'g', 'b'].map(k => number(el, k));
  else if (attr(el, 'c') !== '') { const k = number(el, 'k'); values = ['c', 'm', 'y'].map(v => (1 - number(el, v)) * (1 - k)); }
  else values = Array(3).fill(number(el, 'w'));
  return '#' + values.map(n => Math.round(bounded(n, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
}
function geometry(el, origin = { x: 0, y: 0 }) {
  const g = child(el, 'geometry') || el, size = child(g, 'size'), natural = child(g, 'naturalSize'), position = child(g, 'position');
  return { x: origin.x + number(position, 'x'), y: origin.y + number(position, 'y'), w: Math.max(.1, number(size, 'w', number(natural, 'w', 100))), h: Math.max(.1, number(size, 'h', number(natural, 'h', 100))), rotation: bounded(number(g, 'angle') * 180 / Math.PI, -360, 360) };
}
export async function importPages(file, { signal, onProgress = () => {} } = {}) {
  const zip = await readZip(file), xmlFile = zip.file('index.xml') || zip.file('index.xml.gz');
  if (!xmlFile) {
    if (Object.keys(zip.files).some(n => /\.iwa$/i.test(n) || /(^|\/)Index\.zip$/i.test(n))) throw Error('This Pages document uses the newer IWA format. Editable IWA import is not available yet. Export Word for text, PDF for page appearance, or save a legacy iWork XML document.');
    throw Error('No supported Pages index.xml document was found.');
  }
  let source;
  if (/\.gz$/i.test(xmlFile.name)) { const stream = new Blob([await xmlFile.async('uint8array')]).stream().pipeThrough(new DecompressionStream('gzip')); source = await new Response(stream).text(); }
  else source = await xmlFile.async('string');
  const xml = parseXml(source); if (xml.documentElement.namespaceURI !== 'http://developer.apple.com/namespaces/sl' || xml.documentElement.localName !== 'document') throw Error('Not a legacy Pages layout document.');
  const doc = newPublication(true); doc.title = file.name.replace(/\.pages$/i, ''); doc.pages = []; doc.importedFrom = 'Apple Pages (legacy XML)';
  const warnings = ['Legacy Apple Pages layout imported locally as editable text, shapes, groups, gradients, and embedded pictures. Fonts use bundled substitutes. Review typography, masks, master elements, tables, and advanced effects before printing.'], styles = new Map(), cache = new Map(), assets = new Map(), sourceFonts = new Set(), definitions = new Map();
  for (const el of xml.getElementsByTagName('*')) if (attr(el, 'ID')) definitions.set(attr(el, 'ID'), el);
  for (const el of xml.getElementsByTagName('*')) { if (!['paragraphstyle', 'characterstyle', 'graphic-style', 'layoutstyle'].includes(el.localName)) continue; for (const key of ['ID', 'ident']) if (attr(el, key)) styles.set(attr(el, key), el); }
  function properties(id, visited = new Set()) {
    if (cache.has(id)) return cache.get(id); if (!id || visited.has(id) || visited.size > 24) return {};
    visited.add(id); const el = styles.get(id); if (!el) return {};
    const p = { ...properties(attr(el, 'parent-ident'), visited) };
    for (const prop of child(el, 'property-map')?.children || []) if (prop.children.length) p[prop.localName] = prop.firstElementChild;
    cache.set(id, p); return p;
  }
  const propNumber = (p, key, fallback = 0) => p[key]?.localName === 'number' ? number(p[key], 'number', fallback) : fallback;
  function typeStyle(p) {
    const name = attr(p.fontName, 'string', 'Arial'); sourceFonts.add(name);
    const size = bounded(propNumber(p, 'fontSize', 12), 6, 120);
    return { font: fontFamily(name), size, tracking: bounded(propNumber(p, 'tracking') * size, -12, 10), color: rgb(p.fontColor), bold: propNumber(p, 'bold') === 1 || /bold/i.test(name), italic: propNumber(p, 'italic') === 1 || /italic|oblique/i.test(name), underline: propNumber(p, 'underline') > 0 };
  }
  const print = descendants(xml, 'slprint-info')[0]; doc.width = number(print, 'page-width', 612); doc.height = number(print, 'page-height', 792); doc.margin = 0; doc.bleed = 0; doc.safeArea = 0;
  async function assetFor(name) {
    if (assets.has(name)) return assets.get(name); const entry = zip.file(name); if (!entry || entry._data?.uncompressedSize > 96000000) { warnings.push(`Missing Pages picture: ${name}.`); return null; }
    const bytes = await entry.async('uint8array'), mime = /\.jpe?g$/i.test(name) ? 'image/jpeg' : /\.png$/i.test(name) ? 'image/png' : '', mediaFile = new File([bytes], name, { type: mime }); let asset;
    if (mime) { const src = await readData(mediaFile), image = new Image(); image.src = src; await image.decode(); if (image.naturalWidth > 20000 || image.naturalHeight > 20000 || image.naturalWidth * image.naturalHeight > 40000000) throw Error('Pages picture exceeds the image size limit.'); asset = { name, alt: '', width: image.naturalWidth, height: image.naturalHeight, src }; }
    else { asset = await importMedia(mediaFile, { signal }); warnings.push(...asset.notes); delete asset.notes; }
    const id = uid(); doc.assets[id] = asset; assets.set(name, id); return id;
  }
  function addText(el, page, g, groupIds) {
    const body = descendants(child(el, 'text'), 'text-body')[0]; if (!body) return;
    let content = '', marks = [], paragraphs = [], base;
    for (const p of descendants(body, 'p')) {
      if (content) content += '\n'; const from = content.length, props = properties(attr(p, 'style')), defaultStyle = typeStyle(props);
      function walk(node, inherited) {
        if (node.nodeType === 3) { const start = content.length; content += node.nodeValue.replace(/\r/g, ''); if (content.length > start) marks.push({ from: start, to: content.length, ...inherited }); return; }
        if (node.nodeType !== 1) return;
        if (['br', 'lnbr'].includes(node.localName)) { content += '\n'; return; } if (node.localName === 'tab') { content += '\t'; return; }
        const next = attr(node, 'style') ? typeStyle({ ...props, ...properties(attr(node, 'style')) }) : inherited;
        for (const nested of node.childNodes) walk(nested, next);
      }
      for (const node of p.childNodes) walk(node, defaultStyle);
      if (content.endsWith('\n')) content = content.slice(0, -1);
      if (content.length > from) { base ||= marks.find(m => m.from >= from) || defaultStyle; const spacing = props.lineSpacing, leading = spacing?.localName === 'linespacing' && attr(spacing, 'mode') === 'absolute' ? number(spacing, 'amt', base.size * 1.2) : base.size * Math.max(1, number(spacing, 'amt', 1.2)); paragraphs.push({ from, to: content.length, leading: bounded(leading, 6, 360), align: ['left', 'right', 'center', 'justify'][propNumber(props, 'alignment')] || 'left' }); }
    }
    if (!content.trim()) return;
    const key = uid(), o = frame(key, g.x, g.y, Math.max(6, g.w), Math.max(6, g.h)), layout = properties(attr(child(el, 'text'), 'layoutstyle')); o.rotation = g.rotation; o.padding = bounded(number(layout.padding, 'left'), 0, 36); o.groupIds = groupIds;
    doc.stories[key] = { text: content, marks, paragraphs, frames: [o.id], style: { ...textStyle(), ...base, weight: base?.bold ? 'bold' : 'normal', lineHeight: bounded((paragraphs[0]?.leading || 14) / (base?.size || 12), 1, 3), align: paragraphs[0]?.align || 'left' } }; page.objects.push(o);
  }
  async function draw(el, page, origin = { x: 0, y: 0 }, groupIds = []) {
    signal?.throwIfAborted(); if (page.objects.length >= 200) throw Error('Pages import supports 200 objects per page.');
    const g = geometry(el, origin);
    if (el.localName === 'group') { const ids = [...groupIds, uid()]; for (const c of el.children) if (['group', 'drawable-shape', 'media'].includes(c.localName)) await draw(c, page, g, ids); if (g.rotation) warnings.push('Rotated Pages groups need review; group rotation is not applied.'); return; }
    const props = properties(attr(child(child(el, 'style'), 'graphic-style-ref'), 'IDREF'));
    if (el.localName === 'media') {
      const content = child(el, 'content'), ref = descendants(content, 'unfiltered-ref')[0], data = descendants(content, 'data')[0] || descendants(definitions.get(attr(ref, 'IDREF')), 'data')[0]; if (!data) { warnings.push('A Pages media object has no supported embedded image.'); return; }
      const assetId = await assetFor(attr(data, 'path')); if (!assetId) return;
      const cropEl = child(el, 'crop-geometry'), crop = cropEl ? geometry(cropEl, origin) : g, o = { id: uid(), type: 'image', assetId, ...crop, rotation: g.rotation, fit: 'stretch', locked: false, groupIds, opacity: bounded(propNumber(props, 'opacity', 1), 0, 1) };
      if (cropEl) o.crop = { x: (g.x - crop.x) / crop.w, y: (g.y - crop.y) / crop.h, w: g.w / crop.w, h: g.h / crop.h };
      const mask = descendants(child(el, 'masking-shape-path-source'), 'bezier')[0]; if (mask) { o.path = attr(mask, 'path'); o.pathViewBox = [0, 0, crop.w, crop.h]; } page.objects.push(o); return;
    }
    const path = descendants(child(el, 'path'), 'bezier')[0], fill = props.fill, stroke = props.stroke, o = shape(g.x, g.y, g.w, g.h, fill?.localName === 'color' ? rgb(fill) : '#ffffff', path ? 'path' : 'rect'); o.rotation = g.rotation; o.groupIds = groupIds; o.noFill = !fill || fill.localName === 'null'; o.opacity = bounded(propNumber(props, 'opacity', 1), 0, 1); o.strokeWidth = stroke?.localName === 'stroke' && attr(child(stroke, 'pattern'), 'type') !== 'empty' ? bounded(number(stroke, 'width'), 0, 20) : 0; o.stroke = rgb(child(stroke, 'color'));
    if (path) { o.path = attr(path, 'path'); o.pathViewBox = [0, 0, g.w, g.h]; }
    if (fill?.localName === 'angle-gradient') { const stops = descendants(fill, 'gradient-stop'); if (stops.length >= 2 && stops.length <= 100) { o.noFill = false; o.gradient = { type: attr(fill, 'type') === 'radial' ? 'radial' : 'linear', angle: bounded(-number(fill, 'angle') * 180 / Math.PI, -360, 360), stops: stops.map(s => ({ offset: bounded(number(s, 'fraction'), 0, 1), color: rgb(child(s, 'color')), opacity: bounded(number(child(s, 'color'), 'a', 1), 0, 1) })) }; } }
    if (!o.noFill || o.strokeWidth) page.objects.push(o); addText(el, page, g, groupIds);
  }
  const groups = descendants(child(xml.documentElement, 'drawables'), 'page-group');
  if (!groups.length || groups.length > 500) throw Error('No supported Pages layout pages were found.');
  for (const [index, group] of groups.entries()) {
    onProgress(`Importing Pages layout ${index + 1} of ${groups.length}…`); const page = { id: uid(), objects: [] }; doc.pages.push(page);
    for (const el of group.children) if (['group', 'drawable-shape', 'media'].includes(el.localName)) await draw(el, page);
  }
  const masters = descendants(xml, 'masters-group'); if (masters.some(m => descendants(m, 'drawable-shape').length || descendants(m, 'media').length)) warnings.push('Pages master objects are not yet applied. Review headers, footers, and backgrounds.');
  if (descendants(xml, 'tabular-model').length) warnings.push('Pages tables are not yet converted.'); doc.sourceFonts = [...sourceFonts];
  return { doc: validatePublication(doc), warnings: [...new Set(warnings)] };
}
