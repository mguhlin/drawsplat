import { UNITS, PAPER, uid, clone, newPublication, frame, shape, textStyle, findObject, guidePositions, snapPosition, removeObject, linkFrames, validatePublication, formatMeasure, toPoints } from './engine.mjs';
import { createMeasurer, layoutStories, designFindings, PT_TO_PX } from './layout.mjs';
import { objectElement, publicationPage, exportHtml } from './render.mjs';
import { consumeTransferredFile, routeFileToApp, workspaceStorage, isTransferredWorkspace } from '../shared/file-bridge.js';
const $ = id => document.getElementById(id), t = (key, vars) => window.WidgetI18n.t(key, vars);
const STORE = 'layoutsplat.autosave.v1', BACKUP = 'layoutsplat.recovery.v1';
let doc, activePage = 0, selected = null, linking = null, unit = 'in', zoom = 0.55, baseline = false, preview = false, lastStatus = 'savedLocal', statusVars;
let undoStack = [], redoStack = [], saveTimer, pointer, editingStoryId, lastSaved, unsaved = false;
const measurer = createMeasurer(); let layout, issues;
const printStyle = document.createElement('style'); document.head.append(printStyle);
const page = () => doc.pages[activePage], selectedObject = () => findObject(doc, selected)?.object;
function status(key, vars) { lastStatus = key; statusVars = vars; $('statusText').textContent = t(key, vars); }
function checkpoint(snapshot = doc) { undoStack.push(clone(snapshot)); if (undoStack.length > 40) undoStack.shift(); redoStack = []; }
function remember() {
  unsaved = true; clearTimeout(saveTimer); saveTimer = setTimeout(saveLocal, 250);
}
function saveLocal() {
  try {
    const storage = workspaceStorage(), json = JSON.stringify(doc);
    if (lastSaved) storage.setItem(BACKUP, lastSaved);
    storage.setItem(STORE, json); lastSaved = json; unsaved = false;
    status(isTransferredWorkspace() ? 'isolatedDraft' : 'savedLocal');
  } catch { status('storageUnavailable'); }
}
function mutate(fn) { checkpoint(); fn(); render(); remember(); }
function label(object) {
  if (object.type === 'text') return doc.stories[object.storyId].text.replace(/\s+/g, ' ').slice(0, 30) || t('textFrame');
  if (object.type === 'image') return doc.assets[object.assetId].name;
  return t(object.kind === 'rect' ? 'rectangle' : object.kind);
}
function select(id) {
  if (linking && id) {
    try { mutate(() => linkFrames(doc, linking, id)); linking = null; } catch { status('linkError'); }
  }
  selected = id; render();
}
function paintSelection() {
  $('pageSurface').querySelectorAll('.object').forEach(el => {
    const active = el.dataset.objectId === selected; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', String(active));
    el.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
    if (active && !selectedObject().locked) { const handle = document.createElement('div'); handle.className = 'resize-handle'; handle.setAttribute('aria-hidden', 'true'); el.append(handle); }
  });
  renderProperties(); renderLayers();
}
function render() {
  layout = layoutStories(doc, measurer); issues = designFindings(doc, layout);
  $('publicationTitle').value = doc.title; document.title = `${doc.title} · LayoutSplat™`;
  $('pageLabel').textContent = t('pageNumber', { page: activePage + 1, total: doc.pages.length });
  $('undoBtn').disabled = !undoStack.length; $('redoBtn').disabled = !redoStack.length;
  $('linkHint').hidden = !linking; $('linkBtn').classList.toggle('primary', !!linking);
  renderPage(); renderThumbnails(); renderProperties(); renderLayers(); renderChecker(); renderOutput();
  $('statusText').textContent = t(lastStatus, statusVars); window.WidgetI18n.refresh();
}
function renderPage() {
  const surface = $('pageSurface'), wrap = $('sheetWrap'); surface.replaceChildren();
  if ($('zoomSelect').value === 'fit') zoom = Math.max(0.1, Math.min(1, ($('canvasScroll').clientWidth - 56) / (doc.width * PT_TO_PX), ($('canvasScroll').clientHeight - 75) / (doc.height * PT_TO_PX)));
  Object.assign(surface.style, { width: `${doc.width}pt`, height: `${doc.height}pt`, transform: `scale(${zoom})` });
  Object.assign(wrap.style, { width: `${doc.width * PT_TO_PX * zoom}px`, height: `${doc.height * PT_TO_PX * zoom}px` });
  page().objects.forEach(object => {
    const el = objectElement(doc, object, layout); el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', label(object)); el.setAttribute('aria-pressed', String(selected === object.id));
    if (selected === object.id) {
      el.classList.add('selected');
      if (!object.locked) { const handle = document.createElement('div'); handle.className = 'resize-handle'; handle.setAttribute('aria-hidden', 'true'); el.append(handle); }
    }
    if (object.type === 'text') {
      const story = doc.stories[object.storyId], overflow = layout.overflows.some(o => o.frameId === object.id);
      if (story.frames.length > 1 || overflow) {
        const marker = document.createElement('span'); marker.className = 'flow-marker' + (overflow ? ' overflow' : ''); marker.textContent = overflow ? '+' : '↪'; marker.title = t(overflow ? 'continueStory' : 'editStory'); marker.setAttribute('aria-hidden', 'true'); el.append(marker);
      }
    }
    surface.append(el);
  });
  if ($('guidesToggle').checked) renderGuides(surface);
  renderRulers();
}
function renderGuides(surface) {
  function guide(axis, position, kind = '') {
    const el = document.createElement('div'); el.className = `guide guide-${axis} ${kind}`;
    el.style[axis === 'x' ? 'left' : 'top'] = `${position}pt`;
    if (kind === 'custom') { el.dataset.guideAxis = axis; el.dataset.guidePosition = position; el.title = t('helpRulers'); }
    surface.append(el);
  }
  for (const axis of ['x', 'y']) {
    const custom = doc.guides[axis === 'x' ? 'vertical' : 'horizontal'];
    guidePositions(doc, axis).filter(v => v !== 0 && v !== (axis === 'x' ? doc.width : doc.height) && !custom.includes(v)).forEach(v => guide(axis, v));
    custom.forEach(v => guide(axis, v, 'custom'));
  }
  if (baseline) for (let y = doc.margin; y <= doc.height - doc.margin; y += doc.guides.baseline) guide('y', y, 'baseline');
}
function renderRulers() {
  const base = { in: 0.25, cm: 0.5, pc: 1, pt: 12, px: 20 }[unit];
  for (const axis of ['x', 'y']) {
    const size = axis === 'x' ? doc.width : doc.height, el = $(axis === 'x' ? 'rulerH' : 'rulerV'); el.replaceChildren();
    el.style[axis === 'x' ? 'width' : 'height'] = `${size * PT_TO_PX * zoom}px`;
    const step = base * UNITS[unit];
    for (let i = 0, pos = 0; pos <= size; i++, pos = i * step) {
      const major = i % 4 === 0, tick = document.createElement('i'); tick.className = 'tick' + (major ? ' major' : ''); tick.style[axis === 'x' ? 'left' : 'top'] = `${pos * PT_TO_PX * zoom}px`; el.append(tick);
      if (major) { const number = document.createElement('span'); number.textContent = formatMeasure(pos, unit); number.style[axis === 'x' ? 'left' : 'top'] = `${pos * PT_TO_PX * zoom + 2}px`; el.append(number); }
    }
  }
}
function renderThumbnails() {
  $('pageList').replaceChildren(); const width = innerWidth <= 780 ? 55 : innerWidth <= 1080 ? 98 : 126;
  doc.pages.forEach((p, index) => {
    const button = document.createElement('button'); button.className = 'page-thumb' + (index === activePage ? ' active' : ''); button.dataset.page = index; button.setAttribute('aria-label', t('pageNumber', { page: index + 1, total: doc.pages.length })); button.setAttribute('aria-current', index === activePage ? 'page' : 'false');
    const holder = document.createElement('div'); holder.className = 'thumb-sheet'; holder.style.width = `${width}px`; holder.style.height = `${width * doc.height / doc.width}px`;
    const thumb = publicationPage(doc, p, layout); thumb.classList.add('thumb-page'); thumb.style.transform = `scale(${width / (doc.width * PT_TO_PX)})`; thumb.setAttribute('aria-hidden', 'true'); holder.append(thumb);
    const name = document.createElement('span'); name.textContent = index + 1; button.append(holder, name); $('pageList').append(button);
  });
}
function renderProperties() {
  const o = selectedObject(); $('emptySelection').hidden = !!o; $('objectProperties').hidden = !o; $('objectType').textContent = o ? t(o.type === 'text' ? 'textFrame' : o.type === 'image' ? 'picture' : o.kind === 'rect' ? 'rectangle' : o.kind) : '';
  $('editStoryBtn').disabled = !o || o.type !== 'text'; $('linkBtn').disabled = !o || o.type !== 'text' || o.locked;
  if (!o) return;
  for (const [id, key] of [['propX', 'x'], ['propY', 'y'], ['propW', 'w'], ['propH', 'h']]) { $(id).value = formatMeasure(o[key], unit); $(id).disabled = o.locked; }
  $('propRotation').value = o.rotation; $('propRotation').disabled = o.locked; $('propLocked').checked = o.locked;
  $('textProperties').hidden = o.type !== 'text'; $('shapeProperties').hidden = o.type !== 'shape'; $('imageProperties').hidden = o.type !== 'image';
  if (o.type === 'text') {
    const story = doc.stories[o.storyId], s = story.style;
    $('propFont').value = s.font; $('propFontSize').value = s.size; $('propBold').checked = s.weight === 'bold'; $('propTextColor').value = s.color; $('propLineHeight').value = s.lineHeight; $('propAlign').value = s.align; $('propDirection').value = s.direction;
    $('storyInfo').textContent = t('linkedInfo', { count: story.frames.length });
  } else if (o.type === 'shape') { $('propFill').value = o.fill; $('propOpacity').value = o.opacity; }
  else { $('propFit').value = o.fit; const a = doc.assets[o.assetId]; $('imageInfo').textContent = `${a.width} × ${a.height} px`; }
  $('objectProperties').querySelectorAll('button').forEach(button => { button.disabled = o.locked; });
}
function renderLayers() {
  $('layerList').replaceChildren(); [...page().objects].reverse().forEach(o => { const button = document.createElement('button'); button.className = 'layer-btn' + (selected === o.id ? ' active' : ''); button.dataset.selectObject = o.id; button.textContent = (o.locked ? '▣ ' : '') + label(o); $('layerList').append(button); });
}
function renderChecker() {
  $('issueCount').textContent = issues.length; $('checkerResults').replaceChildren();
  if (!issues.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = t('noIssues'); $('checkerResults').append(p); }
  issues.forEach(issue => { const button = document.createElement('button'); button.className = `finding ${issue.severity}`; button.dataset.selectObject = issue.id; button.textContent = t(issue.key, { count: issue.count }); $('checkerResults').append(button); });
  const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = t('checkScope'); $('checkerResults').append(hint);
}
function renderOutput() {
  printStyle.textContent = `@page{size:${doc.width}pt ${doc.height}pt;margin:0}`;
  $('printPages').replaceChildren(...doc.pages.map(p => publicationPage(doc, p, layout)));
  if (preview) $('previewPages').replaceChildren(...doc.pages.map(p => publicationPage(doc, p, layout)));
}
function addObject(object) {
  if (page().objects.length >= 200) { status('pageLimit'); return; }
  mutate(() => { page().objects.push(object); selected = object.id; });
}
function editStory() {
  const o = selectedObject(); if (!o || o.type !== 'text') return;
  if (o.locked) { status('lockedNotice'); return; }
  editingStoryId = o.storyId; $('storyText').value = doc.stories[o.storyId].text; $('storyText').dir = doc.stories[o.storyId].style.direction; $('storyDialog').showModal(); $('storyText').focus();
}
function continueStory() {
  const o = selectedObject(); if (!o || o.type !== 'text' || o.locked) return;
  const story = doc.stories[o.storyId], last = findObject(doc, story.frames.at(-1));
  if (last.pageIndex === doc.pages.length - 1 && doc.pages.length >= 50) { status('pageLimit'); return; }
  if (doc.pages[last.pageIndex + 1]?.objects.length >= 200) { status('pageLimit'); return; }
  mutate(() => {
    if (!doc.pages[last.pageIndex + 1]) doc.pages.push({ id: uid(), objects: [] });
    activePage = last.pageIndex + 1; const next = frame(o.storyId, doc.margin, doc.margin, Math.min(last.object.w, doc.width - 2 * doc.margin), doc.height - 2 * doc.margin);
    story.frames.push(next.id); page().objects.push(next); selected = next.id;
  });
}
async function rasterSample(publication) {
  for (const asset of Object.values(publication.assets)) if (asset.src === 'sample-art.svg') {
    const image = new Image(); image.src = 'sample-art.svg'; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; canvas.getContext('2d').drawImage(image, 0, 0); asset.src = canvas.toDataURL('image/png');
  }
}
function download(blob, extension) {
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = (doc.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'publication') + extension; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function saveProject() {
  try {
    const zip = new window.JSZip(); zip.file('publication.json', JSON.stringify(doc, null, 2)); zip.file('README.txt', 'LayoutSplat version 1 publication. Open this .layoutsplat file in LayoutSplat.\nImages are embedded in publication.json. Font appearance follows fonts installed on the viewing computer.\n');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }); download(blob, '.layoutsplat'); status('savedProject');
  } catch { status('saveFailed'); }
}
async function parseProject(file) {
  if (file.size > 20000000) throw new Error('size');
  let text;
  if (/\.layoutsplat$/i.test(file.name)) {
    const zip = await window.JSZip.loadAsync(file), entry = zip.file('publication.json');
    if (!entry || entry._data?.uncompressedSize > 24000000) throw new Error('archive'); text = await entry.async('string');
  } else text = await file.text();
  if (text.length > 24000000) throw new Error('size');
  const result = validatePublication(JSON.parse(text)); await rasterSample(result); return result;
}
async function openProject(file, transferred = false) {
  try {
    if (!transferred && await routeFileToApp(file, 'layoutsplat')) return;
    const next = await parseProject(file);
    if (!transferred && !confirm(t('replaceConfirm'))) return;
    checkpoint(); doc = next; activePage = 0; selected = null; linking = null; render(); remember(); status(transferred ? 'isolatedDraft' : 'opened');
  } catch (error) { console.warn('LayoutSplat import:', error.message); status('invalidProject'); }
}
async function importPicture(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8000000 || page().objects.length >= 200) { status('imageError'); return; }
  try {
    const src = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    const image = new Image(); image.src = src; await image.decode();
    if (image.naturalWidth > 20000 || image.naturalHeight > 20000 || !image.naturalWidth) throw new Error('image');
    mutate(() => { const assetId = uid(); doc.assets[assetId] = { name: file.name, width: image.naturalWidth, height: image.naturalHeight, src }; const w = Math.min(300, doc.width - doc.margin * 2), h = Math.max(6, Math.min(doc.height - doc.margin * 2, w * image.naturalHeight / image.naturalWidth)); const o = { id: uid(), type: 'image', assetId, x: doc.margin, y: doc.margin, w, h, rotation: 0, fit: 'contain', locked: false }; page().objects.push(o); selected = o.id; });
  } catch { status('imageError'); }
}
function duplicatePage() {
  if (doc.pages.length >= 50) { status('pageLimit'); return; }
  mutate(() => {
    const copy = clone(page()); copy.id = uid(); const stories = new Map();
    copy.objects.forEach(o => {
      o.id = uid(); if (o.type === 'text') {
        const original = doc.stories[o.storyId], old = o.storyId;
        if (!stories.has(old)) { const storyId = uid(); stories.set(old, storyId); doc.stories[storyId] = { text: original.text, style: clone(original.style), frames: [] }; }
        o.storyId = stories.get(old); doc.stories[o.storyId].frames.push(o.id);
      }
    });
    doc.pages.splice(activePage + 1, 0, copy); activePage++; selected = null;
  });
}
function openSetup() {
  const dimensions = [Math.min(doc.width, doc.height), Math.max(doc.width, doc.height)];
  $('paperSize').value = Object.keys(PAPER).find(key => PAPER[key].every((n, i) => Math.abs(n - dimensions[i]) < 1)) || 'letter';
  $('landscape').checked = doc.width > doc.height; $('pageMargin').value = doc.margin; $('guideColumns').value = doc.guides.columns; $('guideRows').value = doc.guides.rows; $('guideGap').value = doc.guides.gap; $('guideBaseline').value = doc.guides.baseline; $('baselineToggle').checked = baseline; $('setupDialog').showModal();
}
async function action(name) {
  const o = selectedObject();
  if (['deleteObject', 'duplicateObject', 'front', 'back', 'continue', 'link'].includes(name) && o?.locked) { status('lockedNotice'); return; }
  switch (name) {
    case 'save': await saveProject(); break;
    case 'open': $('projectInput').click(); break;
    case 'blank': case 'sample': {
      if (!confirm(t('replaceConfirm'))) break;
      const next = newPublication(name === 'blank'); await rasterSample(next); checkpoint(); doc = next; activePage = 0; selected = null; linking = null; render(); remember(); break;
    }
    case 'undo': if (undoStack.length) { redoStack.push(clone(doc)); doc = undoStack.pop(); activePage = Math.min(activePage, doc.pages.length - 1); selected = null; linking = null; render(); remember(); } break;
    case 'redo': if (redoStack.length) { undoStack.push(clone(doc)); doc = redoStack.pop(); activePage = Math.min(activePage, doc.pages.length - 1); selected = null; linking = null; render(); remember(); } break;
    case 'text': {
      if (page().objects.length >= 200) { status('pageLimit'); break; }
      const storyId = uid(), object = frame(storyId, doc.margin + 12, doc.margin + 12, Math.min(240, doc.width - 2 * doc.margin), 110);
      mutate(() => { doc.stories[storyId] = { text: t('newText'), style: textStyle(), frames: [object.id] }; page().objects.push(object); selected = object.id; }); break;
    }
    case 'image': $('pictureInput').click(); break;
    case 'rect': case 'ellipse': case 'line': addObject(shape(doc.margin + 18, doc.margin + 18, Math.min(150, doc.width - 2 * doc.margin), name === 'line' ? 6 : 100, '#7c3aed', name)); break;
    case 'editStory': editStory(); break;
    case 'continue': continueStory(); break;
    case 'link': if (o?.type === 'text') { linking = linking ? null : o.id; render(); } break;
    case 'addPage': if (doc.pages.length >= 50) status('pageLimit'); else mutate(() => { doc.pages.push({ id: uid(), objects: [] }); activePage = doc.pages.length - 1; selected = null; }); break;
    case 'duplicatePage': duplicatePage(); break;
    case 'deletePage': if (doc.pages.length > 1 && confirm(t('deletePageConfirm'))) mutate(() => { [...page().objects].forEach(object => removeObject(doc, object.id)); doc.pages.splice(activePage, 1); activePage = Math.min(activePage, doc.pages.length - 1); selected = null; }); break;
    case 'duplicateObject': if (o && page().objects.length < 200) mutate(() => { const copy = clone(o); copy.id = uid(); copy.x += 12; copy.y += 12; if (copy.type === 'text') { const story = doc.stories[copy.storyId]; copy.storyId = uid(); doc.stories[copy.storyId] = { text: story.text, style: clone(story.style), frames: [copy.id] }; } page().objects.push(copy); selected = copy.id; }); break;
    case 'deleteObject': if (o) mutate(() => { removeObject(doc, o.id); selected = null; }); break;
    case 'front': case 'back': if (o) mutate(() => { page().objects = page().objects.filter(item => item.id !== o.id); name === 'front' ? page().objects.push(o) : page().objects.unshift(o); }); break;
    case 'pageSetup': openSetup(); break;
    case 'check': $('checkerPanel').open = true; $('checkerPanel').scrollIntoView({ block: 'nearest' }); break;
    case 'preview': preview = !preview; linking = null; document.body.classList.toggle('preview-mode', preview); $('exitPreview').hidden = !preview; render(); break;
    case 'help': $('helpDialog').showModal(); break;
    case 'print': await document.fonts.ready; render(); status('printReady'); window.print(); break;
    case 'html': await document.fonts.ready; render(); download(new Blob([exportHtml(doc, layout)], { type: 'text/html;charset=utf-8' }), '.html'); status('exported'); break;
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button) { $('fileMenu').open = false; action(button.dataset.action).catch(error => { console.error(error); status('saveFailed'); }); return; }
  const thumb = event.target.closest('[data-page]'); if (thumb) { activePage = Number(thumb.dataset.page); selected = null; render(); return; }
  const layer = event.target.closest('[data-select-object]'); if (layer) { const found = findObject(doc, layer.dataset.selectObject); activePage = found.pageIndex; select(found.object.id); }
});
$('pageSurface').addEventListener('dblclick', event => {
  const guide = event.target.closest('.guide.custom');
  if (guide) { const key = guide.dataset.guideAxis === 'x' ? 'vertical' : 'horizontal'; mutate(() => { doc.guides[key] = doc.guides[key].filter(n => n !== Number(guide.dataset.guidePosition)); }); return; }
  // Pointer capture retargets the double-click to the page surface.
  if (selected) editStory();
});
$('pageSurface').addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.target.closest('.guide.custom')) return;
  const el = event.target.closest('[data-object-id]'); if (!el) { select(null); return; }
  const id = el.dataset.objectId, resizing = event.target.classList.contains('resize-handle');
  if (linking) { select(id); return; }
  selected = id; const object = selectedObject(), before = clone(doc);
  paintSelection(); $('pageSurface').focus({ preventScroll: true });
  if (object.locked) return;
  pointer = { id, resize: resizing, before, startX: event.clientX, startY: event.clientY, x: object.x, y: object.y, w: object.w, h: object.h, changed: false, pointerId: event.pointerId };
  $('pageSurface').setPointerCapture(event.pointerId); event.preventDefault();
});
$('pageSurface').addEventListener('pointermove', event => {
  if (!pointer || event.pointerId !== pointer.pointerId) return;
  const o = selectedObject(), dx = (event.clientX - pointer.startX) / (zoom * PT_TO_PX), dy = (event.clientY - pointer.startY) / (zoom * PT_TO_PX);
  if (Math.abs(dx) + Math.abs(dy) < 0.1) return;
  if (pointer.resize) { o.w = Math.max(6, Math.min(2000, pointer.w + dx)); o.h = Math.max(6, Math.min(2000, pointer.h + dy)); }
  else {
    let x = pointer.x + dx, y = pointer.y + dy;
    if ($('snapToggle').checked && !event.altKey) {
      const xs = guidePositions(doc, 'x'), ys = guidePositions(doc, 'y');
      page().objects.filter(item => item.id !== o.id).forEach(item => { xs.push(item.x, item.x + item.w / 2, item.x + item.w); ys.push(item.y, item.y + item.h / 2, item.y + item.h); });
      x = snapPosition(x, o.w, xs, 5 / zoom); y = snapPosition(y, o.h, ys, 5 / zoom);
    }
    o.x = Math.max(-2000, Math.min(4000, x)); o.y = Math.max(-2000, Math.min(4000, y));
  }
  pointer.changed = true; renderPage(); renderProperties();
});
function endPointer(event) {
  if (!pointer || event.pointerId !== pointer.pointerId) return;
  const changed = pointer.changed || event.type === 'pointercancel';
  if (event.type === 'pointercancel') doc = pointer.before;
  else if (pointer.changed) { checkpoint(pointer.before); remember(); }
  pointer = null; if (changed) render();
}
$('pageSurface').addEventListener('pointerup', endPointer); $('pageSurface').addEventListener('pointercancel', endPointer);
for (const [id, axis] of [['rulerH', 'x'], ['rulerV', 'y']]) $(id).addEventListener('pointerdown', event => {
  event.preventDefault(); const ruler = $(id); ruler.setPointerCapture(event.pointerId);
  const finish = end => {
    ruler.removeEventListener('pointerup', finish); const rect = $('pageSurface').getBoundingClientRect();
    const pos = axis === 'x' ? (end.clientX - rect.left) / (zoom * PT_TO_PX) : (end.clientY - rect.top) / (zoom * PT_TO_PX);
    if (end.clientX >= rect.left && end.clientX <= rect.right && end.clientY >= rect.top && end.clientY <= rect.bottom && doc.guides[axis === 'x' ? 'vertical' : 'horizontal'].length < 100) { mutate(() => doc.guides[axis === 'x' ? 'vertical' : 'horizontal'].push(Math.round(pos * 10) / 10)); status('guideAdded'); }
  }; ruler.addEventListener('pointerup', finish);
});
$('objectProperties').addEventListener('change', event => {
  const o = selectedObject(), id = event.target.id; if (!o) return;
  if (o.locked && id !== 'propLocked') { status('lockedNotice'); renderProperties(); return; }
  const geometry = { propX: 'x', propY: 'y', propW: 'w', propH: 'h', propRotation: 'rotation' };
  const styles = { propFont: 'font', propFontSize: 'size', propTextColor: 'color', propLineHeight: 'lineHeight', propAlign: 'align', propDirection: 'direction' };
  let value = event.target.value;
  if (geometry[id]) {
    value = id === 'propRotation' ? Number(value) : toPoints(Number(value), unit);
    if (!Number.isFinite(value) || ['propW', 'propH'].includes(id) && (value < 6 || value > 2000) || ['propX', 'propY'].includes(id) && (value < -2000 || value > 4000) || id === 'propRotation' && Math.abs(value) > 360) { status('invalidMeasure'); renderProperties(); return; }
  }
  if (id === 'propFontSize' || id === 'propLineHeight') { value = Number(value); if (!Number.isFinite(value) || value < (id === 'propFontSize' ? 6 : 1) || value > (id === 'propFontSize' ? 120 : 3)) { status('invalidMeasure'); renderProperties(); return; } }
  mutate(() => {
    if (geometry[id]) o[geometry[id]] = value;
    else if (styles[id] && o.type === 'text') doc.stories[o.storyId].style[styles[id]] = value;
    else if (id === 'propBold') doc.stories[o.storyId].style.weight = event.target.checked ? 'bold' : 'normal';
    else if (id === 'propLocked') o.locked = event.target.checked;
    else if (id === 'propFill') { o.fill = value; o.stroke = value; }
    else if (id === 'propOpacity') o.opacity = Number(value);
    else if (id === 'propFit') o.fit = value;
  });
});
$('applyStory').addEventListener('click', () => { const id = editingStoryId; if (doc.stories[id]) mutate(() => { doc.stories[id].text = $('storyText').value; }); $('storyDialog').close(); });
$('applySetup').addEventListener('click', () => {
  const next = clone(doc), dims = [...PAPER[$('paperSize').value]]; if ($('landscape').checked) dims.reverse(); [next.width, next.height] = dims;
  next.margin = Number($('pageMargin').value); next.guides.columns = Number($('guideColumns').value); next.guides.rows = Number($('guideRows').value); next.guides.gap = Number($('guideGap').value); next.guides.baseline = Number($('guideBaseline').value);
  try { validatePublication(next); } catch { status('invalidSetup'); return; }
  checkpoint(); doc = next; baseline = $('baselineToggle').checked; $('setupDialog').close(); render(); remember();
});
$('publicationTitle').addEventListener('change', () => mutate(() => { doc.title = $('publicationTitle').value.trim() || 'Untitled publication'; }));
$('projectInput').addEventListener('change', async event => { const file = event.target.files[0]; if (file) await openProject(file); event.target.value = ''; });
$('pictureInput').addEventListener('change', async event => { const file = event.target.files[0]; if (file) await importPicture(file); event.target.value = ''; });
$('unitSelect').addEventListener('change', event => { unit = event.target.value; render(); });
$('zoomSelect').addEventListener('change', event => { if (event.target.value !== 'fit') zoom = Number(event.target.value); render(); });
$('guidesToggle').addEventListener('change', renderPage); $('rulersToggle').addEventListener('change', event => document.body.classList.toggle('hide-rulers', !event.target.checked));
document.addEventListener('keydown', event => {
  const editing = event.target.closest('input,textarea,select,[contenteditable]'), dialog = document.querySelector('dialog[open]');
  if (dialog) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); action('save'); return; }
  if (editing) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); action(event.shiftKey ? 'redo' : 'undo'); return; }
  if (event.key === 'Escape') { linking = null; selected = null; render(); return; }
  if (preview) return;
  const o = selectedObject(); if (!o) return;
  if (event.key === 'Enter') { event.preventDefault(); editStory(); return; }
  if (o.locked) return;
  if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); action('deleteObject'); return; }
  const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (move) { event.preventDefault(); mutate(() => { o.x = Math.max(-2000, Math.min(4000, o.x + move[0] * (event.shiftKey ? 10 : 1))); o.y = Math.max(-2000, Math.min(4000, o.y + move[1] * (event.shiftKey ? 10 : 1))); }); $('pageSurface').focus({ preventScroll: true }); }
});
window.addEventListener('widget-i18n:changed', render);
window.addEventListener('resize', () => { renderThumbnails(); if ($('zoomSelect').value === 'fit') renderPage(); });
// Preserve the screen-computed fragments: print CSS hides editor-only elements.
window.addEventListener('beforeprint', renderOutput);
window.addEventListener('pagehide', () => { if (unsaved) { clearTimeout(saveTimer); saveLocal(); } });
window.addEventListener('beforeunload', event => { if (unsaved) { event.preventDefault(); event.returnValue = ''; } });
async function boot() {
  if (!window.WidgetI18n || !window.JSZip) throw new Error('Local runtime assets did not load.');
  let loaded = false;
  try {
    const storage = workspaceStorage(), raw = storage.getItem(STORE);
    if (raw) { doc = validatePublication(JSON.parse(raw)); lastSaved = raw; loaded = true; }
    else doc = newPublication();
  } catch {
    try { doc = validatePublication(JSON.parse(workspaceStorage().getItem(BACKUP))); loaded = true; lastStatus = 'recovered'; } catch { doc = newPublication(); loaded = true; lastStatus = 'storageUnavailable'; }
  }
  await rasterSample(doc); await document.fonts.ready;
  if (innerWidth <= 780) $('zoomSelect').value = 'fit';
  render();
  const incoming = await consumeTransferredFile('layoutsplat');
  if (incoming) await openProject(incoming, true); else if (!loaded) remember();
  // Read-only diagnostics let tests inspect the actual model and computed output.
  window.LayoutSplat = Object.freeze({ version: '0.1.0', getPublication: () => clone(doc), getLayout: () => ({ fragments: [...layout.fragments.entries()], overflows: clone(layout.overflows) }), getFindings: () => clone(issues) });
}
boot().catch(error => { console.error(error); status('invalidProject'); });
