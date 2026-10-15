// Neutral, point-based objects shared by the native PPTX and ODP writers.
import { fontName } from './local-fonts.mjs';
export const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export const number = value => Number(Number(value || 0).toFixed(6));
export const nativeFont = (doc, id) => ({ Arial: 'Liberation Sans', Georgia: 'Liberation Serif', Verdana: 'DejaVu Sans' }[id] || fontName(doc, id));
export function paragraphs(doc, story, start, end, style) {
  let offset = 0;
  const source = story.paragraphs?.length ? story.paragraphs : story.text.split('\n').map(text => { const p = { from: offset, to: offset + text.length }; offset += text.length + 1; return p; });
  const scale = style.size / story.style.size;
  const base = { font: nativeFont(doc, style.font), size: style.size, color: style.color, bold: style.weight === 'bold' || Number(style.weight) >= 600, italic: !!style.italic, underline: !!style.underline, tracking: style.tracking || 0 };
  const result = [];
  for (const p of source) {
    if (!(p.from < end && p.to >= start || p.from === p.to && p.from >= start && p.from < end || start === end && p.from === start)) continue;
    const from = Math.max(start, p.from), to = Math.min(end, p.to); if (to < from) continue;
    const ranges = (story.marks || []).filter(m => m.from < to && m.to > from);
    const edges = [...new Set([from, to, ...ranges.flatMap(m => [Math.max(from, m.from), Math.min(to, m.to)])])].sort((a, b) => a - b);
    const runs = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const a = edges[i], b = edges[i + 1], attrs = Object.assign({}, ...ranges.filter(m => m.from <= a && m.to >= b));
      runs.push({ text: story.text.slice(a, b), style: { ...base, ...attrs, font: nativeFont(doc, attrs.font || style.font), size: attrs.size ? attrs.size * scale : style.size, tracking: attrs.tracking !== undefined ? attrs.tracking * scale : base.tracking } });
    }
    result.push({ runs, style: base, align: p.align || style.align || 'left', direction: style.direction || 'ltr', lineMultiple: p.lineMultiple || (!p.leading ? style.lineHeight : null), leading: (p.leading || style.size * style.lineHeight / scale) * scale, spaceBefore: from === p.from ? (p.spaceBefore || 0) * scale : 0, spaceAfter: to === p.to ? (p.spaceAfter || 0) * scale : 0, indentLeft: (p.indentLeft || 0) * scale, indentRight: (p.indentRight || 0) * scale, firstLineIndent: from === p.from ? (p.firstLineIndent || 0) * scale : 0 });
  }
  return result.length ? result : [{ runs: [], style: base, align: style.align || 'left', direction: style.direction || 'ltr', lineMultiple: style.lineHeight || 1.45 }];
}
export function shapePath(o) {
  if (o.path) return o.path;
  const { w, h } = o;
  const paths = { triangle: `M${w / 2} 0L${w} ${h}H0Z`, arrow: `M0 ${h * .3}H${w * .6}V0L${w} ${h / 2}L${w * .6} ${h}V${h * .7}H0Z`, heart: `M${w / 2} ${h}C${-w * .3} ${h * .4} 0 ${-h * .2} ${w / 2} ${h * .25}C${w} ${-h * .2} ${w * 1.3} ${h * .4} ${w / 2} ${h}Z`, callout: `M0 0H${w}V${h * .75}H${w * .4}L${w * .2} ${h}V${h * .75}H0Z`, hexagon: `M${w * .25} 0H${w * .75}L${w} ${h / 2}L${w * .75} ${h}H${w * .25}L0 ${h / 2}Z` };
  if (o.kind === 'star') return Array.from({ length: 10 }, (_, i) => { const a = Math.PI * i / 5 - Math.PI / 2, r = i % 2 ? .22 : .5; return `${i ? 'L' : 'M'}${w / 2 + Math.cos(a) * w * r} ${h / 2 + Math.sin(a) * h * r}`; }).join('') + 'Z';
  return paths[o.kind];
}
function columnGeometry(o, column, bleed) {
  const angle = o.rotation * Math.PI / 180, dx = column.x + column.w / 2 - o.w / 2, dy = column.y + column.h / 2 - o.h / 2;
  return { x: o.x + o.w / 2 + dx * Math.cos(angle) - dy * Math.sin(angle) - column.w / 2 + bleed, y: o.y + o.h / 2 + dx * Math.sin(angle) + dy * Math.cos(angle) - column.h / 2 + bleed, w: column.w, h: column.h };
}
export function pageObjects(doc, page, layout, bleed, warn) {
  const master = doc.masters?.find(m => m.id === page.masterId);
  const objects = [...(master?.objects || []).filter(o => !page.masterOverrides?.includes(o.id)), ...page.objects];
  if (master) warn('Master artwork is copied as editable slide objects, rather than linked office master artwork.');
  const result = [];
  for (const o of objects) {
    const common = { ...o, x: o.x + bleed, y: o.y + bleed, opacity: o.opacity ?? 1, name: `${o.type} ${o.id}` };
    if (o.groupIds?.length) warn('Grouped objects retain their stacking and positions as individual editable objects.');
    if (o.type === 'text') {
      const story = doc.stories[o.storyId], fragment = layout.fragments.get(o.id), style = layout.styles?.get(o.storyId) || story.style;
      if (style.wordArt && style.wordArt !== 'none' || style.dropCap) warn('WordArt and drop caps become ordinary editable text; decorative effects are not reproduced.');
      if (style.textScale && style.textScale !== 1 || style.wordSpacing || style.kerning === 'none' || style.ligatures === false) warn('Advanced character scaling, word spacing, kerning and ligature controls may differ in office applications.');
      for (const [i, column] of (fragment?.columns || [{ start: fragment?.start || 0, end: fragment?.end || 0, x: o.padding, y: o.padding, w: o.w - 2 * o.padding, h: o.h - 2 * o.padding }]).entries()) {
        result.push({ ...common, ...columnGeometry(o, column, bleed), name: `${common.name} column ${i + 1}`, paragraphs: paragraphs(doc, story, column.start, column.end, column.style || style) });
      }
    } else if (o.type === 'image') {
      const asset = doc.assets[o.assetId];
      if (asset.media) warn('Embedded animations and videos use editable poster pictures. Use HTML for playback.');
      result.push({ ...common, asset });
    } else if (o.type === 'shape') result.push({ ...common, path: shapePath(o), pathViewBox: o.pathViewBox || [0, 0, o.w, o.h] });
    else if (o.type === 'table') result.push(common);
  }
  return result;
}
export function pictureGeometry(o) {
  const { width, height } = o.asset;
  if (o.crop) {
    const { x, y, w, h } = o.crop;
    return { ...o, crop: { l: -x / w, t: -y / h, r: 1 - (1 - x) / w, b: 1 - (1 - y) / h } };
  }
  if (o.fit === 'stretch') return { ...o, crop: null };
  const scale = (o.fit === 'cover' ? Math.max : Math.min)(o.w / width, o.h / height), w = width * scale, h = height * scale;
  return o.fit === 'cover' ? { ...o, crop: { l: (w - o.w) / (2 * w), r: (w - o.w) / (2 * w), t: (h - o.h) / (2 * h), b: (h - o.h) / (2 * h) } } : { ...o, x: o.x + (o.w - w) / 2, y: o.y + (o.h - h) / 2, w, h, crop: null };
}
