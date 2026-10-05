import { translate as tr } from './i18n.js';
import { editedTimeAt } from './model.js';

export const TIMELINE_MARKUP = `<section class="timeline-editor" id="timeline-editor" aria-label="Video timeline">
<div class="timeline-heading"><h2>Cut your video</h2><div class="timeline-actions"><button id="timeline-delete" disabled>Delete selection</button><button id="timeline-undo" disabled>Undo</button><button id="timeline-reset" disabled>Reset cuts</button></div></div>
<p class="hint">Drag across the video to highlight a section, then delete it. Click or scrub to preview. Cuts remove video and its audio together.</p>
<div class="timeline-composition"><div class="timeline-bookend" id="timeline-panel-start"></div><div class="timeline-video"><div id="timeline-ruler" class="timeline-ruler"></div><div id="timeline-track" class="timeline-track" tabindex="0" aria-label="Select a section of video" aria-describedby="timeline-selection-summary"><div id="timeline-segments" class="timeline-segments"></div><div id="timeline-selection" class="timeline-selection" hidden></div><div id="timeline-playhead" class="timeline-playhead" hidden></div></div></div><div class="timeline-bookend" id="timeline-panel-end"></div></div>
<div class="timeline-fields"><label>Selection start (seconds)<input id="selection-start" type="number" min="0" step="0.01" value="0" disabled></label><label>Selection end (seconds)<input id="selection-end" type="number" min="0" step="0.01" value="0" disabled></label><label class="timeline-scrub">Preview position<input id="timeline-position" type="range" min="0" max="0" step="0.01" value="0" disabled></label></div>
<p class="hint" id="timeline-selection-summary" role="status">Add a video to start editing.</p></section>`;

export function createTimelineEditor({ getState, onDelete, onUndo, onReset, onSeek }) {
  const $ = id => document.getElementById(id);
  let selection = [0, 0], drag, total = 0, locked = true, segments = [];
  const round = value => Math.round(value * 100) / 100;
  function refreshSelection() {
    const [start, end] = selection;
    $('selection-start').value = start;
    $('selection-end').value = end;
    const valid = start >= 0 && end <= total + .001 && end - start >= .1;
    $('timeline-delete').disabled = locked || !valid;
    const overlay = $('timeline-selection');
    overlay.hidden = !valid;
    overlay.style.left = `${total ? start / total * 100 : 0}%`;
    overlay.style.width = `${total ? (end - start) / total * 100 : 0}%`;
    $('timeline-selection-summary').textContent = !segments.length
      ? tr('Add a video to start editing.')
      : valid ? tr('Selected {start}–{end}s · {length}s to delete', {start: start.toFixed(2), end: end.toFixed(2), length: (end-start).toFixed(2)})
      : tr('Remaining video: {duration}s. Selection times refer to the edited video.', {duration: total.toFixed(2)});
  }
  function resetSelection() { selection = [0, 0]; refreshSelection(); }
  function update() {
    const state = getState();
    segments = state.segments;
    total = segments.reduce((sum, part) => sum + part.end - part.start, 0);
    locked = state.locked || !segments.length;
    $('timeline-track').setAttribute('aria-disabled', String(locked));
    for (const id of ['selection-start', 'selection-end', 'timeline-position']) {
      $(id).disabled = locked;
      $(id).max = total;
    }
    $('timeline-undo').disabled = state.locked || !state.canUndo;
    $('timeline-reset').disabled = state.locked || !state.hasCuts;
    $('timeline-panel-start').textContent = tr('Opening · {seconds}s', {seconds: state.intro});
    $('timeline-panel-end').textContent = tr('Closing · {seconds}s', {seconds: state.outro});
    $('timeline-panel-start').hidden = state.intro <= 0;
    $('timeline-panel-end').hidden = state.outro <= 0;
    $('timeline-segments').replaceChildren(...segments.map(part => {
      const node = document.createElement('div');
      node.className = 'timeline-segment';
      node.style.flex = `${part.end - part.start} 1 0`;
      node.textContent = tr('Video · {start}–{end}s', {start:'\u2066' + part.start.toFixed(2),end:part.end.toFixed(2) + '\u2069'});
      node.title = node.textContent;
      return node;
    }));
    $('timeline-ruler').replaceChildren(...[0,.25,.5,.75,1].map(fraction => {
      const node = document.createElement('span');
      node.textContent = `${(total * fraction).toFixed(1)}s`;
      return node;
    }));
    refreshSelection();
  }
  function setPlayhead(sourceTime) {
    const position = editedTimeAt(segments, sourceTime);
    $('timeline-position').value = position;
    $('timeline-position').setAttribute('aria-valuetext', tr('{seconds} seconds', {seconds:position.toFixed(2)}));
    $('timeline-playhead').hidden = !segments.length;
    $('timeline-playhead').style.left = `${total ? Math.min(100, position / total * 100) : 0}%`;
  }
  $('timeline-position').oninput = event => { if (!locked) onSeek(Number(event.target.value)); };
  for (const [id, index] of [['selection-start', 0], ['selection-end', 1]]) {
    $(id).oninput = event => {
      selection[index] = Number(event.target.value);
      // Keep the field being edited intact, including intermediate decimal values.
      const value = event.target.value;
      refreshSelection();
      event.target.value = value;
    };
  }
  const track = $('timeline-track');
  function position(event) {
    const rect = track.getBoundingClientRect();
    return Math.min(total, round(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * total));
  }
  track.onpointerdown = event => {
    if (locked || event.button !== 0) return;
    event.preventDefault();
    track.focus();
    drag = {anchor:position(event), previous:[...selection], pointer:event.pointerId};
    selection = [drag.anchor, drag.anchor];
    track.setPointerCapture(event.pointerId);
    refreshSelection();
  };
  track.onpointermove = event => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const current = position(event);
    selection = [Math.min(drag.anchor, current), Math.max(drag.anchor, current)];
    refreshSelection();
  };
  track.onpointerup = event => {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (selection[1] - selection[0] < .1) { resetSelection(); onSeek(position(event)); }
    drag = null;
    track.releasePointerCapture(event.pointerId);
  };
  track.onpointercancel = () => { if (drag) selection = drag.previous; drag = null; refreshSelection(); };
  $('timeline-delete').onclick = () => { if (!locked && !$('timeline-delete').disabled) onDelete(...selection); };
  $('timeline-undo').onclick = onUndo;
  $('timeline-reset').onclick = onReset;
  track.onkeydown = event => {
    if (locked) return;
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); $('timeline-delete').click(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); $('timeline-undo').click(); }
    if (event.key === 'Escape') resetSelection();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      onSeek(Math.max(0, Math.min(total, Number($('timeline-position').value) + (event.key === 'ArrowRight' ? .1 : -.1))));
    }
  };
  return {update, resetSelection, setPlayhead, notify: text => { $("timeline-selection-summary").textContent = tr(text); }};
}
