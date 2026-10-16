import { loadStarterPublication } from './starter.mjs';
import { saveToGoogleDrive } from '../shared/google-drive.js?v=20261015-creative-drive';
import { UNITS, PAPER, uid, clone, newPublication, frame, shape, textStyle, findObject, guidePositions, snapPosition, removeObject, linkFrames, validatePublication, formatMeasure, toPoints, setStoryStyle } from './engine.mjs';
import { createMeasurer, layoutStories, designFindings, PT_TO_PX } from './layout.mjs';
import { objectElement, publicationPage, exportHtml } from './render.mjs';
import { consumeTransferredFile, routeFileToApp, workspaceStorage, isTransferredWorkspace } from '../shared/file-bridge.js';
import { installPublishingUI } from './publishing-ui.mjs';
import { setupPublishing } from './publishing.mjs';
import { MEDIA_ACCEPT, importMedia } from './media.mjs';
import { importSvg, importFabric } from './compatibility.mjs';
import { readZip, importIdml, importSla } from './desktop-formats.mjs';
import { portableHtml } from './fonts.mjs';
import { importPublisher } from './publisher.mjs';
import { importPages } from './pages-import.mjs';
import { importArtwork } from './artwork-import.mjs';
import { setupStoryEditor } from './story-editor.mjs';
import { setupMovableDialogs } from './dialogs.mjs';
import { loadProjectFonts } from './local-fonts.mjs';
import { importQuark } from './quark-import.mjs';
import {refreshPageNumbers,pageContext} from './publication-fields.mjs';
const $ = id => document.getElementById(id), t = (key, vars) => window.WidgetI18n.t(key, vars);
const STORE = 'layoutsplat.autosave.v1', BACKUP = 'layoutsplat.recovery.v1', START_BLANK = 'layoutsplat.startBlank.v1';
let doc, activePage = 0, selected = null, linking = null, unit = 'in', zoom = 0.55, baseline = false, preview = false, lastStatus = 'savedLocal', statusVars;
let undoStack = [], redoStack = [], saveTimer, pointer, editingStoryId, lastSaved, unsaved = false;
const measurer = createMeasurer(); let layout, issues;
const printStyle = document.createElement('style'); document.head.append(printStyle);
let publishing, storyEditor;
const page = () => (doc.masters || []).find(m => m.id === publishing?.masterId()) || doc.pages[activePage], selectedObject = () => findObject(doc, selected)?.object;
function status(key, vars) { lastStatus = key; statusVars = vars; $('statusText').textContent = t(key, vars); }
function checkpoint(snapshot = doc) { undoStack.push(clone(snapshot)); if (undoStack.length > 40) undoStack.shift(); redoStack = []; }
function remember() {
  unsaved = true; clearTimeout(saveTimer); saveTimer = setTimeout(saveLocal, 250);
}
function saveLocal() {
  try {
    const storage = workspaceStorage(), json = JSON.stringify(doc);
    // Save the current draft first. Large illustrated publications can fit
    // individually while a second recovery copy exceeds localStorage's quota.
    storage.setItem(STORE, json);
    if (lastSaved) { try { storage.setItem(BACKUP, lastSaved); } catch { /* Keep the saved current draft and any older recovery copy. */ } }
    lastSaved = json; unsaved = false;
    storage.removeItem(START_BLANK);
    status(isTransferredWorkspace() ? 'isolatedDraft' : 'savedLocal');
  } catch { status('storageUnavailable'); }
}
function mutate(fn) { checkpoint(); fn(); render(); remember(); }
function label(object) {
  if (object.type === 'text') return doc.stories[object.storyId].text.replace(/\s+/g, ' ').slice(0, 30) || t('textFrame');
  if (object.type === 'image') return doc.assets[object.assetId].name;
  if (object.type === 'table') return t('table');
  return t(object.kind === 'rect' ? 'rectangle' : object.kind);
}
function select(id, event = {}) {
  if (linking && id) {
    try { mutate(() => linkFrames(doc, linking, id)); linking = null; } catch { status('linkError'); }
  }
  selected = publishing ? publishing.onSelect(id, event) : id; render();
}
function paintSelection() {
  $('pageSurface').querySelectorAll('.object').forEach(el => {
    const active = publishing?.selectedIds().has(el.dataset.objectId) || el.dataset.objectId === selected; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', String(active));
    el.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
    if (active && !selectedObject().locked) { const handle = document.createElement('div'); handle.className = 'resize-handle'; handle.setAttribute('aria-hidden', 'true'); el.append(handle); }
  });
  renderProperties(); renderLayers(); publishing?.render();
}
function render() {
  refreshPageNumbers(doc);
  layout = layoutStories(doc, measurer); issues = designFindings(doc, layout);
  if ($('publicationTitle') !== document.activeElement) $('publicationTitle').value = doc.title; document.title = `${doc.title} · LayoutSplat™`;
  $('pageLabel').textContent = publishing?.masterId() ? `${t('master')}: ${page().name}` : t('pageNumber', { page: activePage + 1, total: doc.pages.length });
  $('undoBtn').disabled = !undoStack.length; $('redoBtn').disabled = !redoStack.length;
  $('linkHint').hidden = !linking; $('linkBtn').classList.toggle('primary', !!linking);
  publishing?.render();
  renderPage(); renderThumbnails(); renderProperties(); renderLayers(); renderChecker(); renderOutput();
  publishing?.render(); $('statusText').textContent = t(lastStatus, statusVars); window.WidgetI18n.refresh();
}
function renderPage() {
  const surface = $('pageSurface'), wrap = $('sheetWrap'); surface.replaceChildren();
  if ($('zoomSelect').value === 'fit') zoom = Math.max(0.1, Math.min(1, ($('canvasScroll').clientWidth - 56) / (doc.width * PT_TO_PX), ($('canvasScroll').clientHeight - 75) / (doc.height * PT_TO_PX)));
  Object.assign(surface.style, { width: `${doc.width}pt`, height: `${doc.height}pt`, transform: `scale(${zoom})` });
  Object.assign(wrap.style, { width: `${doc.width * PT_TO_PX * zoom}px`, height: `${doc.height * PT_TO_PX * zoom}px` });
  const master = (doc.masters || []).find(m => m.id === page().masterId);
  for (const object of master?.objects || []) if (!(page().masterOverrides || []).includes(object.id)) { const context = pageContext(doc, page(), layout), el = objectElement(context.doc, object, context.layout); el.classList.add('master-object'); surface.append(el); }
  page().objects.forEach(object => {
    const el = objectElement(doc, object, layout); el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', label(object)); el.setAttribute('aria-pressed', String(selected === object.id));
    if (selected === object.id || publishing?.selectedIds().has(object.id)) {
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
      if (major) { const number = document.createElement('span'); number.textContent = formatMeasure(pos - (doc.rulerOrigin?.[axis] || 0), unit); number.style[axis === 'x' ? 'left' : 'top'] = `${pos * PT_TO_PX * zoom + 2}px`; el.append(number); }
    }
  }
  $('rulerH').hidden = doc.guides.showHorizontal === false; $('rulerV').hidden = doc.guides.showVertical === false;
}
let thumbnailObserver;
function renderThumbnails() {
  thumbnailObserver?.disconnect();
  thumbnailObserver = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) {
    const button = entry.target, index = Number(button.dataset.page), holder = button.querySelector('.thumb-sheet'), width = holder.clientWidth;
    const thumb = publicationPage(doc, doc.pages[index], layout); thumb.classList.add('thumb-page'); thumb.style.transform = `scale(${width / (doc.width * PT_TO_PX)})`; thumb.setAttribute('aria-hidden', 'true'); holder.append(thumb); thumbnailObserver.unobserve(button);
  } }, { root: $('pageList').closest('.left-panel'), rootMargin: '200px' });
  $('pageList').replaceChildren(); const width = innerWidth <= 780 ? 55 : innerWidth <= 1080 ? 98 : 126;
  doc.pages.forEach((p, index) => {
    const button = document.createElement('button'); button.className = 'page-thumb' + (index === activePage ? ' active' : ''); button.dataset.page = index; button.setAttribute('aria-label', t('pageNumber', { page: index + 1, total: doc.pages.length })); button.setAttribute('aria-current', index === activePage ? 'page' : 'false');
    const holder = document.createElement('div'); holder.className = 'thumb-sheet'; holder.style.width = `${width}px`; holder.style.height = `${width * doc.height / doc.width}px`;

    const name = document.createElement('span'); name.textContent = index + 1; button.append(holder, name); $('pageList').append(button); thumbnailObserver.observe(button);
  });
}
function renderProperties() {
  const value = (id, next) => { if ($(id) !== document.activeElement) $(id).value = next; };
  const o = selectedObject(); $('emptySelection').hidden = !!o; $('objectProperties').hidden = !o; $('objectType').textContent = o ? t(o.type === 'text' ? 'textFrame' : o.type === 'image' ? 'picture' : o.type === 'table' ? 'table' : o.kind === 'rect' ? 'rectangle' : o.kind) : '';
  $('editStoryBtn').disabled = !o || o.type !== 'text'; $('linkBtn').disabled = !o || o.type !== 'text' || o.locked;
  if (!o) return;
  const geometry = publishing?.members().length > 1 ? publishing.bounds() : o;
  for (const [id, key] of [['propX', 'x'], ['propY', 'y'], ['propW', 'w'], ['propH', 'h']]) { value(id, formatMeasure(geometry[key], unit)); $(id).disabled = o.locked; }
  value('propRotation', o.rotation); $('propRotation').disabled = o.locked; $('propLocked').checked = o.locked;
  value('propTransparency', Math.round((1 - (o.opacity ?? 1)) * 100)); $('propTransparency').disabled = o.locked; $('transparencyValue').textContent = $('propTransparency').value + '%';
  $('textProperties').hidden = o.type !== 'text'; $('shapeProperties').hidden = o.type !== 'shape'; $('imageProperties').hidden = o.type !== 'image';
  if (o.type === 'text') {
    const story = doc.stories[o.storyId], s = story.style;
    value('propFont', s.font); value('propFontSize', s.size); $('propBold').checked = s.weight === 'bold'; value('propTextColor', s.color); value('propLineHeight', s.lineHeight); value('propAlign', s.align); value('propDirection', s.direction);
    $('storyInfo').textContent = t('linkedInfo', { count: story.frames.length });
  } else if (o.type === 'shape') { value('propFill', o.fill); value('propOpacity', o.opacity); }
  else if (o.type === 'image') { value('propFit', o.fit); const a = doc.assets[o.assetId]; $('imageInfo').textContent = `${a.width} × ${a.height} px`; }
  $('objectProperties').querySelectorAll('button').forEach(button => { button.disabled = o.locked; });
}
function renderLayers() {
  $('layerList').replaceChildren(); [...page().objects].reverse().forEach(o => { const row = document.createElement('div'); row.className = 'layer-row'; const button = document.createElement('button'); button.className = 'layer-btn' + (selected === o.id ? ' active' : ''); button.dataset.selectObject = o.id; button.textContent = (o.locked ? '▣ ' : '') + label(o); const slider = document.createElement('input'); slider.type = 'range'; slider.min = 0; slider.max = 100; slider.step = 1; slider.value = Math.round((1 - (o.opacity ?? 1)) * 100); slider.disabled = o.locked; slider.dataset.layerTransparency = o.id; slider.setAttribute('aria-label', t('layerTransparency', { name: label(o) })); slider.title = `${t('transparency')}: ${slider.value}%`; row.append(button, slider); $('layerList').append(row); });
}
function renderChecker() {
  $('issueCount').textContent = issues.length; $('checkerResults').replaceChildren();
  if (!issues.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = t('noIssues'); $('checkerResults').append(p); }
  issues.forEach(issue => { const button = document.createElement('button'); button.className = `finding ${issue.severity}`; button.dataset.selectObject = issue.id; button.textContent = t(issue.key, { count: issue.count }); $('checkerResults').append(button); });
  const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = t('checkScope'); $('checkerResults').append(hint);
}
function renderOutput(forcePrint = false) {
  printStyle.textContent = `@page{size:${doc.width}pt ${doc.height}pt;margin:0}`;
  if (forcePrint || matchMedia('print').matches) $('printPages').replaceChildren(...doc.pages.map(p => publicationPage(doc, p, layout)));
  else $('printPages').replaceChildren();
  if (preview) $('previewPages').replaceChildren(...doc.pages.map(p => publicationPage(doc, p, layout)));
  else $('previewPages').replaceChildren();
  $('previewPages').classList.toggle('facing', !!doc.facingPages);
}
function addObject(object) {
  if (page().objects.length >= 200) { status('pageLimit'); return; }
  mutate(() => { page().objects.push(object); selected = object.id; });
}
function editStory() {
  const o = selectedObject(); if (!o || o.type !== 'text') return;
  if (o.locked) { status('lockedNotice'); return; }
  editingStoryId = o.storyId; storyEditor.open(doc.stories[o.storyId]);
}
function continueStory() {
  const o = selectedObject(); if (!o || o.type !== 'text' || o.locked) return;
  const story = doc.stories[o.storyId], last = findObject(doc, story.frames.at(-1));
  if (last.pageIndex === doc.pages.length - 1 && doc.pages.length >= 500) { status('pageLimit'); return; }
  if (doc.pages[last.pageIndex + 1]?.objects.length >= 200) { status('pageLimit'); return; }
  mutate(() => {
    if (!doc.pages[last.pageIndex + 1]) doc.pages.push({ id: uid(), objects: [] });
    activePage = last.pageIndex + 1; const next = frame(o.storyId, doc.margin, doc.margin, Math.min(last.object.w, doc.width - 2 * doc.margin), doc.height - 2 * doc.margin);
    story.frames.push(next.id); page().objects.push(next); selected = next.id;
  });
}
async function rasterSample(publication) {
  await loadProjectFonts(publication);
  for (const asset of Object.values(publication.assets)) if (['sample-art.svg', 'splatworks-logo.png'].includes(asset.src)) {
    const image = new Image(); image.src = asset.src; await image.decode();
    const scale = asset.brandExample ? Math.min(1, 160 / Math.max(image.naturalWidth, image.naturalHeight)) : 1, canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); asset.width = canvas.width; asset.height = canvas.height; asset.src = canvas.toDataURL('image/png');
  }
}
function download(blob, extension) {
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = (doc.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'publication') + extension; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function projectBlob(publication = doc) {
  const zip = new window.JSZip(); zip.file('publication.json', JSON.stringify(publication, null, 2)); zip.file('README.txt', 'LayoutSplat version 1 publication. Open this .layoutsplat file in LayoutSplat.\nPictures, stories, rich formatting, masters, styles, and motion media are embedded in publication.json. LayoutSplat uses its bundled font substitutes. For separately packaged fonts and print proofs, choose File → Export → Pack and Go.\n');
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
async function saveProject() {
  try { download(await projectBlob(), '.layoutsplat'); status('savedProject'); } catch { status('saveFailed'); }
}
async function parseProject(file, options = {}) {
  if (file.size > 192000000) throw new Error('size');
  let text;
  let result, warnings = [];
  if (/\.epub$/i.test(file.name)) { const {importEpub}=await import('./epub-import.mjs'); ({doc:result,warnings}=await importEpub(file,options)); }
  else if (/\.pub$/i.test(file.name)) ({ doc: result, warnings } = await importPublisher(file, { ...options, encoding: $('pubEncoding').value, customFonts: doc.customFonts||{} }));
  else if (/\.pages$/i.test(file.name)) ({ doc: result, warnings } = await importPages(file, options));
  else if (/\.(ai|pdf|eps|ps)$/i.test(file.name)) ({ doc: result, warnings } = await importArtwork(file, options));
  else if (/\.(indd|indt)$/i.test(file.name)) throw Error('Native InDesign INDD/INDT decoding is not available in LayoutSplat. Export IDML and package its linked images for editable import, or export PDF for page appearance. This document has not replaced your current publication.');
  else if (/\.(qxp|qxd|qxt)$/i.test(file.name)) ({doc:result,warnings}=await importQuark(file,{...options,customFonts:doc.customFonts||{}}));
  else if (/\.(layoutsplat|idml|zip)$/i.test(file.name)) {
    const zip = await readZip(file), entry = zip.file('publication.json') || zip.file('publication.layoutsplat.json') || zip.file('LayoutSplat/publication.json');
    if (entry) { if (entry._data?.uncompressedSize > 256000000) throw new Error('archive'); result = validatePublication(JSON.parse(await entry.async('string'))); }
    else if (zip.file('designmap.xml')) ({ doc: result, warnings } = await importIdml(zip));
    else { const idml = Object.values(zip.files).find(f => /\.idml$/i.test(f.name)), sla = Object.values(zip.files).find(f => /\.sla$/i.test(f.name)); if (idml) ({ doc: result, warnings } = await importIdml(await readZip(await idml.async('blob')), zip)); else if (sla) ({ doc: result, warnings } = await importSla(await sla.async('string'), zip)); else throw Error('archive'); }
  } else if (/\.svg$/i.test(file.name)) ({ doc: result, warnings } = importSvg(await file.text()));
  else if (/\.html?$/i.test(file.name)) { const html = new DOMParser().parseFromString(await file.text(), 'text/html'), payload = html.querySelector('template#layoutsplat-document')?.content.textContent; if (!payload) throw Error('Open a LayoutSplat HTML publication, or import another program through SVG, IDML, SLA, or PDF.'); result = validatePublication(JSON.parse(payload)); }
  else if (/\.sla$/i.test(file.name)) ({ doc: result, warnings } = await importSla(await file.text()));
  else { text = await file.text(); if (text.length > 256000000) throw new Error('size'); const data = JSON.parse(text); if (Array.isArray(data.objects) && data.app !== 'LayoutSplat') ({ doc: result, warnings } = importFabric(data)); else result = validatePublication(data); }
  await rasterSample(result); return { doc: result, warnings };
}
async function openProject(file, transferred = false) {
  const controller = new AbortController(), publisher = /\.(epub|pub|pages|ai|pdf|eps|ps|qxp|qxd|qxt)$/i.test(file.name);
  try {
    if (!transferred && !/\.(layoutsplat|epub|pub|pages|ai|eps|ps|indd|indt|qxp|qxd|qxt|idml|sla|svg|zip|pdf|html?)$/i.test(file.name) && await routeFileToApp(file, 'layoutsplat')) return;
    if (publisher) { $('mediaProgress').textContent = /\.pub$/i.test(file.name) ? t('publisherDecoding') : 'Importing layout locally…'; $('mediaCancel').onclick = () => controller.abort(); $('mediaImportDialog').showModal(); }
    const imported = await parseProject(file, { signal: controller.signal, onProgress: text => $('mediaProgress').textContent = text }), next = imported.doc;
    if (publisher) $('mediaImportDialog').close();
    if (!transferred && !confirm(t('replaceConfirm'))) return;
    checkpoint(); doc = next; activePage = 0; selected = null; linking = null; publishing?.reset(); render(); remember(); status(transferred ? 'isolatedDraft' : 'opened');
    if (imported.warnings.length) showImportReport(imported.warnings);
  } catch (error) { console.warn('LayoutSplat import:', error.message); status('invalidProject'); if (!controller.signal.aborted) showImportReport([t('mediaImportError'), error.message]); }
  finally { if (publisher) $('mediaImportDialog').close(); }
}
async function importPicture(file, replaceId = null) {
  if (!replaceId && page().objects.length >= 200) { status('pageLimit'); return; }
  const controller = new AbortController(); $('mediaCancel').onclick = () => controller.abort(); $('mediaProgress').textContent = t('importingMedia'); $('mediaImportDialog').showModal();
  try {
    const asset = await importMedia(file, { signal: controller.signal, onStatus: text => $('mediaProgress').textContent = text }), notes = asset.notes || []; delete asset.notes; controller.signal.throwIfAborted();
    const existing = replaceId ? findObject(doc, replaceId)?.object : null; if (replaceId && (!existing || existing.type !== 'image' || existing.locked)) throw Error(t('lockedNotice'));
    mutate(() => { const assetId = uid(); doc.assets[assetId] = asset; if (existing) { existing.assetId = assetId; selected = existing.id; } else { const w = Math.min(300, doc.width - doc.margin * 2), h = Math.max(6, Math.min(doc.height - doc.margin * 2, w * asset.height / asset.width)); const o = { id: uid(), type: 'image', assetId, x: doc.margin, y: doc.margin, w, h, rotation: 0, fit: 'contain', locked: false }; page().objects.push(o); selected = o.id; } });
    $('mediaImportDialog').close(); if (notes.length) showImportReport(notes);
  } catch (error) { $('mediaImportDialog').close(); if (!controller.signal.aborted) showImportReport([t('mediaImportError'), error?.message || String(error)]); }
}
function showImportReport(lines) { $('importReportText').textContent = [...new Set(lines)].join('\n\n'); $('importReportDialog').showModal(); }
function duplicatePage() {
  if (doc.pages.length >= 500) { status('pageLimit'); return; }
  mutate(() => {
    const copy = clone(page()); copy.id = uid(); const stories = new Map();
    copy.objects.forEach(o => {
      o.id = uid(); if (o.type === 'text') {
        const original = doc.stories[o.storyId], old = o.storyId;
        if (!stories.has(old)) { const storyId = uid(); stories.set(old, storyId); doc.stories[storyId] = { ...clone(original), frames: [] }; }
        o.storyId = stories.get(old); doc.stories[o.storyId].frames.push(o.id);
      }
    });
    doc.pages.splice(activePage + 1, 0, copy); activePage++; selected = null;
  });
}
function openSetup() {
  const dimensions = [Math.min(doc.width, doc.height), Math.max(doc.width, doc.height)];
  $('paperSize').value = Object.keys(PAPER).find(key => PAPER[key].every((n, i) => Math.abs(n - dimensions[i]) < 1)) || 'custom';
  $('customPageW').value = doc.width; $('customPageH').value = doc.height; $('pageBleed').value = doc.bleed || 0; $('pageSafe').value = doc.safeArea ?? 18; $('rulerOriginX').value = doc.rulerOrigin?.x || 0; $('rulerOriginY').value = doc.rulerOrigin?.y || 0; $('facingPages').checked = !!doc.facingPages; $('lockGuides').checked = !!doc.guides.locked; $('showRulerH').checked = doc.guides.showHorizontal !== false; $('showRulerV').checked = doc.guides.showVertical !== false;
  $('landscape').checked = doc.width > doc.height; $('pageMargin').value = doc.margin; $('guideColumns').value = doc.guides.columns; $('guideRows').value = doc.guides.rows; $('guideGap').value = doc.guides.gap; $('guideBaseline').value = doc.guides.baseline; $('baselineToggle').checked = baseline; $('setupDialog').showModal();
}
async function action(name) {
  const o = selectedObject();
  if(name.startsWith('importFile-')){const kind=name.slice(11),formats={epub:'.epub',ai:'.ai',indesign:'.idml,.zip,.indd,.indt',pages:'.pages',eps:'.eps,.ps',pub:'.pub',pdf:'.pdf',quark:'.qxp,.qxd,.qxt',scribus:'.sla,.zip',svg:'.svg'};if(kind==='media')$('pictureInput').click();else{$('projectInput').accept=formats[kind]||'.layoutsplat,.json';$('projectInput').click();}return;}
  if (await publishing?.action(name)) { document.querySelectorAll('.more-tools[open]').forEach(menu => menu.open = false); return; }
  if (['deleteObject', 'duplicateObject', 'front', 'back', 'continue', 'link'].includes(name) && o?.locked) { status('lockedNotice'); return; }
  switch (name) {
    case 'starter': {
      const next = await loadStarterPublication(); await rasterSample(next); checkpoint(); doc = next; activePage = 0; selected = null; linking = null; publishing?.reset(); render(); remember(); break;
    }
    case 'save': await saveProject(); break;
    case 'save-drive': {
      const snapshot = clone(doc);
      await saveToGoogleDrive({ appName: 'LayoutSplat', fileName: (doc.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'publication') + '.layoutsplat', buildFile: () => projectBlob(snapshot) });
      break;
    }
    case 'open': $('projectInput').accept='.layoutsplat,.json,.zip,.html,.htm,.epub';$('projectInput').click(); break;
    case 'clearBrowser': {
      if (!confirm(t('clearBrowserConfirm'))) break;
      try { const storage = workspaceStorage(); storage.setItem(START_BLANK, '1'); storage.removeItem(STORE); storage.removeItem(BACKUP); clearTimeout(saveTimer); unsaved = false; lastSaved = null; undoStack = []; redoStack = []; location.reload(); }
      catch { status('storageUnavailable'); }
      break;
    }
    case 'blank': case 'sample': {
      if (!confirm(t('replaceConfirm'))) break;
      const next = newPublication(name === 'blank'); await rasterSample(next); checkpoint(); doc = next; activePage = 0; selected = null; linking = null; publishing?.reset(); render(); remember(); break;
    }
    case 'undo': if (undoStack.length) { redoStack.push(clone(doc)); doc = undoStack.pop(); activePage = Math.min(activePage, doc.pages.length - 1); selected = null; linking = null; publishing?.reset(); render(); remember(); } break;
    case 'redo': if (redoStack.length) { undoStack.push(clone(doc)); doc = redoStack.pop(); activePage = Math.min(activePage, doc.pages.length - 1); selected = null; linking = null; publishing?.reset(); render(); remember(); } break;
    case 'text': {
      if (page().objects.length >= 200) { status('pageLimit'); break; }
      const storyId = uid(), object = frame(storyId, doc.margin + 12, doc.margin + 12, Math.min(240, doc.width - 2 * doc.margin), 110);
      mutate(() => { doc.stories[storyId] = { text: t('newText'), style: textStyle(), frames: [object.id] }; page().objects.push(object); selected = object.id; }); break;
    }
    case 'image': $('pictureInput').click(); break;
    case 'video': $('videoInput').click(); break;
    case 'rect': case 'ellipse': case 'line': addObject(shape(doc.margin + 18, doc.margin + 18, Math.min(150, doc.width - 2 * doc.margin), name === 'line' ? 6 : 100, '#7c3aed', name)); break;
    case 'editStory': editStory(); break;
    case 'continue': continueStory(); break;
    case 'contextLink': case 'link': if (o?.type === 'text' && !o.locked) { linking = linking ? null : o.id; render(); } break;
    case 'addPage': if (doc.pages.length >= 500) status('pageLimit'); else mutate(() => { doc.pages.push({ id: uid(), objects: [] }); activePage = doc.pages.length - 1; selected = null; }); break;
    case 'duplicatePage': duplicatePage(); break;
    case 'deletePage': if (doc.pages.length > 1 && confirm(t('deletePageConfirm'))) mutate(() => { [...page().objects].forEach(object => removeObject(doc, object.id)); doc.pages.splice(activePage, 1); activePage = Math.min(activePage, doc.pages.length - 1); selected = null; }); break;
    case 'duplicateObject': if (o && page().objects.length < 200) mutate(() => { const copy = clone(o); copy.id = uid(); copy.x += 12; copy.y += 12; if (copy.type === 'text') { const story = doc.stories[copy.storyId]; copy.storyId = uid(); doc.stories[copy.storyId] = { ...clone(story), frames: [copy.id] }; } page().objects.push(copy); selected = copy.id; }); break;
    case 'deleteObject': if (o) mutate(() => { removeObject(doc, o.id); selected = null; }); break;
    case 'front': case 'back': if (o) mutate(() => { page().objects = page().objects.filter(item => item.id !== o.id); name === 'front' ? page().objects.push(o) : page().objects.unshift(o); }); break;
    case 'pageSetup': openSetup(); break;
    case 'check': $('checkerPanel').open = true; $('checkerPanel').scrollIntoView({ block: 'nearest' }); break;
    case 'preview': preview = !preview; linking = null; document.body.classList.toggle('preview-mode', preview); $('exitPreview').hidden = !preview; render(); break;
    case 'help': $('helpDialog').showModal(); break;
    case 'print': await document.fonts.ready; render(); status('printReady'); window.print(); break;
    case 'html': await document.fonts.ready; render(); download(new Blob([await portableHtml(exportHtml(doc, layout, { interactive: true }), doc)], { type: 'text/html;charset=utf-8' }), '.html'); status('exported'); break;
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button) { $('fileMenu').open = false; document.querySelectorAll('.toolbar details[open]').forEach(menu => menu.open = false); action(button.dataset.action).catch(error => { console.error(error); status('saveFailed'); }); return; }
  const thumb = event.target.closest('[data-page]'); if (thumb) { activePage = Number(thumb.dataset.page); selected = null; publishing?.reset(); render(); return; }
  const layer = event.target.closest('[data-select-object]'); if (layer) { const found = findObject(doc, layer.dataset.selectObject); if (found.pageIndex >= 0) activePage = found.pageIndex; select(found.object.id, event); }
});
$('pageSurface').addEventListener('dblclick', event => {
  const guide = event.target.closest('.guide.custom');
  if (guide) { if (doc.guides.locked) return; const key = guide.dataset.guideAxis === 'x' ? 'vertical' : 'horizontal'; mutate(() => { doc.guides[key] = doc.guides[key].filter(n => n !== Number(guide.dataset.guidePosition)); }); return; }
  // Pointer capture retargets the double-click to the page surface.
  if (selected) editStory();
});
$('pageSurface').addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.target.closest('.guide.custom')) return;
  const el = event.target.closest('[data-object-id]'); if (!el) { select(null); return; }
  const id = el.dataset.objectId, resizing = event.target.classList.contains('resize-handle');
  if (linking) { select(id); return; }
  selected = publishing ? publishing.onSelect(id, event) : id; const object = selectedObject(), before = clone(doc);
  paintSelection(); $('pageSurface').focus({ preventScroll: true });
  if (!object || object.locked) return;
  pointer = { id, resize: resizing, before, startX: event.clientX, startY: event.clientY, x: object.x, y: object.y, w: object.w, h: object.h, changed: false, pointerId: event.pointerId, members: (publishing?.members() || [object]).map(clone) };
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
  for (const original of pointer.members) if (original.id !== o.id && !original.locked) { const other = findObject(doc, original.id)?.object; if (!other) continue; if (pointer.resize) { const sx = o.w / pointer.w, sy = o.h / pointer.h; other.x = pointer.x + (original.x - pointer.x) * sx; other.y = pointer.y + (original.y - pointer.y) * sy; other.w = Math.max(6, original.w * sx); other.h = Math.max(6, original.h * sy); } else { other.x = original.x + o.x - pointer.x; other.y = original.y + o.y - pointer.y; } }
  renderPage();
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
  if (doc.guides.locked) return;
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
    if (geometry[id]) { if (publishing?.members().length > 1) publishing.transformSelection(geometry[id], value); else o[geometry[id]] = value; }
    else if (styles[id] && o.type === 'text') {const story=doc.stories[o.storyId];setStoryStyle(story, styles[id], value);}
    else if (id === 'propBold') setStoryStyle(doc.stories[o.storyId], 'weight', event.target.checked ? 'bold' : 'normal');
    else if (id === 'propLocked') (publishing?.members() || [o]).forEach(member => member.locked = event.target.checked);
    else if (id === 'propFill') { o.fill = value; o.stroke = value; }
    else if (id === 'propOpacity') o.opacity = Number(value);
    else if (id === 'propFit') o.fit = value;
  });
});
$('applyStory').addEventListener('click', () => { const id = editingStoryId; if (doc.stories[id]) { const value = storyEditor.value(), next = clone(doc); Object.assign(next.stories[id], value); try { validatePublication(next); mutate(() => {Object.assign(doc.stories[id], value);delete doc.stories[id].pageNumberFormat;delete doc.stories[id].pageNumberValue;}); } catch { status('invalidProject'); return; } } $('storyDialog').close(); });
$('applySetup').addEventListener('click', () => {
  const next = clone(doc), dims = $('paperSize').value === 'custom' ? [Number($('customPageW').value), Number($('customPageH').value)] : [...PAPER[$('paperSize').value]]; if ($('paperSize').value !== 'custom' && $('landscape').checked) dims.reverse(); [next.width, next.height] = dims;
  next.bleed = Number($('pageBleed').value); next.safeArea = Number($('pageSafe').value); next.facingPages = $('facingPages').checked; next.rulerOrigin = { x: Number($('rulerOriginX').value), y: Number($('rulerOriginY').value) }; next.guides.locked = $('lockGuides').checked; next.guides.showHorizontal = $('showRulerH').checked; next.guides.showVertical = $('showRulerV').checked;
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
  if (move) { event.preventDefault(); mutate(() => { for (const item of publishing?.members() || [o]) if (!item.locked) { item.x = Math.max(-2000, Math.min(4000, item.x + move[0] * (event.shiftKey ? 10 : 1))); item.y = Math.max(-2000, Math.min(4000, item.y + move[1] * (event.shiftKey ? 10 : 1))); } }); $('pageSurface').focus({ preventScroll: true }); }
});
window.addEventListener('widget-i18n:changed', render);
window.addEventListener('resize', () => { renderThumbnails(); if ($('zoomSelect').value === 'fit') renderPage(); });
// Preserve the screen-computed fragments: print CSS hides editor-only elements.
window.addEventListener('beforeprint', () => renderOutput(true));
window.addEventListener('afterprint', () => renderOutput());
matchMedia('print').addEventListener('change', () => { if (doc) renderOutput(); });
window.addEventListener('pagehide', () => { if (unsaved) { clearTimeout(saveTimer); saveLocal(); } });
window.addEventListener('beforeunload', event => { if (unsaved) { event.preventDefault(); event.returnValue = ''; } });
async function boot() {
  if (!window.WidgetI18n || !window.JSZip) throw new Error('Local runtime assets did not load.');
  let loaded = false;
  try {
    const storage = workspaceStorage(), raw = storage.getItem(STORE);
    if (raw) { doc = validatePublication(JSON.parse(raw)); lastSaved = raw; loaded = true; }
    else if (storage.getItem(START_BLANK) === '1') { doc = newPublication(true); loaded = true; lastStatus = 'browserCleared'; }
    else doc = newPublication();
  } catch {
    try { doc = validatePublication(JSON.parse(workspaceStorage().getItem(BACKUP))); loaded = true; lastStatus = 'recovered'; } catch { doc = newPublication(); loaded = true; lastStatus = 'storageUnavailable'; }
  }
  if (!loaded && !isTransferredWorkspace()) {
    try { doc = await loadStarterPublication(); }
    catch (error) { console.warn('Starter newsletter unavailable; using the built-in example.', error); }
  }
  installPublishingUI();
  $('pictureInput').accept = MEDIA_ACCEPT; $('projectInput').accept = '.layoutsplat,.json,.svg,.idml,.sla,.zip,.pdf,.epub,.html,.htm,.pub,.pages,.ai,.eps,.ps,.indd,.indt,.qxp,.qxd,.qxt';
  document.body.insertAdjacentHTML('beforeend', '<input id="videoInput" type="file" accept="video/*,.mov,.mkv,.avi,.mpg,.mpeg,.m4v,.wmv,.flv,.mts,.m2ts,.ogv,.3gp" hidden><dialog id="mediaImportDialog"><p id="mediaProgress" role="status"></p><button type="button" id="mediaCancel" data-i18n="cancel">Cancel</button></dialog><dialog id="importReportDialog"><form method="dialog"><h2 data-i18n="conversionReport">Import / conversion report</h2><p id="importReportText" style="white-space:pre-wrap"></p><button data-i18n="close">Close</button></form></dialog>');
  $('videoInput').onchange = async event => { const file = event.target.files[0]; if (file) await importPicture(file); event.target.value = ''; };
  $('mediaImportDialog').addEventListener('cancel', event => { event.preventDefault(); $('mediaCancel').click(); });
  setupMovableDialogs(); storyEditor = setupStoryEditor();
  publishing = setupPublishing({ getDoc: () => doc, currentPage: page, editStory, goToObject: id => { const found=findObject(doc,id); if(found?.pageIndex>=0){activePage=found.pageIndex;linking=null;publishing.reset();select(id);} }, getSelected: () => selected, setSelected: id => selected = id, getSelectedObject: selectedObject, getLayout: () => layout, getIssues: () => issues, mutate, render, status, t, addObject, download, select, importPicture, mediaAccept: MEDIA_ACCEPT, showReport: showImportReport, replaceDoc: async next => { await rasterSample(next); checkpoint(); doc = validatePublication(next); activePage = 0; selected = null; publishing.reset(); render(); remember(); } });
  function transparency(event, commit) {
    const target = event.target, id = target.dataset.layerTransparency;
    if (!id && target.id !== 'propTransparency') return;
    const object = id ? findObject(doc, id)?.object : selectedObject(); if (!object || object.locked) return;
    const amount = Number(target.value); if (!Number.isFinite(amount) || amount < 0 || amount > 100) return;
    const objects = id ? [object] : publishing.members(), opacity = 1 - amount / 100;
    if (commit) mutate(() => objects.filter(o => !o.locked).forEach(o => o.opacity = opacity));
    else { for (const o of objects) { const el = $('pageSurface').querySelector(`[data-object-id="${CSS.escape(o.id)}"]`); if (el && !o.locked) el.style.opacity = opacity; } target.title = `${t('transparency')}: ${amount}%`; if (!id) $('transparencyValue').textContent = amount + '%'; }
  }
  $('propTransparency').oninput = event => transparency(event, false);
  $('propTransparency').onchange = event => { event.stopPropagation(); transparency(event, true); };
  $('layerList').oninput = event => transparency(event, false);
  $('layerList').onchange = event => transparency(event, true);
  await rasterSample(doc);
  await Promise.all(['12pt Arial', 'bold 12pt Arial', '12pt Georgia', '12pt Verdana'].map(font => document.fonts.load(font)));
  await document.fonts.ready;
  let fontRefresh;
  document.fonts.addEventListener('loadingdone', () => { clearTimeout(fontRefresh); fontRefresh = setTimeout(() => { if (!matchMedia('print').matches) render(); }, 50); });
  if (innerWidth <= 780) $('zoomSelect').value = 'fit';
  render();
  const incoming = await consumeTransferredFile('layoutsplat');
  if (incoming) await openProject(incoming, true); else if (!loaded) remember();
  // Read-only diagnostics let tests inspect the actual model and computed output.
  window.LayoutSplat = Object.freeze({ version: '0.6.0', getPublication: () => clone(doc), getLayout: () => ({ fragments: clone([...layout.fragments.entries()]), overflows: clone(layout.overflows), stats: clone(layout.stats) }), getFindings: () => clone(issues) });
}
boot().catch(error => { console.error(error); status('invalidProject'); });
