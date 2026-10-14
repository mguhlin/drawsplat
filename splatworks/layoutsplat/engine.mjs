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
export const frameInsets = f => Object.fromEntries(['left','right','top','bottom'].map(edge => [edge, f.insets?.[edge] ?? f.padding ?? 0]));
export function setStoryStyle(story, key, value) {
  if (key === 'size') {
    const ratio = value / story.style.size;
    for (const mark of story.marks || []) if (mark.size) mark.size = Math.max(6, Math.min(120, mark.size * ratio));
    for (const p of story.paragraphs || []) p.leading = Math.max(6, Math.min(360, p.leading * ratio));
  }
  if (['weight','italic','underline'].includes(key)) for (const mark of story.marks || []) delete mark[key === 'weight' ? 'bold' : key];
  if (key === 'font' || key === 'color') for (const mark of story.marks || []) delete mark[key];
  if (key === 'align') for (const p of story.paragraphs || []) p.align = value;
  if (key === 'lineHeight') for (const p of story.paragraphs || []) { p.lineMultiple = value; p.leading = Math.max(6, Math.min(360, story.style.size * value)); }
  story.style[key] = value;
}
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
  for (const master of doc.masters || []) { const object = master.objects.find(o => o.id === id); if (object) return { object, page: master, pageIndex: -1, masterId: master.id }; }
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
  const offset = a.text.length + separator.length;
  if (offset + b.text.length > 100000) throw Error('Linked story exceeds 100,000 characters.');
  if (a.paragraphs?.length || b.paragraphs?.length) {
    const paragraphs = s => s.paragraphs?.length ? s.paragraphs : s.text ? [{ from: 0, to: s.text.length, leading: s.style.size * s.style.lineHeight, align: s.style.align }] : [];
    a.paragraphs = [...paragraphs(a), ...paragraphs(b).map(p => ({ ...p, from: p.from + offset, to: p.to + offset }))];
  }
  a.marks = [...(a.marks || []), ...(b.text ? [{ from: offset, to: offset + b.text.length, font: b.style.font, size: b.style.size, color: b.style.color, bold: b.style.weight === 'bold' }] : []), ...(b.marks || []).map(mark => ({ ...mark, from: mark.from + offset, to: mark.to + offset }))];
  a.text += separator + b.text;
  a.frames.push(...b.frames);
  b.frames.forEach(id => { findObject(doc, id).object.storyId = source.storyId; });
  delete doc.stories[targetStoryId];
}
export function unlinkFrame(doc, frameId, layout) {
  const object = findObject(doc, frameId)?.object; if (object?.type !== 'text') throw Error('Choose a text box.');
  const story = doc.stories[object.storyId], index = story.frames.indexOf(frameId); if (story.frames.length < 2) return;
  // Split after this box; at the end of a chain, detach the final box instead.
  const split = index === story.frames.length - 1 ? index : index + 1, preceding = story.frames[split - 1], cut = layout.fragments.get(preceding)?.end;
  if (!Number.isInteger(cut)) throw Error('Text layout is not ready.');
  if (story.frames.some(id => findObject(doc, id)?.object.locked)) throw Error('Unlock the connected text boxes before unlinking.');
  const slice = (start, end, frames) => ({ ...clone(story), text: story.text.slice(start, end), frames, marks: (story.marks || []).filter(m => m.from < end && m.to > start).map(m => ({ ...m, from: Math.max(start, m.from) - start, to: Math.min(end, m.to) - start })), ...(story.paragraphs ? { paragraphs: story.paragraphs.filter(p => p.from < end && p.to > start).map(p => ({ ...p, from: Math.max(start, p.from) - start, to: Math.min(end, p.to) - start })) } : {}) });
  const nextId = uid(), first = slice(0, cut, story.frames.slice(0, split)), next = slice(cut, story.text.length, story.frames.slice(split));
  doc.stories[object.storyId] = first; doc.stories[nextId] = next; next.frames.forEach(id => findObject(doc, id).object.storyId = nextId);
}
export function validatePublication(input) {
  const fail = () => { throw new Error('This is not a valid LayoutSplat version 1 publication.'); };
  if (!input || input.app !== 'LayoutSplat' || input.version !== 1) fail();
  const d = clone(input), number = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  if (typeof d.id !== 'string' || typeof d.title !== 'string' || d.title.length > 200 || !number(d.width, 72, 2000) || !number(d.height, 72, 2000) || !number(d.margin, 0, Math.min(d.width, d.height) / 2 - 1)) fail();
  if (!Array.isArray(d.pages) || !d.pages.length || d.pages.length > 500 || !d.stories || typeof d.stories !== 'object' || !d.assets || typeof d.assets !== 'object' || !d.guides) fail();
  for (const key of ['columns', 'rows']) if (!Number.isInteger(d.guides[key]) || !number(d.guides[key], 1, 12)) fail();
  if (!number(d.guides.gap, 0, 72) || !number(d.guides.baseline, 4, 72)) fail();
  if ((d.width - 2 * d.margin - d.guides.gap * (d.guides.columns - 1)) / d.guides.columns <= 0 || (d.height - 2 * d.margin - d.guides.gap * (d.guides.rows - 1)) / d.guides.rows <= 0) fail();
  for (const key of ['vertical', 'horizontal']) if (!Array.isArray(d.guides[key]) || d.guides[key].length > 100 || d.guides[key].some(v => !number(v, 0, 2000))) fail();
  if (d.masters !== undefined && (!Array.isArray(d.masters) || d.masters.length > 20)) fail();
  if (d.bleed !== undefined && !number(d.bleed, 0, 36)) fail();
  if (d.safeArea !== undefined && !number(d.safeArea, 0, Math.min(d.width, d.height) / 2 - 1)) fail();
  if (d.facingPages !== undefined && typeof d.facingPages !== 'boolean') fail();
  if(d.labelLayout?.stock){const l=d.labelLayout;if(typeof l.stock!=='string'||l.stock.length>40||!Number.isInteger(l.perSheet)||!number(l.perSheet,1,200)||!Number.isInteger(l.startAt)||!number(l.startAt,0,l.perSheet-1)||!number(l.offsetX,-36,36)||!number(l.offsetY,-36,36))fail();}
  if (d.rulerOrigin !== undefined && (!number(d.rulerOrigin.x, -2000, 2000) || !number(d.rulerOrigin.y, -2000, 2000))) fail();
  for (const key of ['locked', 'showHorizontal', 'showVertical']) if (d.guides[key] !== undefined && typeof d.guides[key] !== 'boolean') fail();
  const ids = new Set(), textFrames = new Set();
  for (const p of [...d.pages, ...(d.masters || [])]) {
    if (typeof p.id !== 'string' || ids.has(p.id) || !Array.isArray(p.objects) || p.objects.length > 200) fail(); ids.add(p.id);
    for (const o of p.objects) {
      if (typeof o.id !== 'string' || ids.has(o.id) || !['text', 'shape', 'image', 'table'].includes(o.type)) fail(); ids.add(o.id);
      if (!number(o.x, -2000, 4000) || !number(o.y, -2000, 4000) || !number(o.w, o.type === 'text' ? 6 : .1, 2000) || !number(o.h, o.type === 'text' ? 6 : .1, 2000) || !number(o.rotation, -360, 360) || typeof o.locked !== 'boolean') fail();
      if (o.type === 'text') { if (!number(o.padding, 0, 36) || !Object.hasOwn(d.stories, o.storyId)) fail(); textFrames.add(o.id); }
      if (o.insets !== undefined && (o.type !== 'text' || !o.insets || ['left','right','top','bottom'].some(edge => !number(o.insets[edge], 0, 36)))) fail();
      if (o.type === 'shape' && (!['rect', 'ellipse', 'line', 'triangle', 'hexagon', 'arrow', 'star', 'heart', 'callout', 'border', 'path'].includes(o.kind) || !/^#[0-9a-f]{6}$/i.test(o.fill) || !/^#[0-9a-f]{6}$/i.test(o.stroke) || !number(o.strokeWidth, 0, 20) || !number(o.opacity, 0, 1))) fail();
      if(o.strokeDash!==undefined&&(typeof o.strokeDash!=='string'||o.strokeDash.length>100||!/^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/.test(o.strokeDash)))fail();
      if (o.path !== undefined && (typeof o.path !== 'string' || o.path.length > 64000 || !/^[MmLlHhVvCcSsQqTtAaZz0-9+., eE\-\s]+$/.test(o.path))) fail();
      if (o.pathViewBox !== undefined && (!Array.isArray(o.pathViewBox) || o.pathViewBox.length !== 4 || o.pathViewBox.some(v => !number(v, -100000, 100000)) || o.pathViewBox[2] <= 0 || o.pathViewBox[3] <= 0)) fail();
      if (o.type === 'image' && (!Object.hasOwn(d.assets, o.assetId) || !['contain', 'cover', 'stretch'].includes(o.fit))) fail();
      if (o.crop !== undefined && (o.type !== 'image' || !number(o.crop.x, -40, 40) || !number(o.crop.y, -40, 40) || !number(o.crop.w, .001, 40) || !number(o.crop.h, .001, 40))) fail();
      if (o.gradient !== undefined && (o.type !== 'shape' || !number(o.gradient.angle, -360, 360) || !['linear', 'radial'].includes(o.gradient.type) || !Array.isArray(o.gradient.stops) || o.gradient.stops.length < 2 || o.gradient.stops.length > 100 || o.gradient.stops.some(s => !number(s.offset, 0, 1) || !number(s.opacity, 0, 1) || !/^#[0-9a-f]{6}$/i.test(s.color)))) fail();
      if (o.type === 'table' && (!Array.isArray(o.cells) || !o.cells.length || o.cells.length > 200 || !Array.isArray(o.cells[0]) || !o.cells[0].length || o.cells[0].length > 20 || o.cells.some(row => !Array.isArray(row) || row.length !== o.cells[0].length || row.some(cell => typeof cell !== 'string' || cell.length > 5000)) || !number(o.fontSize, 6, 36) || typeof o.header !== 'boolean')) fail();
      if (o.wrap !== undefined && !['none', 'square'].includes(o.wrap)) fail();
      if (o.opacity !== undefined && !number(o.opacity, 0, 1)) fail();
      if (o.columns !== undefined && (!Number.isInteger(o.columns) || !number(o.columns, 1, 6))) fail();
      if (o.columnGap !== undefined && !number(o.columnGap, 0, 72)) fail();
      if (o.baselineAlign !== undefined && typeof o.baselineAlign !== 'boolean') fail();
      if (o.readingOrder !== undefined && !number(o.readingOrder, 0, 10000)) fail();
      if (o.groupIds !== undefined && (!Array.isArray(o.groupIds) || o.groupIds.length > 20 || o.groupIds.some(id => typeof id !== 'string' || id.length > 64))) fail();
      if (o.type === 'text' && o.columns > 1 && (o.w - (o.insets?.left ?? o.padding) - (o.insets?.right ?? o.padding) - (o.columnGap ?? 12) * (o.columns - 1)) / o.columns < 6) fail();
    }
  }
  const used = new Set();
  if(d.customFonts!==undefined){if(!d.customFonts||Array.isArray(d.customFonts)||typeof d.customFonts!=='object'||Object.keys(d.customFonts).length>16)fail();let bytes=0;for(const[id,f]of Object.entries(d.customFonts)){if(!/^LayoutSplatFont-[0-9a-f-]{36}$/i.test(id)||!f||typeof f.name!=='string'||f.name.length>200||typeof f.family!=='string'||f.family.length>200||!['serif','sans-serif'].includes(f.category)||!['ttf','otf','woff','woff2'].includes(f.format)||!number(f.weight,100,900)||typeof f.italic!=='boolean'||typeof f.src!=='string'||f.src.length>22000000||!new RegExp(`^data:font/${f.format};base64,[A-Za-z0-9+/=]+$`).test(f.src))fail();bytes+=f.src.length;}if(bytes>88000000)fail();}
  const validFont=name=>['Arial','Georgia','Verdana'].includes(name)||Object.hasOwn(d.customFonts||{},name);
  if (Object.keys(d.stories).length > 50000 || Object.keys(d.assets).length > 500) fail();
  for (const [id, story] of Object.entries(d.stories)) {
    const s = story.style;
    if (typeof story.text !== 'string' || story.text.length > 100000 || !Array.isArray(story.frames) || !story.frames.length || !s) fail();
    if (!validFont(s.font) || !number(s.size, 6, 120) || !['normal', 'bold'].includes(s.weight) || !/^#[0-9a-f]{6}$/i.test(s.color) || !['left', 'center', 'right', 'justify'].includes(s.align) || !['ltr', 'rtl'].includes(s.direction) || !number(s.lineHeight, 1, 3)) fail();
    for (const frameId of story.frames) { if (!textFrames.has(frameId) || used.has(frameId) || findObject(d, frameId).object.storyId !== id) fail(); used.add(frameId); }
    if (story.marks !== undefined) {
      if (!Array.isArray(story.marks) || story.marks.length > 10000) fail();
      for (const mark of story.marks) {
        if (!Number.isInteger(mark.from) || !Number.isInteger(mark.to) || mark.from < 0 || mark.to > story.text.length || mark.to <= mark.from) fail();
        if (mark.color !== undefined && !/^#[0-9a-f]{6}$/i.test(mark.color)) fail();
        if (mark.size !== undefined && !number(mark.size, 6, 120)) fail();
        if (mark.font !== undefined && !validFont(mark.font)) fail();
        if (mark.tracking !== undefined && !number(mark.tracking, -12, 10)) fail();
        if (mark.link !== undefined && (typeof mark.link !== 'string' || mark.link.length > 2000 || !/^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(mark.link))) fail();
        for (const key of ['bold', 'italic', 'underline']) if (mark[key] !== undefined && typeof mark[key] !== 'boolean') fail();
      }
    }
    if (s.dropCap !== undefined && (!Number.isInteger(s.dropCap) || !number(s.dropCap, 0, 5))) fail();
    if (s.autoFit !== undefined && !['none', 'shrink', 'grow'].includes(s.autoFit)) fail();
    if (s.minSize !== undefined && !number(s.minSize, 6, 120)) fail();
    if (s.tracking !== undefined && !number(s.tracking, -12, 10)) fail();
    if (s.textScale !== undefined && !number(s.textScale, .5, 2)) fail();
    if(s.kerning!==undefined&&!['auto','normal','none'].includes(s.kerning))fail();
    if(s.wordSpacing!==undefined&&!number(s.wordSpacing,-5,30))fail();
    if(s.ligatures!==undefined&&typeof s.ligatures!=='boolean')fail();
    if (story.paragraphs !== undefined) {
      if (!Array.isArray(story.paragraphs) || story.paragraphs.length > 10000) fail();
      let last = 0;
      for (const p of story.paragraphs) {
        if (!Number.isInteger(p.from) || !Number.isInteger(p.to) || p.from < last || p.to < p.from || p.to > story.text.length || !number(p.leading, 6, 360) || !['left', 'center', 'right', 'justify'].includes(p.align)) fail();
        for (const key of ['spaceBefore','spaceAfter','indentLeft','indentRight']) if (p[key] !== undefined && !number(p[key], 0, 360)) fail();
        if (p.firstLineIndent !== undefined && !number(p.firstLineIndent, -360, 360)) fail();
        if (p.lineMultiple !== undefined && !number(p.lineMultiple, .5, 6)) fail();
        last = p.to;
      }
    }
    if (s.wordArt !== undefined && !['none', 'shadow', 'outline', 'curve'].includes(s.wordArt)) fail();
    for (const key of ['italic', 'underline']) if (s[key] !== undefined && typeof s[key] !== 'boolean') fail();
  }
  if (used.size !== textFrames.size) fail();
  for(const key of ['originalPublisher','originalQuark'])if (d[key] && (typeof d[key].name !== 'string' || d[key].name.length > 200 || typeof d[key].src !== 'string' || d[key].src.length > 44000000 || !/^data:application\/octet-stream;base64,[A-Za-z0-9+/=]+$/.test(d[key].src))) fail();
  for (const p of d.pages) {
    if (p.masterId && !(d.masters || []).some(m => m.id === p.masterId)) fail();
    if (p.masterOverrides !== undefined && (!Array.isArray(p.masterOverrides) || p.masterOverrides.length > 200 || p.masterOverrides.some(id => typeof id !== 'string'))) fail();
  }
  for (const a of Object.values(d.assets)) {
    if (typeof a.name !== 'string' || a.name.length > 2000 || a.alt !== undefined && (typeof a.alt !== 'string' || a.alt.length > 2000) || !number(a.width, 1, 20000) || !number(a.height, 1, 20000) || typeof a.src !== 'string' || a.src.length > 64000000 || !(a.sample === true && ['sample-art.svg', 'splatworks-logo.png'].includes(a.src)) && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(a.src)) fail();
    if (a.media) {
      const m = a.media, types = m.kind === 'video' ? ['video/mp4', 'video/webm', 'video/ogg'] : m.kind === 'animation' ? ['image/gif', 'image/apng', 'image/png', 'image/webp'] : [];
      if (!types.includes(m.mime) || typeof m.src !== 'string' || m.src.length > 128000000 || !m.src.startsWith(`data:${m.mime};base64,`) || !/^[A-Za-z0-9+/=]+$/.test(m.src.slice(m.src.indexOf(',') + 1))) fail();
      if (m.duration !== undefined && !number(m.duration, 0, 86400)) fail();
    }
  }
  return d;
}
