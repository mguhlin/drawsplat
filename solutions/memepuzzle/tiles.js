// Shared mouse, touch, and keyboard tile controls.
window.bindPuzzleTiles = function (grid, move, select) {
  let gesture = null;
  grid.addEventListener('pointerdown', event => {
    const tile = event.target.closest('[data-position]');
    if (!tile || event.button !== 0 || gesture) return;
    gesture = { tile, from: Number(tile.dataset.position), x: event.clientX, y: event.clientY, moved: false };
    tile.setPointerCapture(event.pointerId);
  });
  grid.addEventListener('pointermove', event => {
    if (!gesture) return;
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) {
      gesture.moved = true;
      gesture.tile.classList.add('dragging');
    }
  });
  grid.addEventListener('pointerup', event => {
    if (!gesture) return;
    const previous = gesture; gesture = null;
    previous.tile.classList.remove('dragging');
    if (previous.moved) {
      const target = Array.from(grid.children).find(tile => {
        const bounds = tile.getBoundingClientRect();
        return event.clientX >= bounds.left && event.clientX <= bounds.right &&
          event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      });
      if (target && grid.contains(target)) move(previous.from, Number(target.dataset.position));
    } else select(Number(previous.tile.dataset.question));
  });
  grid.addEventListener('pointercancel', () => {
    gesture?.tile.classList.remove('dragging'); gesture = null;
  });
  grid.addEventListener('click', event => {
    const tile = event.target.closest('[data-position]');
    if (tile && event.detail === 0) select(Number(tile.dataset.question));
  });
  grid.addEventListener('keydown', event => {
    const tile = event.target.closest('[data-position]');
    if (!tile) return;
    if (event.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const from = Number(tile.dataset.position);
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key];
      const to = from + offset;
      if (to >= 0 && to < grid.children.length) {
        move(from, to);
        grid.querySelector(`[data-position="${to}"]`)?.focus();
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); select(Number(tile.dataset.question));
    }
  });
};
