import { frameInsets } from './engine.mjs';
import { appendRich } from './rich.mjs';
export const PT_TO_PX = 96 / 72;
const layoutCaches = new WeakMap();
let fontEpoch = 0;
globalThis.document?.fonts?.addEventListener('loadingdone', () => fontEpoch++);
const segmenter = globalThis.Intl?.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
export function applyTextStyle(element, style) {
  Object.assign(element.style, { fontFamily: style.font, fontSize: `${style.size}pt`, fontWeight: style.weight, fontStyle: style.italic ? 'italic' : 'normal', textDecoration: style.underline ? 'underline' : 'none', textShadow: 'none', webkitTextStroke: '0', color: style.color, textAlign: style.align, direction: style.direction, lineHeight: String(style.lineHeight), whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', letterSpacing: `${style.tracking || 0}pt`, display: 'flow-root' });
  if (style.wordArt === 'shadow') element.style.textShadow = '1.5pt 1.5pt 0 #c7b5e7';
  if (style.wordArt === 'outline') { element.style.webkitTextStroke = `.5pt ${style.color}`; element.style.color = 'white'; }
  element.dir = style.direction;
  element.style.fontFamily = `"${style.font}","LayoutSplat Arabic","LayoutSplat Indic","LayoutSplat CJK",sans-serif`;
  element.style.fontKerning=style.kerning||'auto';element.style.fontVariantLigatures=style.ligatures===false?'none':'common-ligatures contextual';element.style.wordSpacing=`${style.wordSpacing||0}pt`;
}
export function createMeasurer() {
  const el = document.createElement('div'); el.className = 'text-measure'; el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, { position: 'fixed', top: '-100000px', left: '0', height: 'auto', padding: '0', margin: '0', visibility: 'hidden', pointerEvents: 'none' });
  document.body.append(el); return el;
}
export function fitText(text, frame, style, measurer, story = null, offset = 0) {
  if (!text) return 0;
  const width = frame.w - frame.padding * 2, height = frame.h - frame.padding * 2;
  if (width <= 0 || !story?.paragraphs?.length && height < style.size * style.lineHeight) return 0;
  applyTextStyle(measurer, style); measurer.style.width = `${width}pt`;
  const fits = count => { measurer.replaceChildren(); if (story) appendRich(measurer, story, offset, offset + count, { first: offset === 0, style }); else measurer.textContent = text.slice(0, count); return measurer.getBoundingClientRect().height <= height * PT_TO_PX + 0.1; };
  if (fits(text.length)) return text.length;
  let lo = 0, hi = text.length;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (fits(mid)) lo = mid; else hi = mid - 1; }
  // Keep word boundaries where possible, and never split UTF-16 surrogate pairs.
  if (lo && /[\uD800-\uDBFF]/.test(text[lo - 1])) lo--;
  if (lo < text.length && !/\s/.test(text[lo] || '') && !/\s/.test(text[lo - 1] || '')) {
    const prefix = text.slice(0, lo), match = /\s+\S*$/.exec(prefix);
    if (match && match.index > 0) lo = match.index + match[0].match(/^\s+/)[0].length;
  }
  if (segmenter && lo < text.length) {
    // Avoid slicing a combining sequence (Arabic marks, emoji, Devanagari).
    let boundary = 0;
    for (const part of segmenter.segment(text.slice(0, Math.min(text.length, lo + 64)))) {
      if (part.index > lo) break; boundary = part.index;
    }
    lo = boundary;
  }
  return lo;
}
export function layoutStories(doc, measurer) {
  const fragments = new Map(), overflows = [], styles = new Map(), stats = { reflowed: 0, reused: 0 };
  let cache = layoutCaches.get(measurer); if (!cache) layoutCaches.set(measurer, cache = new Map());
  const objects = new Map([...doc.pages, ...(doc.masters || [])].flatMap(page => page.objects.map(object => [object.id, { object, page }])));
  const wraps = new Map([...doc.pages, ...(doc.masters || [])].map(page => [page, page.objects.filter(o => o.type === 'image' && o.wrap === 'square')]));
  for (const id of cache.keys()) if (!Object.hasOwn(doc.stories, id)) cache.delete(id);
  for (const [storyId, story] of Object.entries(doc.stories)) {
    // Content signatures also detect undo/redo, imported replacements, frame moves,
    // image wrap edits, and font loads. One entry per story bounds retained memory.
    const signature = JSON.stringify([fontEpoch, doc.margin, doc.guides.baseline, story, story.frames.map(id => { const f = objects.get(id); return f ? [f.object, wraps.get(f.page)] : null; })]);
    const previous = cache.get(storyId);
    if (previous?.signature === signature) {
      previous.collected.forEach(([id, fragment]) => fragments.set(id, fragment)); styles.set(storyId, previous.style);
      if (previous.overflow) overflows.push(previous.overflow); stats.reused++; continue;
    }
    stats.reflowed++;
    let offset = 0, style = { ...story.style }, collected;
    for (;;) {
      collected = []; offset = 0;
      for (const id of story.frames) {
        const found = objects.get(id), f = found?.object; if (!f) continue;
        const start = offset, columns = [], count = f.columns || 1, gap = f.columnGap ?? 12, padding = frameInsets(f);
        const width = (f.w - padding.left - padding.right - gap * (count - 1)) / count;
        let frameStyle = style, inset = 0;
        if (f.baselineAlign) {
          const leading = Math.ceil(style.size * style.lineHeight / doc.guides.baseline) * doc.guides.baseline;
          frameStyle = { ...style, lineHeight: leading / style.size };
          const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); ctx.font = `${style.italic ? 'italic ' : ''}${style.weight} ${style.size * PT_TO_PX}px "${style.font}"`;
          const metrics = ctx.measureText('Hg'), ascent = (metrics.fontBoundingBoxAscent || style.size * PT_TO_PX * .8) / PT_TO_PX, descent = (metrics.fontBoundingBoxDescent || style.size * PT_TO_PX * .2) / PT_TO_PX;
          const baseline = f.y + padding.top + (leading - ascent - descent) / 2 + ascent;
          inset = ((doc.margin - baseline) % doc.guides.baseline + doc.guides.baseline) % doc.guides.baseline;
        }
        for (let col = 0; col < count; col++) {
          const virtual = { ...f, w: width, h: f.h - padding.top - padding.bottom - inset, padding: 0 };
          const obstacles = wraps.get(found.page).filter(o => o.x < f.x + f.w && o.x + o.w > f.x && o.y < f.y + f.h && o.y + o.h > f.y);
          if (obstacles.length) { const wrapped = wrapAround(story, offset, { ...f, insets: { ...padding, top: padding.top + inset } }, col, width, gap, frameStyle, obstacles, measurer); columns.push(...wrapped.columns.map(column => ({ ...column, style: frameStyle }))); offset = wrapped.offset; continue; }
          const n = fitText(story.text.slice(offset), { ...virtual, w: virtual.w / (frameStyle.textScale || 1) }, frameStyle, measurer, story, offset);
          columns.push({ text: story.text.slice(offset, offset + n), start: offset, end: offset + n, x: padding.left + col * (width + gap), y: padding.top + inset, w: width, h: virtual.h, style: frameStyle }); offset += n;
        }
        collected.push([id, { text: story.text.slice(start, offset), start, end: offset, storyId, columns }]);
      }
      if (offset === story.text.length || style.autoFit !== 'shrink' || style.size <= (style.minSize || 8)) break;
      style.size = Math.max(style.minSize || 8, style.size - 0.5);
    }
    collected.forEach(([id, fragment]) => fragments.set(id, fragment)); styles.set(storyId, style);
    const overflow = offset < story.text.length ? { storyId, frameId: story.frames.at(-1), remaining: story.text.length - offset } : null;
    if (overflow) overflows.push(overflow);
    cache.set(storyId, { signature, collected, style, overflow });
  }
  return { fragments, overflows, styles, stats };
}
export function designFindings(doc, layout) {
  const issues = layout.overflows.map(o => ({ id: o.frameId, key: 'overflow', count: o.remaining, severity: 'error' }));
  doc.pages.forEach(p => p.objects.forEach(o => {
    if (o.x < 0 || o.y < 0 || o.x + o.w > doc.width || o.y + o.h > doc.height) issues.push({ id: o.id, key: 'outside', severity: 'error' });
    else if (o.x < doc.margin || o.y < doc.margin || o.x + o.w > doc.width - doc.margin || o.y + o.h > doc.height - doc.margin) issues.push({ id: o.id, key: 'marginIssue', severity: 'warning' });
    if (o.type === 'image') {
      const a = doc.assets[o.assetId];
      const ppi = o.fit === 'cover' ? Math.min(a.width / (o.w / 72), a.height / (o.h / 72)) : Math.max(a.width / (o.w / 72), a.height / (o.h / 72));
      if (!a.sample && ppi < 150) issues.push({ id: o.id, key: 'lowResolution', count: Math.round(ppi), severity: 'warning' });
      if (!a.alt && !a.sample) issues.push({ id: o.id, key: 'missingAlt', severity: 'warning' });
    }
    if (o.type === 'table' && o.cells.length * (o.fontSize * 1.4 + 12) > o.h) issues.push({ id: o.id, key: 'tableOverflow', severity: 'error' });
    if (o.type === 'text' && /\{\{[^{}]+\}\}/.test(doc.stories[o.storyId].text)) issues.push({ id: o.id, key: 'mergeUnresolved', severity: 'warning' });
    if (o.type === 'text' && doc.stories[o.storyId].style.dropCap && p.objects.some(i => i.type === 'image' && i.wrap === 'square')) issues.push({ id: o.id, key: 'dropCapWrap', severity: 'warning' });
  }));
  return issues;
}
function wrapAround(story, offset, frame, col, width, gap, style, obstacles, measurer) {
  const padding = frameInsets(frame), columns = [], x = padding.left + col * (width + gap), maxHeight = frame.h - padding.top - padding.bottom;
  const leading = Math.max(style.size, ...(story.marks || []).map(m => m.size || style.size)) * style.lineHeight;
  const lineStyle = { ...style, dropCap: 0 };
  for (let y = padding.top; y + leading <= padding.top + maxHeight && offset < story.text.length; y += leading) {
    let intervals = [[x, x + width]];
    for (const image of obstacles) {
      if (frame.y + y + leading <= image.y - 6 || frame.y + y >= image.y + image.h + 6) continue;
      const left = image.x - frame.x - 6, right = image.x + image.w - frame.x + 6;
      intervals = intervals.flatMap(([a, b]) => right <= a || left >= b ? [[a, b]] : [[a, Math.min(b, left)], [Math.max(a, right), b]].filter(([a, b]) => b - a >= style.size));
    }
    if (style.direction === 'rtl') intervals.reverse();
    for (const [a, b] of intervals) {
      const remaining = story.text.slice(offset), newline = remaining.indexOf('\n'), n = fitText(remaining, { w: (b - a) / (style.textScale || 1), h: leading + .2, padding: 0 }, lineStyle, measurer, { ...story, style: lineStyle }, offset);
      const consumed = newline >= 0 && newline < n ? newline + 1 : n;
      columns.push({ text: story.text.slice(offset, offset + consumed), start: offset, end: offset + consumed, x: a, y, w: b - a, h: leading + .2, noDropCap: true }); offset += consumed;
    }
  }
  return { columns, offset };
}
