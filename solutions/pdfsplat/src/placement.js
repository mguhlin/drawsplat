// Pending insertions are previews only; history starts when the user places them.
export function setupPlacement({ layer, bar, message, cancelButton, currentPage, insert, leave, scale }) {
  let pending = null, point = { x: .35, y: .35 };
  function cancel() {
    const old = pending;
    pending = null;
    layer.classList.remove('placing');
    layer.querySelector('.placement-preview')?.remove();
    bar.hidden = true;
    message.textContent = "";
    old?.cleanup?.();
  }
  function positioned() {
    const object = { ...pending.object };
    // Keep the full object on the page when a point is near the bottom/right edge.
    object.x = Math.max(0, Math.min(1 - object.w, point.x));
    object.y = Math.max(0, Math.min(1 - object.h, point.y));
    return object;
  }
  function render() {
    layer.querySelector('.placement-preview')?.remove();
    if (!pending) return;
    if (currentPage()?.id !== pending.pageId) { leave(); return; }
    const object = positioned(), preview = document.createElement('div');
    preview.className = 'placement-preview';
    preview.setAttribute('aria-hidden', 'true');
    Object.assign(preview.style, {left:`${object.x*100}%`, top:`${object.y*100}%`, width:`${object.w*100}%`, height:`${object.h*100}%`});
    if (pending.url) {
      const image = document.createElement('img'); image.src = pending.url; image.alt = ''; preview.append(image);
    } else { preview.textContent = object.text; preview.style.fontSize = `${object.fontSize * scale()}px`; preview.style.fontFamily = object.fontFamily || 'Arial, sans-serif'; preview.style.lineHeight = '1'; }
    layer.append(preview);
  }
  function begin(object, label, { url, cleanup } = {}) {
    cancel();
    pending = { object, label, url, cleanup, pageId: currentPage().id };
    point = { x: .35, y: .35 };
    layer.classList.add('placing');
    message.textContent = `Click or tap the page to place ${label}. Arrow keys move the preview; Enter places it. Escape cancels.`;
    bar.hidden = false;
    render(); layer.focus({ preventScroll: true });
  }
  function place() {
    if (!pending) return;
    if (currentPage()?.id !== pending.pageId) { leave(); return; }
    const object = positioned(), label = pending.label;
    pending.cleanup = null; // The placed image now belongs to the document/history.
    cancel();
    insert(object, label);
  }
  function pointerPoint(event) {
    const rect = layer.getBoundingClientRect();
    point = { x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)), y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height)) };
  }
  layer.addEventListener('pointermove', event => {
    if (!pending || event.pointerType === 'touch') return;
    pointerPoint(event); render();
  });
  layer.addEventListener('click', event => {
    if (!pending) return;
    event.preventDefault(); event.stopImmediatePropagation();
    pointerPoint(event); place();
  }, true);
  layer.addEventListener('keydown', event => {
    if (!pending) return;
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    if (event.key === 'Escape') return leave();
    if (event.key === 'Enter') return place();
    const step = event.shiftKey ? .05 : .01;
    point.x = Math.max(0,Math.min(1,point.x+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0)));
    point.y = Math.max(0,Math.min(1,point.y+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)));
    render();
  });
  cancelButton.onclick = leave;
  return {begin, cancel, render, get active(){return Boolean(pending)}, get pageId(){return pending?.pageId}};
}
