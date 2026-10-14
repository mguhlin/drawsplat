import { newPublication, uid, frame, shape, textStyle, validatePublication } from './engine.mjs';
const NS = 'http://www.w3.org/2000/svg';
export const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
export function parseXml(text) { if (text.length > 24000000 || /<!DOCTYPE|<!ENTITY/i.test(text)) throw Error('Unsupported XML declaration.'); const doc = new DOMParser().parseFromString(text, 'application/xml'); if (doc.querySelector('parsererror')) throw Error('Invalid XML.'); return doc; }
export function color(value, fallback = '#34205c') {
  if (!value || value === 'none' || /^url\(/i.test(value)) return fallback;
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); ctx.fillStyle = fallback; ctx.fillStyle = value;
  const actual = ctx.fillStyle; if (/^#[0-9a-f]{6}$/i.test(actual)) return actual;
  const parts = actual.match(/[\d.]+/g); return parts?.length >= 3 ? '#' + parts.slice(0, 3).map(n => Math.round(Number(n)).toString(16).padStart(2, '0')).join('') : fallback;
}
export function length(value, fallback = 0) {
  const match = /^\s*([+-]?[\d.]+)\s*(pt|px|in|cm|mm|pc)?\s*$/i.exec(String(value || ''));
  return match ? Number(match[1]) * ({ pt: 1, px: .75, in: 72, cm: 72 / 2.54, mm: 72 / 25.4, pc: 12 }[match[2]?.toLowerCase()] || 1) : fallback;
}
export const fontFamily = name => /georgia|times|serif/i.test(name) && !/sans/i.test(name) ? 'Georgia' : /verdana|dejavu/i.test(name) ? 'Verdana' : 'Arial';
function addText(doc, page, text, x, y, w, h, style = {}) {
  const id = uid(), o = frame(id, x, y, Math.max(6, w), Math.max(6, h)); o.padding = 0; doc.stories[id] = { text: text.slice(0, 100000), style: { ...textStyle(), ...style }, frames: [o.id], marks: [] }; page.objects.push(o); return o;
}
export function importFabric(data) {
  const doc = newPublication(true), warnings = ['Fabric canvas pixels are converted to print points. Groups are flattened; unsupported effects need review.'];
  doc.width = Math.max(72, Math.min(2000, Number(data.width || 816) * .75)); doc.height = Math.max(72, Math.min(2000, Number(data.height || 1056) * .75)); doc.margin = Math.min(36, doc.width / 8); const page = doc.pages[0];
  function visit(objects, dx = 0, dy = 0) { for (const item of objects || []) {
    if (page.objects.length >= 200) throw Error('Too many objects.');
    const sx = Math.abs(Number(item.scaleX ?? 1)), sy = Math.abs(Number(item.scaleY ?? 1)), w = Math.max(6, Number(item.width || 240) * sx * .75), h = Math.max(6, Number(item.height || 100) * sy * .75), x = dx + Number(item.left || 0) * .75 - (item.originX === 'center' ? w / 2 : item.originX === 'right' ? w : 0), y = dy + Number(item.top || 0) * .75 - (item.originY === 'center' ? h / 2 : item.originY === 'bottom' ? h : 0);
    if (item.type === 'group') { visit(item.objects, x, y); continue; }
    let o;
    if (['text', 'i-text', 'textbox'].includes(item.type)) { o = addText(doc, page, String(item.text || ''), x, y, w, h, { font: fontFamily(item.fontFamily || ''), size: Math.max(6, Math.min(120, Number(item.fontSize || 16) * sy * .75)), weight: /bold|[6-9]00/.test(String(item.fontWeight)) ? 'bold' : 'normal', color: color(item.fill), align: ['left', 'center', 'right', 'justify'].includes(item.textAlign) ? item.textAlign : 'left' }); if (item.fontStyle === 'italic' || item.underline) doc.stories[o.storyId].marks = [{ from: 0, to: doc.stories[o.storyId].text.length, italic: item.fontStyle === 'italic', underline: !!item.underline }].filter(m => m.to > 0); }
    else if (item.type === 'image' && /^data:image\/(png|jpeg|webp);base64,/.test(item.src || '')) { const id = uid(); doc.assets[id] = { name: 'Imported picture', width: Math.max(1, Math.min(20000, Number(item.width || 100))), height: Math.max(1, Math.min(20000, Number(item.height || 100))), src: item.src }; o = { id: uid(), type: 'image', assetId: id, x, y, w, h, fit: 'contain', rotation: 0, locked: false }; page.objects.push(o); }
    else if (['rect', 'circle', 'ellipse', 'triangle', 'line'].includes(item.type)) { o = shape(x, y, w, h, color(item.fill), ['circle', 'ellipse'].includes(item.type) ? 'ellipse' : item.type === 'triangle' ? 'triangle' : item.type === 'line' ? 'line' : 'rect'); page.objects.push(o); }
    else { warnings.push(`Converted unsupported ${item.type || 'object'} to a placeholder.`); o = shape(x, y, w, h, '#eeeaf6'); page.objects.push(o); }
    o.rotation = Math.max(-360, Math.min(360, Number(item.angle || 0)));
  } }
  visit(data.objects); return { doc: validatePublication(doc), warnings };
}
export function importSvg(text) {
  const parsed = parseXml(text), root = parsed.documentElement, metadata = parsed.querySelector('metadata#layoutsplat-document');
  if (metadata) return { doc: validatePublication(JSON.parse(metadata.textContent)), warnings: [] };
  if (root.localName !== 'svg') throw Error('Not SVG.');
  const box = (root.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number), viewWidth = box[2] || length(root.getAttribute('width'), 612), viewHeight = box[3] || length(root.getAttribute('height'), 792);
  const d = newPublication(true), warnings = ['SVG text is imported as editable frames. Filters, gradients, complex transforms, and clipping need review.'];
  d.width = Math.max(72, Math.min(2000, length(root.getAttribute('width'), viewWidth))); d.height = Math.max(72, Math.min(2000, length(root.getAttribute('height'), viewHeight))); d.margin = Math.min(36, d.width / 8); const sx = d.width / viewWidth, sy = d.height / viewHeight, page = d.pages[0];
  const num = (el, name, fallback = 0) => Number(el.getAttribute(name) || fallback), attrs = el => Object.fromEntries((el.getAttribute('style') || '').split(';').map(item => item.split(':').map(s => s.trim())).filter(pair => pair.length === 2));
  for (const el of root.querySelectorAll('rect,circle,ellipse,path,line,text,image,foreignObject')) {
    if (el.closest('defs,clipPath,mask,metadata,symbol')) continue; if (page.objects.length >= 200) throw Error('Too many SVG objects.');
    const css = attrs(el), kind = el.localName; let x = num(el, 'x') * sx, y = num(el, 'y') * sy, w = Math.max(6, num(el, 'width', 200) * sx), h = Math.max(6, num(el, 'height', 80) * sy), o;
    if (kind === 'text' || kind === 'foreignObject') { const size = Math.max(6, Math.min(120, num(el, 'font-size', parseFloat(css['font-size']) || 12) * sy)); if (kind === 'text') y -= size; o = addText(d, page, el.textContent, x, y, w, Math.max(h, size * 1.5), { size, font: fontFamily(el.getAttribute('font-family') || css['font-family'] || ''), weight: /bold|[6-9]00/.test(el.getAttribute('font-weight') || css['font-weight'] || '') ? 'bold' : 'normal', color: color(el.getAttribute('fill') || css.fill), direction: el.getAttribute('direction') === 'rtl' ? 'rtl' : 'ltr' }); }
    else if (kind === 'image') { const src = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'); if (!/^data:image\/(png|jpeg|webp);base64,/.test(src || '')) { warnings.push('An external image was not downloaded. Replace its placeholder locally.'); o = shape(x, y, w, h, '#eeeaf6'); page.objects.push(o); } else { const id = uid(); d.assets[id] = { name: 'Imported SVG picture', width: Math.max(1, Math.round(w * 2)), height: Math.max(1, Math.round(h * 2)), src }; o = { id: uid(), type: 'image', assetId: id, x, y, w, h, rotation: 0, fit: 'contain', locked: false }; page.objects.push(o); } }
    else { if (kind === 'circle' || kind === 'ellipse') { const rx = num(el, 'rx', num(el, 'r')) * sx, ry = num(el, 'ry', num(el, 'r')) * sy; x = num(el, 'cx') * sx - rx; y = num(el, 'cy') * sy - ry; w = Math.max(6, rx * 2); h = Math.max(6, ry * 2); } if (kind === 'line') { x = num(el, 'x1') * sx; y = num(el, 'y1') * sy; w = Math.max(6, (num(el, 'x2') - num(el, 'x1')) * sx); h = Math.max(6, Math.abs(num(el, 'y2') - num(el, 'y1')) * sy); } o = shape(x, y, w, h, color(el.getAttribute('fill') || css.fill), ['circle', 'ellipse'].includes(kind) ? 'ellipse' : kind === 'line' ? 'line' : kind === 'path' ? 'path' : 'rect'); o.stroke = color(el.getAttribute('stroke') || css.stroke, o.fill); o.strokeWidth = Math.max(0, Math.min(20, num(el, 'stroke-width') * sx)); o.noFill = (el.getAttribute('fill') || css.fill) === 'none'; if (kind === 'path') o.path = el.getAttribute('d') || 'M0 0'; page.objects.push(o); }
    if (el.getAttribute('transform')) warnings.push('Review imported object transforms.');
  }
  if (!page.objects.length) throw Error('No supported SVG objects.'); return { doc: validatePublication(d), warnings: [...new Set(warnings)] };
}
export async function exportSvg(doc, page, layout, { includeProject = true } = {}) {
  const root = document.createElementNS(NS, 'svg'); root.setAttribute('xmlns', NS); root.setAttribute('width', `${doc.width}pt`); root.setAttribute('height', `${doc.height}pt`); root.setAttribute('viewBox', `0 0 ${doc.width} ${doc.height}`);
  if (includeProject) { const metadata = document.createElementNS(NS, 'metadata'); metadata.id = 'layoutsplat-document'; metadata.textContent = JSON.stringify(doc); root.append(metadata); }
  const { portableFontCss } = await import('./fonts.mjs'), fontStyle = document.createElementNS(NS, 'style'); fontStyle.textContent = await portableFontCss(doc); root.append(fontStyle);
  const defs = document.createElementNS(NS, 'defs'); root.append(defs);
  const { objectElement } = await import('./render.mjs'); const objects = [...((doc.masters || []).find(m => m.id === page.masterId)?.objects || []).filter(o => !(page.masterOverrides || []).includes(o.id)), ...page.objects];
  const holder = document.createElement('div'); Object.assign(holder.style, { position: 'fixed', left: '-30000px', top: '0', width: `${doc.width}pt`, height: `${doc.height}pt`, visibility: 'hidden' }); document.body.append(holder);
  const context = document.createElement('canvas').getContext('2d');
  try { for (const o of objects) {
    const el = objectElement(doc, o, layout); el.style.left = '0'; el.style.top = '0'; el.style.transform = 'none'; holder.replaceChildren(el); const box = el.getBoundingClientRect();
    const group = document.createElementNS(NS, 'g'); group.setAttribute('transform', `translate(${o.x} ${o.y}) rotate(${o.rotation} ${o.w / 2} ${o.h / 2})`);
    group.setAttribute('opacity', o.opacity ?? 1);
    const clipId = `clip-${uid()}`, clip = document.createElementNS(NS, 'clipPath'), rect = document.createElementNS(NS, 'rect'); clip.id = clipId; rect.setAttribute('width', o.w); rect.setAttribute('height', o.h); clip.append(rect); defs.append(clip); group.setAttribute('clip-path', `url(#${clipId})`);
    if (o.type === 'shape' || doc.stories[o.storyId]?.style.wordArt === 'curve') { const svg = el.querySelector('svg').cloneNode(true); svg.setAttribute('width', o.w); svg.setAttribute('height', o.h); group.append(svg); }
    else if (o.type === 'image') { const image = document.createElementNS(NS, 'image'); image.setAttribute('href', doc.assets[o.assetId].src); image.setAttribute('x', (o.crop?.x || 0) * o.w); image.setAttribute('y', (o.crop?.y || 0) * o.h); image.setAttribute('width', (o.crop?.w || 1) * o.w); image.setAttribute('height', (o.crop?.h || 1) * o.h); image.setAttribute('preserveAspectRatio', o.fit === 'stretch' || o.crop ? 'none' : o.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'); if (o.path && o.pathViewBox) { rect.remove(); const path = document.createElementNS(NS, 'path'), [x,y,w,h] = o.pathViewBox; path.setAttribute('d', o.path); path.setAttribute('transform', `scale(${o.w / w} ${o.h / h}) translate(${-x} ${-y})`); clip.append(path); } group.append(image); }
    else {
      if (o.type === 'table') for (const cell of el.querySelectorAll('td,th')) { const r = cell.getBoundingClientRect(), shape = document.createElementNS(NS, 'rect'); for (const [key, value] of Object.entries({ x: (r.x - box.x) * .75, y: (r.y - box.y) * .75, width: r.width * .75, height: r.height * .75, fill: cell.tagName === 'TH' ? '#ede7fb' : '#ffffff', stroke: '#b9b1cd', 'stroke-width': .75 })) shape.setAttribute(key, value); group.append(shape); }
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node;
      while ((node = walker.nextNode())) {
        const value = node.nodeValue, style = getComputedStyle(node.parentElement), font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`; context.font = font;
        const ascent = context.measureText('Hg').fontBoundingBoxAscent || parseFloat(style.fontSize) * .8, runs = []; let run;
        for (const segment of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)) {
          const range = document.createRange(); range.setStart(node, segment.index); range.setEnd(node, segment.index + segment.segment.length); const r = range.getBoundingClientRect(); if (!r.height || segment.segment === '\n') continue;
          if (!run || Math.abs(run.y - r.y) > 1) { run = { text: '', x: r.x, right: r.right, y: r.y }; runs.push(run); } run.text += segment.segment; run.x = Math.min(run.x, r.x); run.right = Math.max(run.right, r.right);
        }
        for (const run of runs) { const text = document.createElementNS(NS, 'text'); text.textContent = run.text; const attrs = { x: ((style.direction === 'rtl' ? run.right : run.x) - box.x) * .75, y: (run.y + ascent - box.y) * .75, 'font-family': style.fontFamily, 'font-size': parseFloat(style.fontSize) * .75, 'font-weight': style.fontWeight, 'font-style': style.fontStyle, fill: color(style.color), direction: style.direction, 'unicode-bidi': 'embed', 'xml:space': 'preserve', 'letter-spacing': (parseFloat(style.letterSpacing) || 0) * .75 }; if (style.textDecorationLine.includes('underline')) attrs['text-decoration'] = 'underline'; Object.entries(attrs).forEach(([key, value]) => text.setAttribute(key, value)); group.append(text); }
      }
    }
    root.append(group);
  } } finally { holder.remove(); }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
}
