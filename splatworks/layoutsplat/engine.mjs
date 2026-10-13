// LayoutSplat publication model. Geometry is always in typographic points.
export const VERSION = 1;
export const UNITS = { in: 72, cm: 72 / 2.54, pc: 12, pt: 1, px: 72 / 96 };
export const PAPER = { letter: [612, 792], a4: [595.276, 841.89], a5: [419.528, 595.276], legal: [612, 1008] };
export const uid = () => globalThis.crypto.randomUUID();
export const clone = value => structuredClone(value);
export const fromPoints = (value, unit) => value / UNITS[unit];
export const toPoints = (value, unit) => value * UNITS[unit];
export const formatMeasure = (value, unit) => Number(fromPoints(value, unit).toFixed(unit === 'pt' || unit === 'px' ? 1 : 3));
export const textStyle = () => ({ font: 'Arial', size: 12, weight: 'normal', color: '#25304b', align: 'left', direction: 'ltr', lineHeight: 1.45 });
export function frame(storyId, x, y, w, h) { return { id: uid(), type: 'text', storyId, x, y, w, h, rotation: 0, padding: 6, locked: false }; }
export function shape(x, y, w, h, fill = '#7c3aed', kind = 'rect') { return { id: uid(), type: 'shape', kind, x, y, w, h, rotation: 0, fill, stroke: fill, strokeWidth: 0, opacity: 1, locked: false }; }
export function newPublication(blank = false) {
  const doc = { app: 'LayoutSplat', version: VERSION, id: uid(), title: blank ? 'Untitled publication' : 'Our community newsletter', width: 612, height: 792, margin: 36, guides: { columns: 2, rows: 1, gap: 18, baseline: 14, vertical: [], horizontal: [] }, pages: [], stories: {}, assets: {}, createdAt: new Date().toISOString() };
  const page = { id: uid(), objects: [] }; doc.pages.push(page);
  if (blank) return doc;
  const second = { id: uid(), objects: [] }; doc.pages.push(second);
  function addText(p, text, x, y, w, h, style = {}) {
    const id = uid(), f = frame(id, x, y, w, h);
    f.padding = 0;
    doc.stories[id] = { text, style: { ...textStyle(), ...style }, frames: [f.id] }; p.objects.push(f); return f;
  }
  page.objects.push(shape(36, 36, 540, 8, '#ff9f2f'));
  addText(page, 'THE COMMUNITY EDITION', 36, 58, 540, 25, { size: 10, weight: 'bold', color: '#7c3aed' });
  addText(page, 'Small ideas.\nShared possibilities.', 36, 97, 540, 125, { size: 38, weight: 'bold', lineHeight: 1.08, color: '#34205c' });
  addText(page, 'A newsletter made together', 36, 228, 540, 32, { size: 17, color: '#7c3aed' });
  // A local SVG becomes an ordinary raster asset: no external image requests.
  const assetId = uid();
  doc.assets[assetId] = { name: 'Community illustration', width: 1080, height: 420, src: 'sample-art.svg', sample: true };
  page.objects.push({ id: uid(), type: 'image', assetId, x: 36, y: 281, w: 540, h: 210, rotation: 0, fit: 'contain', locked: false });
  const paragraph = 'A good publication gives every idea a place. Start with a clear story, leave room for the pictures, and let your readers move through the page at their own pace. This edition celebrates the people who make our community a welcoming place to learn.\n\n';
  const story = addText(page, paragraph.repeat(8), 36, 515, 261, 175, { size: 12 });
  const continuation = frame(story.storyId, 36, 117, 261, 495);
  const third = frame(story.storyId, 315, 117, 261, 495);
  continuation.padding = 0; third.padding = 0;
  doc.stories[story.storyId].frames.push(continuation.id, third.id);
  second.objects.push(shape(36, 36, 540, 8, '#ff9f2f'));
  addText(second, 'The story continues', 36, 57, 540, 43, { size: 25, weight: 'bold', color: '#34205c' });
  second.objects.push(continuation, third);
  addText(page, 'مرحباً بكم في مجتمعنا\nنصنع مساحة للأفكار والإبداع.', 315, 515, 261, 105, { size: 17, direction: 'rtl', align: 'right' });
  addText(page, 'Select any text frame to edit its story.\nLinked frames keep the words together.', 315, 636, 261, 67, { size: 10, color: '#667085' });
  [page, second].forEach((p, i) => addText(p, `COMMUNITY NEWS  /  ${i + 1}`, 36, 724, 540, 22, { size: 9, color: '#667085' }));
  return doc;
}
export function findObject(doc, id) {
  for (let pageIndex = 0; pageIndex < doc.pages.length; pageIndex++) {
    const object = doc.pages[pageIndex].objects.find(o => o.id === id);
    if (object) return { object, page: doc.pages[pageIndex], pageIndex };
  }
  return null;
}
export function guidePositions(doc, axis) {
  const size = axis === 'x' ? doc.width : doc.height;
  const count = axis === 'x' ? doc.guides.columns : doc.guides.rows;
  const span = (size - doc.margin * 2 - doc.guides.gap * (count - 1)) / count;
  const values = [0, doc.margin, size / 2, size - doc.margin, size];
  for (let i = 1; i < count; i++) {
    values.push(doc.margin + span * i + doc.guides.gap * (i - 1), doc.margin + span * i + doc.guides.gap * i);
  }
  values.push(...doc.guides[axis === 'x' ? 'vertical' : 'horizontal']);
  return values;
}
export function snapPosition(value, extent, targets, tolerance = 4) {
  let best = value, distance = tolerance + 1;
  for (const target of targets) for (const offset of [0, extent / 2, extent]) {
    const candidate = target - offset, delta = Math.abs(candidate - value);
    if (delta < distance && delta <= tolerance) { best = candidate; distance = delta; }
  }
  return best;
}
export function removeObject(doc, id) {
  const found = findObject(doc, id); if (!found) return;
  found.page.objects = found.page.objects.filter(o => o.id !== id);
  if (found.object.type === 'text') {
    const story = doc.stories[found.object.storyId]; story.frames = story.frames.filter(f => f !== id);
    if (!story.frames.length) delete doc.stories[found.object.storyId];
  }
}
export function linkFrames(doc, sourceId, targetId) {
  const source = findObject(doc, sourceId)?.object, target = findObject(doc, targetId)?.object;
  if (!source || !target || source.type !== 'text' || target.type !== 'text' || source.storyId === target.storyId) throw new Error('Choose a text frame from a different story.');
  const targetStoryId = target.storyId, a = doc.stories[source.storyId], b = doc.stories[targetStoryId];
  const separator = a.text && b.text ? '\n\n' : '';
  a.text += separator + b.text;
  a.frames.push(...b.frames);
  b.frames.forEach(id => { findObject(doc, id).object.storyId = source.storyId; });
  delete doc.stories[targetStoryId];
}
export function validatePublication(input) {
  const fail = () => { throw new Error('This is not a valid LayoutSplat version 1 publication.'); };
  if (!input || input.app !== 'LayoutSplat' || input.version !== 1) fail();
  const d = clone(input), number = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  if (typeof d.id !== 'string' || typeof d.title !== 'string' || d.title.length > 200 || !number(d.width, 72, 2000) || !number(d.height, 72, 2000) || !number(d.margin, 0, Math.min(d.width, d.height) / 2 - 1)) fail();
  if (!Array.isArray(d.pages) || !d.pages.length || d.pages.length > 50 || !d.stories || typeof d.stories !== 'object' || !d.assets || typeof d.assets !== 'object' || !d.guides) fail();
  for (const key of ['columns', 'rows']) if (!Number.isInteger(d.guides[key]) || !number(d.guides[key], 1, 12)) fail();
  if (!number(d.guides.gap, 0, 72) || !number(d.guides.baseline, 4, 72)) fail();
  if ((d.width - 2 * d.margin - d.guides.gap * (d.guides.columns - 1)) / d.guides.columns <= 0 || (d.height - 2 * d.margin - d.guides.gap * (d.guides.rows - 1)) / d.guides.rows <= 0) fail();
  for (const key of ['vertical', 'horizontal']) if (!Array.isArray(d.guides[key]) || d.guides[key].length > 100 || d.guides[key].some(v => !number(v, 0, 2000))) fail();
  const ids = new Set(), textFrames = new Set();
  for (const p of d.pages) {
    if (typeof p.id !== 'string' || ids.has(p.id) || !Array.isArray(p.objects) || p.objects.length > 200) fail(); ids.add(p.id);
    for (const o of p.objects) {
      if (typeof o.id !== 'string' || ids.has(o.id) || !['text', 'shape', 'image'].includes(o.type)) fail(); ids.add(o.id);
      if (!number(o.x, -2000, 4000) || !number(o.y, -2000, 4000) || !number(o.w, 6, 2000) || !number(o.h, 6, 2000) || !number(o.rotation, -360, 360) || typeof o.locked !== 'boolean') fail();
      if (o.type === 'text') { if (!number(o.padding, 0, 36) || !Object.hasOwn(d.stories, o.storyId)) fail(); textFrames.add(o.id); }
      if (o.type === 'shape' && (!['rect', 'ellipse', 'line'].includes(o.kind) || !/^#[0-9a-f]{6}$/i.test(o.fill) || !/^#[0-9a-f]{6}$/i.test(o.stroke) || !number(o.strokeWidth, 0, 20) || !number(o.opacity, 0, 1))) fail();
      if (o.type === 'image' && (!Object.hasOwn(d.assets, o.assetId) || !['contain', 'cover'].includes(o.fit))) fail();
    }
  }
  const used = new Set();
  if (Object.keys(d.stories).length > 2000 || Object.keys(d.assets).length > 200) fail();
  for (const [id, story] of Object.entries(d.stories)) {
    const s = story.style;
    if (typeof story.text !== 'string' || story.text.length > 100000 || !Array.isArray(story.frames) || !story.frames.length || !s) fail();
    if (!['Arial', 'Georgia', 'Verdana'].includes(s.font) || !number(s.size, 6, 120) || !['normal', 'bold'].includes(s.weight) || !/^#[0-9a-f]{6}$/i.test(s.color) || !['left', 'center', 'right', 'justify'].includes(s.align) || !['ltr', 'rtl'].includes(s.direction) || !number(s.lineHeight, 1, 3)) fail();
    for (const frameId of story.frames) { if (!textFrames.has(frameId) || used.has(frameId) || findObject(d, frameId).object.storyId !== id) fail(); used.add(frameId); }
  }
  if (used.size !== textFrames.size) fail();
  for (const a of Object.values(d.assets)) if (typeof a.name !== 'string' || !number(a.width, 1, 20000) || !number(a.height, 1, 20000) || typeof a.src !== 'string' || a.src.length > 16000000 || !(a.sample === true && a.src === 'sample-art.svg') && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(a.src)) fail();
  return d;
}
