import { findObject } from './engine.mjs';
export const PT_TO_PX = 96 / 72;
export function applyTextStyle(element, style) {
  Object.assign(element.style, { fontFamily: style.font, fontSize: `${style.size}pt`, fontWeight: style.weight, color: style.color, textAlign: style.align, direction: style.direction, lineHeight: String(style.lineHeight), whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
  element.dir = style.direction;
}
export function createMeasurer() {
  const el = document.createElement('div'); el.className = 'text-measure'; el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, { position: 'fixed', top: '-100000px', left: '0', height: 'auto', padding: '0', margin: '0', visibility: 'hidden', pointerEvents: 'none' });
  document.body.append(el); return el;
}
export function fitText(text, frame, style, measurer) {
  if (!text) return 0;
  const width = frame.w - frame.padding * 2, height = frame.h - frame.padding * 2;
  if (width <= 0 || height < style.size * style.lineHeight) return 0;
  applyTextStyle(measurer, style); measurer.style.width = `${width}pt`;
  const fits = count => { measurer.textContent = text.slice(0, count); return measurer.getBoundingClientRect().height <= height * PT_TO_PX + 0.1; };
  if (fits(text.length)) return text.length;
  let lo = 0, hi = text.length;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (fits(mid)) lo = mid; else hi = mid - 1; }
  // Keep word boundaries where possible, and never split UTF-16 surrogate pairs.
  if (lo && /[\uD800-\uDBFF]/.test(text[lo - 1])) lo--;
  if (lo < text.length && !/\s/.test(text[lo] || '') && !/\s/.test(text[lo - 1] || '')) {
    const prefix = text.slice(0, lo), match = /\s+\S*$/.exec(prefix);
    if (match && match.index > 0) lo = match.index + match[0].match(/^\s+/)[0].length;
  }
  if (globalThis.Intl?.Segmenter && lo < text.length) {
    // Avoid slicing a combining sequence (Arabic marks, emoji, Devanagari).
    let boundary = 0;
    for (const part of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text.slice(0, Math.min(text.length, lo + 64)))) {
      if (part.index > lo) break; boundary = part.index;
    }
    lo = boundary;
  }
  return lo;
}
export function layoutStories(doc, measurer) {
  const fragments = new Map(), overflows = [];
  for (const [storyId, story] of Object.entries(doc.stories)) {
    let offset = 0;
    for (const id of story.frames) {
      const f = findObject(doc, id)?.object; if (!f) continue;
      const count = fitText(story.text.slice(offset), f, story.style, measurer);
      fragments.set(id, { text: story.text.slice(offset, offset + count), start: offset, end: offset + count, storyId }); offset += count;
    }
    if (offset < story.text.length) overflows.push({ storyId, frameId: story.frames.at(-1), remaining: story.text.length - offset });
  }
  return { fragments, overflows };
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
    }
  }));
  return issues;
}
