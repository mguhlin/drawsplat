import {translate as tr} from './i18n.js';
import {FRAME_OPTIONS} from './panel-frames.js';

export const IMAGE_CARDS_MARKUP = `<section class="panel"><h2><span class="step">04</span>Additional image cards</h2><p class="hint">Insert image cards anywhere in your video. Each card pauses the video, then playback resumes.</p><button type="button" id="add-image-cards">Add image cards</button><input type="file" id="image-cards-file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple hidden aria-label="Images for additional cards"><div id="image-cards-list"></div><small>Insert times refer to the remaining video, without panels or other cards. Cards use silence while they are shown. Set seconds to 0 to skip a card.</small></section>`;

export async function readCardImage(file) {
  if (!['image/png','image/jpeg','image/webp','image/gif','image/avif'].includes(file.type)) throw new Error('This image could not be opened. Try a PNG, JPEG or WebP image.');
  if (file.size > 15*1024*1024) throw new Error('Choose an image smaller than 15 MB.');
  const url = URL.createObjectURL(file), image = new Image();
  image.src = url;
  try {
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error('Choose an image with fewer than 40 million pixels.');
    return {image,url,name:file.name};
  } catch (error) {
    URL.revokeObjectURL(url);
    throw new Error(error.message.includes('40 million') ? error.message : 'This image could not be opened. Try a PNG, JPEG or WebP image.');
  }
}

export function createImageCardsEditor({getState,onChange,onPreview,onRemove,onReplace}) {
  const root = document.getElementById('image-cards-list');
  let signature;
  function update() {
    const {cards, positionOf, maxPosition, locked, hasSource} = getState();
    const next = document.documentElement.lang + cards.map(card=>card.id).join('|');
    let restoreFocus;
    if (next !== signature) {
      const active = document.activeElement;
      if (root.contains(active)) {
        const oldCard = active.closest('[data-card-id]');
        const oldIndex = [...root.children].indexOf(oldCard);
        const id = cards.some(card=>card.id === oldCard.dataset.cardId)
          ? oldCard.dataset.cardId : cards[Math.min(oldIndex,cards.length-1)]?.id;
        restoreFocus = {id,field:active.dataset.field,action:active.dataset.action,
          start:active.selectionStart,end:active.selectionEnd};
      }
      root.replaceChildren();
      for (const [index,card] of cards.entries()) {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'title-panel extra-image-card';
        fieldset.dataset.cardId = card.id;
        fieldset.innerHTML = `<legend>${tr('Image card {number}',{number:index+1})}</legend><div class="panel-image-details"><img alt=""><span class="card-filename"></span></div><div class="panel-image-controls"><button type="button" data-action="replace">${tr('Replace image')}</button><input type="file" data-field="image" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden aria-label="${tr('Replacement image')}"><button type="button" data-action="remove">${tr('Remove card')}</button></div><label>${tr('Title (optional)')}<textarea data-field="title" maxlength="180"></textarea></label><div class="row"><label>${tr('Insert at (video seconds)')}<input data-field="at" type="number" min="0" step="0.1"></label><label>${tr('Card seconds · 0 to skip')}<input data-field="seconds" type="number" min="0" max="10" step="0.5"></label></div><div class="row"><label>${tr('Panel frame')}<select data-field="frame">${FRAME_OPTIONS.map(([value,label])=>`<option value="${value}">${tr(label)}</option>`).join('')}</select></label><label>${tr('Panel color')}<input data-field="color" type="color"></label></div><button type="button" data-action="preview">${tr('Preview card')}</button>`;
        root.append(fieldset);
      }
      signature = next;
    }
    for (const card of cards) {
      const element = root.querySelector(`[data-card-id="${card.id}"]`);
      const thumbnail = element.querySelector('img');
      if (thumbnail.getAttribute('src') !== card.url) thumbnail.src = card.url;
      element.querySelector('.card-filename').textContent = card.name;
      for (const field of element.querySelectorAll('[data-field]')) {
        field.disabled = locked || (field.dataset.field === 'at' && !hasSource);
        if (field.dataset.field === 'image') continue;
        if (document.activeElement !== field) field.value = field.dataset.field === 'at' ? positionOf(card).toFixed(2) : card[field.dataset.field];
        if (field.dataset.field === 'at') field.max = maxPosition;
      }
      for (const button of element.querySelectorAll('button')) button.disabled = locked;
    }
    document.getElementById('add-image-cards').disabled = locked;
    document.getElementById('image-cards-file').disabled = locked;
    if (restoreFocus && !locked) {
      const card = [...root.children].find(node=>node.dataset.cardId === restoreFocus.id);
      const target = card?.querySelector(restoreFocus.field ? `[data-field="${restoreFocus.field}"]` : `[data-action="${restoreFocus.action}"]`)
        || document.getElementById('add-image-cards');
      target.focus();
      if (restoreFocus.start != null && target.tagName === 'TEXTAREA')
        target.setSelectionRange(restoreFocus.start,restoreFocus.end);
    }
  }
  root.oninput = event => {
    const field = event.target.dataset.field;
    const id = event.target.closest('[data-card-id]')?.dataset.cardId;
    if (!id || !field || field === 'image') return;
    onChange(id,field,event.target.value);
  };
  root.addEventListener('focusout',()=>setTimeout(update,0));
  root.onchange = async event => {
    if (event.target.dataset.field !== 'image') return;
    const file = event.target.files[0];
    event.target.value = '';
    if (file) await onReplace(event.target.closest('[data-card-id]').dataset.cardId,file);
  };
  root.onclick = event => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const fieldset = button.closest('[data-card-id]'), id = fieldset.dataset.cardId;
    if (button.dataset.action === 'preview') onPreview(id);
    if (button.dataset.action === 'remove') onRemove(id);
    if (button.dataset.action === 'replace') fieldset.querySelector('[data-field=image]').click();
  };
  return {update};
}
