// Move publication dialogs without disturbing the editor's text selection.
export function setupMovableDialogs() {
  let drag;
  const clamp = dialog => {
    const r = dialog.getBoundingClientRect();
    dialog.style.left = `${Math.max(0, Math.min(innerWidth - r.width, r.left))}px`;
    dialog.style.top = `${Math.max(0, Math.min(innerHeight - r.height, r.top))}px`;
  };
  document.addEventListener('pointerdown', event => {
    const header = event.target.closest('.dialog-head'), dialog = header?.closest('dialog');
    if (!dialog?.open || event.button !== 0 || event.target.closest('button,input,select,a')) return;
    const r = dialog.getBoundingClientRect();
    Object.assign(dialog.style, { position: 'fixed', margin: '0', inset: 'auto', left: `${r.left}px`, top: `${r.top}px` });
    drag = { dialog, header, id: event.pointerId, x: event.clientX, y: event.clientY, left: r.left, top: r.top };
    header.setPointerCapture(event.pointerId); header.classList.add('moving'); event.preventDefault();
  });
  document.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag.dialog.style.left = `${drag.left + event.clientX - drag.x}px`; drag.dialog.style.top = `${drag.top + event.clientY - drag.y}px`; clamp(drag.dialog);
  });
  const stop = () => { if (drag) { drag.header.classList.remove('moving'); if (drag.header.hasPointerCapture(drag.id)) drag.header.releasePointerCapture(drag.id); drag = null; } };
  document.addEventListener('pointerup', stop); document.addEventListener('pointercancel', stop);
  document.addEventListener('close', event => { if (event.target.tagName === 'DIALOG') { if (drag?.dialog === event.target) stop(); for (const key of ['position','margin','inset','left','top']) event.target.style.removeProperty(key); } }, true);
  window.addEventListener('resize', () => document.querySelectorAll('dialog[open][style]').forEach(clamp));
}
