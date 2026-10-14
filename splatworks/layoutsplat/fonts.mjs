import { readData } from './media.mjs';
const cache = new Map();
export function requiredFonts(doc) {
  const families = new Set(Object.values(doc.stories).flatMap(s => [s.style.font, ...(s.marks || []).map(m => m.font).filter(Boolean)]));
  if (doc.pages.some(p => p.objects.some(o => o.type === 'table'))) families.add('Arial');
  const text = Object.values(doc.stories).map(s => s.text).join('') + doc.pages.flatMap(p => p.objects.filter(o => o.type === 'table').flatMap(o => o.cells.flat())).join('');
  if (/[\u0600-\u08ff]/.test(text)) families.add('LayoutSplat Arabic'); if (/[\u0900-\u097f]/.test(text)) families.add('LayoutSplat Indic'); if (/[\u2e80-\u9fff\uf900-\ufaff]/.test(text)) families.add('LayoutSplat CJK'); return families;
}
export async function portableFontCss(doc) {
  const response = await fetch('fonts/fonts.css'); if (!response.ok) throw Error('Portable fonts could not load.'); const css = await response.text(), families = requiredFonts(doc), faces = [...css.matchAll(/@font-face\{[^}]+\}/g)].map(m => m[0]).filter(face => families.has(/font-family:"([^"]+)"/.exec(face)?.[1]));
  const embedded = [];
  for (const face of faces) { const path = /url\("([^"]+)"\)/.exec(face)?.[1]; if (!cache.has(path)) cache.set(path, fetch(`fonts/${path}`).then(async r => { if (!r.ok) throw Error(`Missing portable font ${path}`); return readData(await r.blob()); })); embedded.push(face.replace(`url("${path}")`, `url("${await cache.get(path)}")`)); }
  return '/* Redistributable Liberation, DejaVu, and Noto fonts. Licenses accompany LayoutSplat Pack and Go. */\n' + embedded.join('\n');
}
export async function portableHtml(html, doc) { return html.replace('</head>', `<style>${await portableFontCss(doc)}</style></head>`); }
