import { clone, uid, findObject } from './engine.mjs';
import { TEXT_ACCEPT, importText } from './text-import.mjs';
export function setupContextMenu(api) {
  const $ = id => document.getElementById(id), { t } = api; let copied = null;
  document.body.insertAdjacentHTML('beforeend', `<div id="objectContextMenu" role="menu" aria-label="Object actions" hidden></div><input id="textImportInput" type="file" accept="${TEXT_ACCEPT}" hidden><input id="replaceMediaInput" type="file" hidden>`);
  const menu = $('objectContextMenu');
  function close() { menu.hidden = true; }
  function open(x, y, objectId) {
    if (document.querySelector('dialog[open]')) return;
    if (objectId) api.select(objectId); // Preserve multi-selection while targeting the clicked member.
    const o = api.getSelectedObject(), locked = o?.locked; menu.replaceChildren();
    const button = (action, key, disabled = false) => { const el = document.createElement('button'); el.type = 'button'; el.role = 'menuitem'; el.dataset.action = action; el.textContent = t(key); el.disabled = disabled; menu.append(el); };
    if (o?.type === 'text') { button('richStory', 'richText', locked); button('contextLink', 'linkTextBoxes', locked || api.members().some(m => m.locked || m.type !== 'text') || api.members().length > 1 && new Set(api.members().map(m => m.storyId)).size === 1); if (api.getDoc().stories[o.storyId].frames.length > 1) button('unlinkTextBoxes', 'unlinkTextBoxes', locked); button('importText', 'importText', locked); button('appendText', 'appendText', locked); button('pasteText', 'pasteText', locked); button('continue', 'continueStory', locked); }
    if (o?.type === 'image') { button('replaceMedia', api.getDoc().assets[o.assetId].media?.kind === 'video' ? 'replaceVideo' : 'replacePicture', locked); if (api.getDoc().assets[o.assetId].media) button('previewMedia', 'previewMedia'); button('watermark', 'watermark', locked); button('cropImage', 'applyCrop', locked); }
    if (o?.type === 'table') button('table', 'editTable', locked);
    if (o) { button('copyObject', 'copyObject'); button('duplicateObject', 'duplicate', locked); button('contextLock', locked ? 'unlockObject' : 'lockObject'); button('front', 'bringFront', locked); button('back', 'sendBack', locked); button('group', 'group', locked || api.members().length < 2); button('ungroup', 'ungroup', locked || !o.groupIds?.length); button('deleteObject', 'delete', locked); }
    button('pasteObject', 'pasteObject', !copied); if (!o) { button('text', 'textFrame'); button('image', 'picture'); button('video', 'video'); button('selectAll', 'selectAll'); button('templates', 'templates'); }
    menu.hidden = false; Object.assign(menu.style, { left: `${Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8))}px`, top: `${Math.max(8, Math.min(y, innerHeight - menu.offsetHeight - 8))}px` }); menu.querySelector('button:not(:disabled)')?.focus();
  }
  $('pageSurface').addEventListener('contextmenu', event => { event.preventDefault(); open(event.clientX, event.clientY, event.target.closest('[data-object-id]')?.dataset.objectId); });
  $('pageSurface').addEventListener('pointerdown', event => { if (event.button === 0 && (event.metaKey || event.ctrlKey && /Mac|iPhone|iPad/.test(navigator.platform))) { event.preventDefault(); event.stopImmediatePropagation(); open(event.clientX, event.clientY, event.target.closest('[data-object-id]')?.dataset.objectId); } }, true);
  document.addEventListener('keydown', event => {
    if (!menu.hidden) { const buttons = [...menu.querySelectorAll('button:not(:disabled)')], index = buttons.indexOf(document.activeElement); if (event.key === 'Escape') { close(); $('pageSurface').focus(); event.preventDefault(); } if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); } return; }
    if ((event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10') && !event.target.closest('input,textarea,select,[contenteditable]')) { event.preventDefault(); const o = api.getSelectedObject(), el = o && $('pageSurface').querySelector(`[data-object-id="${CSS.escape(o.id)}"]`), box = (el || $('pageSurface')).getBoundingClientRect(); open(box.left + 20, box.top + 20, o?.id); }
  });
  document.addEventListener('pointerdown', event => { if (!menu.contains(event.target)) close(); }, true);
  menu.addEventListener('click', event => { if (event.target.closest('button')) close(); }); window.addEventListener('resize', close);
  $('textImportInput').onchange = async event => {
    const file = event.target.files[0], objectId = event.target.dataset.objectId, append = event.target.dataset.append === 'true'; event.target.value = ''; if (!file) return;
    try { const imported = await importText(file), o = findObject(api.getDoc(), objectId)?.object; if (!o || o.type !== 'text' || o.locked) return; const story = api.getDoc().stories[o.storyId], offset = append ? story.text.length + (story.text ? 1 : 0) : 0;
      if (offset + imported.text.length > 100000) throw Error(t('textImportError'));
      api.mutate(() => { delete story.paragraphs; if (append) { story.text += (story.text ? '\n' : '') + imported.text; story.marks = [...(story.marks || []), ...imported.marks.map(m => ({ ...m, from: m.from + offset, to: m.to + offset }))]; } else { story.text = imported.text; story.marks = imported.marks; } }); if (imported.notes.length) api.showReport(imported.notes);
    } catch (error) { api.showReport([t('textImportError'), error?.message || String(error)]); }
  };
  $('replaceMediaInput').accept = api.mediaAccept;
  $('replaceMediaInput').onchange = async event => { const file = event.target.files[0], id = event.target.dataset.objectId; event.target.value = ''; if (file) await api.importPicture(file, id); };
  async function action(name) {
    const o = api.getSelectedObject(), d = api.getDoc();
    if (name === 'importText' || name === 'appendText') { if (o?.type === 'text' && !o.locked) { $('textImportInput').dataset.objectId = o.id; $('textImportInput').dataset.append = String(name === 'appendText'); $('textImportInput').click(); } return true; }
    if (name === 'replaceMedia') { if (o?.type === 'image' && !o.locked) { $('replaceMediaInput').dataset.objectId = o.id; $('replaceMediaInput').click(); } return true; }
    if (name === 'contextLock') { if (o) { const locked = !o.locked; api.mutate(() => api.members().forEach(item => item.locked = locked)); } return true; }
    if (name === 'pasteText') { if (o?.type === 'text' && !o.locked) try { const text = await navigator.clipboard.readText(); if (text.length > 100000) throw Error(t('textImportError')); api.mutate(() => { d.stories[o.storyId].text = text; d.stories[o.storyId].marks = []; delete d.stories[o.storyId].paragraphs; }); } catch { api.showReport([t('clipboardHint')]); } return true; }
    if (name === 'copyObject') { copied = { objects: clone(api.members()), stories: {}, assets: {} }; copied.objects.forEach(o => { if (o.type === 'text') copied.stories[o.storyId] = clone(d.stories[o.storyId]); if (o.type === 'image') copied.assets[o.assetId] = clone(d.assets[o.assetId]); }); return true; }
    if (name === 'pasteObject') { if (copied && api.currentPage().objects.length + copied.objects.length <= 200) api.mutate(() => { const stories = new Map(), assets = new Map(), groups = new Map(); for (const original of copied.objects) { const o = clone(original); o.id = uid(); o.x += 12; o.y += 12; o.locked = false;
      if (o.type === 'text') { const old = o.storyId; if (!stories.has(old)) { const id = uid(); stories.set(old, id); d.stories[id] = { ...clone(copied.stories[old]), frames: [] }; } o.storyId = stories.get(old); d.stories[o.storyId].frames.push(o.id); }
      if (o.type === 'image') { const old = o.assetId; if (!assets.has(old)) { const id = uid(); assets.set(old, id); d.assets[id] = clone(copied.assets[old]); } o.assetId = assets.get(old); }
      o.groupIds = (o.groupIds || []).map(g => { if (!groups.has(g)) groups.set(g, uid()); return groups.get(g); }); api.currentPage().objects.push(o); api.setSelected(o.id);
    } }); return true; }
    return false;
  }
  return { action, close };
}
