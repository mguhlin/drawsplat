import { uid, clone, frame, shape, textStyle, findObject, removeObject, validatePublication, linkFrames, unlinkFrame } from './engine.mjs';
import { TEMPLATE_TYPES, THEMES, makeTemplate } from './templates.mjs';
import { textToRichDocument, richDocumentToText } from './rich.mjs';
import { createRichEditor } from './rich-editor.mjs';
import { setupMerge } from './merge-ui.mjs';
import { setupExports } from './export-ui.mjs';
import { setupContextMenu } from './context-menu.mjs';
import { setupTemplateLibrary } from './template-library.mjs';
import { setupSuiteImport } from './suite-interchange.mjs';
import { setupLabelSettings } from './label-settings.mjs';
import { setupBackgroundLibrary } from './background-library.mjs';
import { setupFontTools } from './local-fonts.mjs';
export function setupPublishing(api) {
  const $ = id => document.getElementById(id), { t, mutate, render, status } = api;
  let editingMasterId = null, selection = new Set(), painter = null, richEditor = null, drawing = false, trace = null;
  const getDoc = api.getDoc, members = () => api.currentPage().objects.filter(o => selection.has(o.id));
  const merge = setupMerge(api), exports = setupExports(api);
  const context = setupContextMenu({ ...api, members, selectedIds: () => new Set(selection) });
  const library = setupTemplateLibrary(api);
  const backgrounds = setupBackgroundLibrary(api);
  const suite = setupSuiteImport(api);
  const labels = setupLabelSettings(api);
  const fontTools=setupFontTools(api);
  const bounds = () => { const list = members(); if (!list.length) return null; const x = Math.min(...list.map(o => o.x)), y = Math.min(...list.map(o => o.y)); return { x, y, w: Math.max(...list.map(o => o.x + o.w)) - x, h: Math.max(...list.map(o => o.y + o.h)) - y }; };
  function onSelect(id, event = {}) {
    if (!id) { selection.clear(); return null; }
    const object = findObject(getDoc(), id)?.object; if (!object) return null;
    const group = event.altKey ? null : object.groupIds?.at(-1);
    const ids = group ? api.currentPage().objects.filter(o => o.groupIds?.includes(group)).map(o => o.id) : [id];
    if (event.shiftKey) { if (selection.has(id)) ids.forEach(key => selection.delete(key)); else ids.forEach(key => selection.add(key)); }
    else if (!selection.has(id)) selection = new Set(ids);
    if (painter && object.type === 'text' && !object.locked) { mutate(() => { getDoc().stories[object.storyId].style = clone(painter); }); painter = null; }
    return selection.has(id) ? id : [...selection][0] || null;
  }
  function transformSelection(key, value) {
    const b = bounds(); if (!b) return;
    for (const o of members()) {
      if (o.locked) continue;
      if (key === 'x' || key === 'y') o[key] += value - b[key];
      if (key === 'w') { o.x = b.x + (o.x - b.x) * value / b.w; o.w *= value / b.w; }
      if (key === 'h') { o.y = b.y + (o.y - b.y) * value / b.h; o.h *= value / b.h; }
      if (key === 'rotation') { const angle = value * Math.PI / 180, cx = b.x + b.w / 2, cy = b.y + b.h / 2, ox = o.x + o.w / 2 - cx, oy = o.y + o.h / 2 - cy; o.x = cx + ox * Math.cos(angle) - oy * Math.sin(angle) - o.w / 2; o.y = cy + ox * Math.sin(angle) + oy * Math.cos(angle) - o.h / 2; o.rotation += value; }
    }
  }
  function duplicateSelection() {
    const list = members(), p = api.currentPage(), d = getDoc(); if (p.objects.length + list.length > 200) return status('pageLimit');
    mutate(() => { const storyIds = new Map(), groupIds = new Map(); selection.clear();
      for (const original of list) {
        const copy = clone(original); copy.id = uid(); copy.x += 12; copy.y += 12;
        if (copy.type === 'text') { const old = copy.storyId; if (!storyIds.has(old)) { const id = uid(); storyIds.set(old, id); d.stories[id] = { ...clone(d.stories[old]), frames: [] }; } copy.storyId = storyIds.get(old); d.stories[copy.storyId].frames.push(copy.id); }
        copy.groupIds = (copy.groupIds || []).map(id => { if (!groupIds.has(id)) groupIds.set(id, uid()); return groupIds.get(id); });
        p.objects.push(copy); selection.add(copy.id);
      }
      api.setSelected([...selection][0]);
    });
  }
  function copyObjects(objects) {
    const d = getDoc(), stories = new Map();
    return objects.map(original => { const o = clone(original); o.id = uid(); o.groupIds = [];
      if (o.type === 'text') { const old = o.storyId; if (!stories.has(old)) { const id = uid(); stories.set(old, id); d.stories[id] = { ...clone(d.stories[old]), frames: [] }; } o.storyId = stories.get(old); d.stories[o.storyId].frames.push(o.id); }
      return o;
    });
  }
  function renderExtras() {
    const d = getDoc(), p = api.currentPage(); selection = new Set([...selection].filter(id => p.objects.some(o => o.id === id)));
    if (api.getSelected() && !selection.has(api.getSelected())) selection = new Set([api.getSelected()]);
    if (!api.getSelected()) selection.clear();
    if ($('templateGrid') && !$('templateGrid').children.length) {
      for (const kind of TEMPLATE_TYPES) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'template-choice'; button.dataset.template = kind.id;
        const title = document.createElement('strong'); title.textContent = t(kind.id); const hint = document.createElement('span'); hint.textContent = kind.description; button.append(title, hint); $('templateGrid').append(button);
      }
    }
    const masterSelect = $('masterSelect'); if (masterSelect) { const prior = masterSelect.value; masterSelect.replaceChildren(new Option(t('noMaster'), '')); (d.masters || []).forEach(master => masterSelect.add(new Option(master.name, master.id))); masterSelect.value = editingMasterId || prior || p.masterId || ''; }
    if ($('masterModeNotice')) { $('masterModeNotice').hidden = !editingMasterId; $('masterModeNotice').textContent = editingMasterId ? `${t('editingMaster')} ${p.name}` : ''; }
    const override = $('masterObjectOverride'); if (override) { const old = override.value; override.replaceChildren(new Option(t('chooseMasterObject'), '')); const master = (d.masters || []).find(m => m.id === p.masterId); for (const o of master?.objects || []) override.add(new Option(o.type === 'text' ? d.stories[o.storyId].text.slice(0, 30) : t(o.type === 'image' ? 'picture' : 'rectangle'), o.id)); override.value = old; }
    const o = api.getSelectedObject();
    document.querySelectorAll('[data-action="labelSettings"]').forEach(b=>b.disabled=!d.labelLayout?.stock);
    document.querySelectorAll('#fileMenu [data-action="importText"]').forEach(b=>b.disabled=o?.type!=='text'||o.locked);
    if (o?.type === 'text') {
      const s = d.stories[o.storyId].style;
      const controls = { propColumns: o.columns || 1, propColumnGap: o.columnGap ?? 12, propDropCap: s.dropCap || 0, propAutoFit: s.autoFit || 'none', propMinSize: s.minSize || 8, propTracking: s.tracking || 0, propWordArt: s.wordArt || 'none',propKerning:s.kerning||'auto',propWordSpacing:s.wordSpacing||0,propTextScale:(s.textScale||1)*100 };
      for (const [id, value] of Object.entries(controls)) if ($(id) && $(id) !== document.activeElement) $(id).value = value;
      $('propBaselineAlign').checked = !!o.baselineAlign;
      $('propLigatures').checked=s.ligatures!==false;fontTools.render();
      if ($('autoFitInfo')) $('autoFitInfo').textContent = `${t('fontSize')}: ${api.getLayout().styles.get(o.storyId)?.size ?? s.size}`;
    }
    for (const key of ['bold', 'italic', 'underline']) { const button = document.querySelector(`[data-action="text-${key}"]`); button.disabled = o?.type !== 'text' || o.locked; button.setAttribute('aria-pressed', String(o?.type === 'text' && (key === 'bold' ? d.stories[o.storyId].style.weight === 'bold' : !!d.stories[o.storyId].style[key]))); }
    if (o?.type === 'image' && $('propImageOpacity')) { $('propImageOpacity').value = o.opacity ?? 1; $('propWrap').value = o.wrap || 'none'; $('pictureAlt').value = d.assets[o.assetId].alt || ''; }
    $('previewMediaButton').hidden = o?.type !== 'image' || !d.assets[o.assetId]?.media;
    $('groupSelectionCount').textContent = t('selectedCount', { count: selection.size });
  }
  function editRichStory() {
    const o = api.getSelectedObject(); if (o?.type !== 'text' || o.locked) return;
    richEditor?.destroy(); const s = getDoc().stories[o.storyId]; $('richStoryEditor').replaceChildren(); richEditor = createRichEditor($('richStoryEditor'), textToRichDocument(s)); $('richStoryEditor').dir = s.style.direction;
    $('richStoryDialog').dataset.storyId = o.storyId; $('richStoryDialog').showModal(); richEditor.view.focus();
  }
  document.addEventListener('click', event => {
    const template = event.target.closest('[data-template]');
    if (template) { const next = makeTemplate(template.dataset.template, $('templateTheme').value); if (confirm(t('replaceConfirm'))) api.replaceDoc(next); $('templateDialog').close(); }
    const rich = event.target.closest('[data-rich]'); if (rich && richEditor) richEditor.toggle(rich.dataset.rich);
  });
  $('applyRichStory').onclick = () => { const id = $('richStoryDialog').dataset.storyId, value = richDocumentToText(richEditor.value(), getDoc().stories[id].style); mutate(() => { const story = getDoc().stories[id]; Object.assign(story, value); }); $('richStoryDialog').close(); };
  $('richStoryDialog').addEventListener('close', () => { richEditor?.destroy(); richEditor = null; });
  $('richColor').onchange = () => richEditor?.style({ color: $('richColor').value });
  $('richSize').onchange = () => richEditor?.style({ size: Number($('richSize').value) });
  $('richLink').onclick = () => { const href = prompt(t('linkPrompt'), 'https://'); if (href) try { richEditor.link(href); } catch { status('linkError'); } };
  const propertyMap = { propDropCap: ['dropCap', true], propAutoFit: ['autoFit', false], propMinSize: ['minSize', true], propTracking: ['tracking', true], propWordArt: ['wordArt', false],propKerning:['kerning',false],propWordSpacing:['wordSpacing',true],propTextScale:['textScale',true] };
  $('propLigatures').onchange=e=>{e.stopImmediatePropagation();const o=api.getSelectedObject();if(o?.type==='text'&&!o.locked)mutate(()=>getDoc().stories[o.storyId].style.ligatures=e.target.checked);};
  $('propBaselineAlign').addEventListener('change', event => { event.stopImmediatePropagation(); const o = api.getSelectedObject(); if (o?.type === 'text' && !o.locked) mutate(() => o.baselineAlign = event.target.checked); });
  for (const [id, [key, numeric]] of Object.entries(propertyMap)) $(id).addEventListener('change', event => { event.stopImmediatePropagation(); const o = api.getSelectedObject(); if (o?.type !== 'text' || o.locked) return;
    const next = clone(getDoc()); next.stories[o.storyId].style[key] = numeric ? Number(event.target.value) : event.target.value;
    if(id==='propTextScale')next.stories[o.storyId].style[key]/=100;
    try { validatePublication(next); mutate(() => {getDoc().stories[o.storyId].style[key] = next.stories[o.storyId].style[key];if(id==='propTracking')for(const m of getDoc().stories[o.storyId].marks||[])delete m.tracking;}); } catch { status('invalidMeasure'); render(); }
  });
  for (const [id, key] of [['propColumns', 'columns'], ['propColumnGap', 'columnGap']]) $(id).addEventListener('change', event => { event.stopImmediatePropagation(); const o = api.getSelectedObject(); if (o?.type !== 'text' || o.locked) return; const next = clone(getDoc()); findObject(next, o.id).object[key] = Number(event.target.value); try { validatePublication(next); mutate(() => o[key] = Number(event.target.value)); } catch { status('invalidMeasure'); render(); } });
  $('propImageOpacity').addEventListener('change', event => { event.stopImmediatePropagation(); const o = api.getSelectedObject(); if (o?.type === 'image' && !o.locked) mutate(() => o.opacity = Number(event.target.value)); });
  $('propWrap').addEventListener('change', event => { event.stopImmediatePropagation(); const o = api.getSelectedObject(); if (o?.type === 'image' && !o.locked) mutate(() => o.wrap = event.target.value); });
  $('pictureAlt').addEventListener('change', event => { event.stopImmediatePropagation(); const o = api.getSelectedObject(); if (o?.type === 'image' && !o.locked) mutate(() => getDoc().assets[o.assetId].alt = event.target.value.slice(0, 2000)); });
  $('applyTable').onclick = () => {
    const rows = $('tableCells').value.split('\n').filter(Boolean).map(line => line.split('\t')), cols = Math.max(...rows.map(row => row.length), 0);
    if (!rows.length || rows.length > 200 || cols > 20 || rows.some(row => row.some(cell => cell.length > 5000))) return status('invalidMeasure');
    rows.forEach(row => { while (row.length < cols) row.push(''); }); const existing = findObject(getDoc(), $('tableDialog').dataset.objectId)?.object;
    if (existing?.locked) return status('lockedNotice');
    if (existing) mutate(() => { existing.cells = rows; existing.header = $('tableHeader').checked; });
    else api.addObject({ id: uid(), type: 'table', x: getDoc().margin, y: getDoc().margin, w: Math.min(400, getDoc().width - 2 * getDoc().margin), h: Math.min(500, rows.length * 30), rotation: 0, locked: false, cells: rows, header: $('tableHeader').checked, fontSize: 12 });
    $('tableDialog').close();
  };
  const point = event => { const box = $('pageSurface').getBoundingClientRect(); return { x: Math.max(0, Math.min(getDoc().width, (event.clientX - box.x) * getDoc().width / box.width)), y: Math.max(0, Math.min(getDoc().height, (event.clientY - box.y) * getDoc().height / box.height)) }; };
  $('pageSurface').addEventListener('pointerdown', event => { if (!drawing) return; event.preventDefault(); event.stopImmediatePropagation(); trace = [point(event)]; $('pageSurface').setPointerCapture(event.pointerId); }, true);
  $('pageSurface').addEventListener('pointermove', event => { if (!trace) return; event.stopImmediatePropagation(); trace.push(point(event)); if (trace.length > 2000) trace.splice(1, 1); }, true);
  $('pageSurface').addEventListener('pointerup', event => { if (!trace) return; event.stopImmediatePropagation(); const points = trace; trace = null; drawing = false; document.body.classList.remove('drawing-mode'); if (points.length < 2) return; const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y)), w = Math.max(6, Math.max(...points.map(p => p.x)) - x), h = Math.max(6, Math.max(...points.map(p => p.y)) - y), o = shape(x, y, w, h, getDoc().brand?.accent || '#7c3aed', 'path'); o.path = points.map((p, i) => `${i ? 'L' : 'M'}${(p.x - x).toFixed(2)} ${(p.y - y).toFixed(2)}`).join(''); o.noFill = true; o.strokeWidth = 2; api.addObject(o); }, true);
  $('pageSurface').addEventListener('pointercancel', () => { trace = null; drawing = false; document.body.classList.remove('drawing-mode'); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && drawing) { trace = null; drawing = false; document.body.classList.remove('drawing-mode'); } });
  async function action(name) {
    const d = getDoc(), p = api.currentPage(), o = api.getSelectedObject(), list = members();
    if (await context.action(name)) return true;
    if(name==='importFont'){fontTools.open();return true;}
    if (name === 'contextLink') {
      const boxes = list.filter(o => o.type === 'text').sort((a,b) => a.y - b.y || a.x - b.x);
      if (boxes.length < 2) return false; // The existing Link action chooses a destination.
      if (boxes.length !== list.length || boxes.some(o => o.locked)) return true;
      try { mutate(() => { for (const target of boxes.slice(1)) if (target.storyId !== boxes[0].storyId) linkFrames(d, boxes[0].id, target.id); }); } catch (e) { api.showReport([e.message]); } return true;
    }
    if (name === 'unlinkTextBoxes') { if (o?.type === 'text' && !o.locked) try { mutate(() => unlinkFrame(d, o.id, api.getLayout())); } catch (e) { api.showReport([e.message]); } return true; }
    if (name === 'whiteboardBackgrounds') { await backgrounds.open(); return true; }
    if (name === 'importSuite') { suite.open(); return true; }
    if (name === 'templateLibrary' || name === 'browseTemplates' || name === 'templates' || ['labelTemplates','cardTemplates','menuTemplates'].includes(name)) { if ($('templateDialog').open) $('templateDialog').close(); library.open({labelTemplates:'labels',cardTemplates:'business-card',menuTemplates:'menu'}[name]); return true; }
    if(name==='labelSettings'){labels.open();return true;}
    if (name === 'publisherSettings') { $('publisherSettingsDialog').showModal(); return true; }
    if (name === 'merge') { merge.open(); return true; }
    if (name === 'exports' || name === 'shareExports') { exports.open(); return true; }
    if(name.startsWith('export-')){exports.open(name.slice(7));return true;}
    if (name === 'previewMedia' && o?.type === 'image' && d.assets[o.assetId]?.media) { const a = d.assets[o.assetId]; let dialog = $('mediaPreviewDialog'); if (!dialog) { dialog = document.createElement('dialog'); dialog.id = 'mediaPreviewDialog'; document.body.append(dialog); dialog.addEventListener('close', () => { dialog.querySelector('video')?.pause(); dialog.replaceChildren(); }); } const player = document.createElement(a.media.kind === 'video' ? 'video' : 'img'); player.src = a.media.src; player.style.maxWidth = '100%'; player.style.maxHeight = '65vh'; if (a.media.kind === 'video') { player.controls = true; player.poster = a.src; } else player.alt = a.alt || a.name; const close = document.createElement('button'); close.textContent = t('close'); close.onclick = () => dialog.close(); dialog.replaceChildren(player, close); dialog.showModal(); return true; }
    if (name.startsWith('text-') && ['bold', 'italic', 'underline'].includes(name.slice(5))) { if (o?.type === 'text' && !o.locked) mutate(() => { const key = name.slice(5), s = d.stories[o.storyId].style; if (key === 'bold') s.weight = s.weight === 'bold' ? 'normal' : 'bold'; else s[key] = !s[key]; for (const mark of d.stories[o.storyId].marks || []) delete mark[key]; }); return true; }
    if (editingMasterId && ['addPage', 'deletePage', 'duplicatePage', 'createMaster', 'applyMaster', 'applyMasterAll', 'applyMasterLeft', 'applyMasterRight', 'pageNumbers'].includes(name)) { status('returnToPages'); return true; }
    if (name === 'templates') { renderExtras(); $('templateDialog').showModal(); return true; }
    if (name === 'richStory') { editRichStory(); return true; }
    if (name === 'masters') { renderExtras(); $('mastersDialog').showModal(); return true; }
    if (name === 'table') { $('tableDialog').dataset.objectId = o?.type === 'table' ? o.id : ''; if (o?.type === 'table') { $('tableCells').value = o.cells.map(row => row.join('\t')).join('\n'); $('tableHeader').checked = o.header; } $('tableDialog').showModal(); return true; }
    if (name === 'pen') { drawing = !drawing; document.body.classList.toggle('drawing-mode', drawing); status('drawHint'); return true; }
    if (name === 'customShape') { const path = prompt(t('pathPrompt'), 'M0 0L160 55L0 110Z'); if (path && path.length < 64000 && /^[MmLlHhVvCcSsQqTtAaZz0-9+., eE\-\s]+$/.test(path)) { const o = shape(d.margin, d.margin, 160, 110, '#7c3aed', 'path'); o.path = path; api.addObject(o); } return true; }
    if (name === 'cropImage') { if (o?.type === 'image' && !o.locked) { const values = ['cropX', 'cropY', 'cropW', 'cropH'].map(id => Number($(id).value)); if (values.some(v => !Number.isFinite(v)) || values[0] < 0 || values[1] < 0 || values[2] < 1 || values[3] < 1 || values[0] + values[2] > 100 || values[1] + values[3] > 100) return status('invalidMeasure'), true; const a = d.assets[o.assetId], image = new Image(); image.src = a.src; await image.decode(); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(a.width * values[2] / 100)); canvas.height = Math.max(1, Math.round(a.height * values[3] / 100)); canvas.getContext('2d').drawImage(image, a.width * values[0] / 100, a.height * values[1] / 100, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height); mutate(() => { const id = uid(); d.assets[id] = { name: a.name, alt: a.alt || '', width: canvas.width, height: canvas.height, src: canvas.toDataURL('image/png') }; o.assetId = id; }); ['cropX', 'cropY'].forEach(id => $(id).value = 0); ['cropW', 'cropH'].forEach(id => $(id).value = 100); } return true; }
    if (name === 'saveTemplate') { const zip = new JSZip(); zip.file('publication.json', JSON.stringify({ ...d, template: true }, null, 2)); zip.file('README.txt', 'LayoutSplat reusable publication template. Open the .layoutsplat file, then save your own publication.'); api.download(await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), '.template.layoutsplat'); return true; }
    if (name === 'applyStyle') { if (o?.type === 'text' && !o.locked) mutate(() => { const style = d.styles?.[$('paragraphStyle').value] || ($('paragraphStyle').value === 'heading' ? { size: 28, weight: 'bold' } : $('paragraphStyle').value === 'caption' ? { size: 10 } : { size: 12, weight: 'normal' }); Object.assign(d.stories[o.storyId].style, style); }); return true; }
    if (name === 'saveStyle') { if (o?.type === 'text') mutate(() => { (d.styles ||= {})[$('paragraphStyle').value] = clone(d.stories[o.storyId].style); }); return true; }
    if (name === 'group') { if (list.length > 1) mutate(() => { const id = uid(); list.forEach(o => (o.groupIds ||= []).push(id)); }); return true; }
    if (name === 'ungroup') { if (list.length) mutate(() => { const id = list[0].groupIds?.at(-1); if (id) p.objects.forEach(o => o.groupIds = (o.groupIds || []).filter(g => g !== id)); }); return true; }
    if (name === 'selectAll') { selection = new Set(p.objects.map(o => o.id)); api.setSelected([...selection][0] || null); render(); return true; }
    if (name === 'duplicateObject' && list.length > 1) { duplicateSelection(); return true; }
    if (name === 'deleteObject' && list.length > 1) { mutate(() => { list.filter(o => !o.locked).forEach(o => removeObject(d, o.id)); selection.clear(); api.setSelected(null); }); return true; }
    if (name.startsWith('align-') && list.length) {
      const mode = name.slice(6), b = bounds(); mutate(() => list.filter(o => !o.locked).forEach(o => { if (mode === 'left') o.x = list.length === 1 ? d.margin : b.x; if (mode === 'right') o.x = (list.length === 1 ? d.width - d.margin : b.x + b.w) - o.w; if (mode === 'center') o.x = (list.length === 1 ? d.width / 2 : b.x + b.w / 2) - o.w / 2; if (mode === 'top') o.y = list.length === 1 ? d.margin : b.y; if (mode === 'bottom') o.y = (list.length === 1 ? d.height - d.margin : b.y + b.h) - o.h; if (mode === 'middle') o.y = (list.length === 1 ? d.height / 2 : b.y + b.h / 2) - o.h / 2; })); return true;
    }
    if (name.startsWith('distribute-')) { const axis = name.endsWith('horizontal') ? 'x' : 'y', size = axis === 'x' ? 'w' : 'h', sorted = list.filter(o => !o.locked).sort((a, b) => a[axis] - b[axis]); if (sorted.length > 2) mutate(() => { const first = sorted[0][axis], last = sorted.at(-1)[axis] + sorted.at(-1)[size], gap = (last - first - sorted.reduce((sum, o) => sum + o[size], 0)) / (sorted.length - 1); let pos = first; sorted.forEach(o => { o[axis] = pos; pos += o[size] + gap; }); }); return true; }
    if (name === 'formatPainter') { if (o?.type === 'text') { painter = clone(d.stories[o.storyId].style); status('paintHint'); } return true; }
    if (['triangle', 'hexagon', 'arrow', 'star', 'heart', 'callout', 'border'].includes(name)) { api.addObject(shape(d.margin + 12, d.margin + 12, name === 'border' ? d.width - d.margin * 2 : 160, name === 'border' ? d.height - d.margin * 2 : 110, d.brand?.accent || '#7c3aed', name)); return true; }
    if (name === 'watermark') { if (o?.type === 'image' && !o.locked) mutate(() => { o.x = 0; o.y = 0; o.w = d.width; o.h = d.height; o.opacity = .15; o.fit = 'cover'; p.objects = p.objects.filter(item => item !== o); p.objects.unshift(o); }); return true; }
    if (name === 'createMaster') { if ((d.masters || []).length >= 20) return true; const name = prompt(t('masterName'), `${t('master')} ${(d.masters || []).length + 1}`); if (name) mutate(() => { const objects = [...(list.length ? list : p.objects)], master = { id: uid(), name: name.slice(0, 80), objects }; p.objects = p.objects.filter(o => !objects.includes(o)); selection.clear(); api.setSelected(null); (d.masters ||= []).push(master); p.masterId = master.id; }); return true; }
    if (name === 'applyMaster') { mutate(() => { p.masterId = $('masterSelect').value || null; p.masterOverrides = []; }); return true; }
    if (name === 'applyMasterAll') { mutate(() => d.pages.forEach(p => { p.masterId = $('masterSelect').value || null; p.masterOverrides = []; })); return true; }
    if (name === 'applyMasterLeft' || name === 'applyMasterRight') { mutate(() => d.pages.forEach((p, index) => { if (index % 2 === (name === 'applyMasterLeft' ? 1 : 0)) { p.masterId = $('masterSelect').value || null; p.masterOverrides = []; } })); return true; }
    if (name === 'editMaster') { editingMasterId = editingMasterId ? null : $('masterSelect').value; selection.clear(); api.setSelected(null); $('mastersDialog').close(); render(); return true; }
    if (name === 'hideMasterObject') { const id = $('masterObjectOverride').value; if (id) mutate(() => (p.masterOverrides ||= []).push(id)); return true; }
    if (name === 'resetMasterOverrides') { mutate(() => p.masterOverrides = []); return true; }
    if (name === 'pageNumbers') { const value = prompt(t('pageNumberPrompt'), 'Page {page} of {total}'); if (value) mutate(() => { d.pages.forEach((p, i) => { const storyId = uid(), f = frame(storyId, d.margin, d.height - d.margin - 20, d.width - 2 * d.margin, 20); f.padding = 0; d.stories[storyId] = { text: value.replaceAll('{page}', String(i + 1)).replaceAll('{total}', String(d.pages.length)), style: { ...textStyle(), size: 9 }, frames: [f.id] }; p.objects.push(f); }); }); return true; }
    if (name === 'growFrame') { if (o?.type === 'text' && !o.locked) { const overflow = api.getLayout().overflows.find(f => f.storyId === o.storyId); if (overflow) mutate(() => { const last = findObject(d, overflow.frameId).object; last.h = Math.min(2000, last.h + Math.ceil(overflow.remaining / Math.max(1, Math.floor(last.w / (d.stories[o.storyId].style.size * .55)))) * d.stories[o.storyId].style.size * d.stories[o.storyId].style.lineHeight); }); } return true; }
    return false;
  }
  return { action, render: renderExtras, onSelect, members, bounds, selectedIds: () => new Set(selection), masterId: () => editingMasterId, transformSelection, reset: () => { editingMasterId = null; selection.clear(); } };
}
