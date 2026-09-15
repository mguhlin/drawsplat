import { removeColor } from './remove-color.js?v=20260915';

const makeCanvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });
const hex = value => value.match(/\w\w/g).map(n => parseInt(n, 16));
const defaults = key => ({ key, color: '#00ff00', tolerance: 45, smoothing: 25, spill: key, x: 0, y: 0, scale: 100, rotation: 0, flip: false, left: 0, right: 0, top: 0, bottom: 0, strokes: [] });
const dimensions = source => ({ width: source.videoWidth || source.naturalWidth || source.width, height: source.videoHeight || source.naturalHeight || source.height });

// Shared by preview and export, with all edits applied to an unchanged source.
export function renderLayer(layer, maxSide = 1920) {
  if (!layer.source) return null;
  const size = dimensions(layer.source);
  if (!size.width || !size.height) return null;
  const ratio = Math.min(1, maxSide / Math.max(size.width, size.height));
  const canvas = makeCanvas(Math.max(1, Math.round(size.width * ratio)), Math.max(1, Math.round(size.height * ratio)));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(layer.source, 0, 0, canvas.width, canvas.height);
  const s = layer.settings;
  if (s.key) {
    const pixels = removeColor(ctx.getImageData(0, 0, canvas.width, canvas.height), { color: hex(s.color), tolerance: s.tolerance, smoothing: s.smoothing });
    if (s.spill) {
      const target = hex(s.color), channel = target[1] > target[0] && target[1] > target[2] ? 1 : target[2] > target[0] && target[2] > target[1] ? 2 : -1;
      if (channel >= 0) for (let i = 0; i < pixels.data.length; i += 4) {
        // Suppress excess screen color; neutral and warm colors are unchanged.
        pixels.data[i + channel] = Math.min(pixels.data[i + channel], Math.max(pixels.data[i], pixels.data[i + (channel === 1 ? 2 : 1)]));
      }
    }
    ctx.putImageData(pixels, 0, 0);
  }
  if (s.strokes.length) {
    const mask = makeCanvas(canvas.width, canvas.height), mx = mask.getContext('2d');
    mx.fillStyle = '#fff'; mx.fillRect(0, 0, mask.width, mask.height);
    for (const stroke of s.strokes) {
      mx.globalCompositeOperation = stroke.restore ? 'source-over' : 'destination-out';
      mx.strokeStyle = mx.fillStyle = '#fff'; mx.lineWidth = stroke.size * Math.min(mask.width, mask.height); mx.lineCap = mx.lineJoin = 'round';
      mx.beginPath();
      stroke.points.forEach((p, i) => i ? mx.lineTo(p.x * mask.width, p.y * mask.height) : mx.moveTo(p.x * mask.width, p.y * mask.height));
      if (stroke.points.length === 1) { const p = stroke.points[0]; mx.arc(p.x * mask.width, p.y * mask.height, mx.lineWidth / 2, 0, Math.PI * 2); mx.fill(); }
      else mx.stroke();
    }
    ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0); ctx.globalCompositeOperation = 'source-over';
  }
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w * s.left / 100, h); ctx.clearRect(w * (1 - s.right / 100), 0, w, h);
  ctx.clearRect(0, 0, w, h * s.top / 100); ctx.clearRect(0, h * (1 - s.bottom / 100), w, h);
  return canvas;
}

export function composite(layers, width, height, background = null) {
  const canvas = makeCanvas(width, height), ctx = canvas.getContext('2d');
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, width, height); }
  for (const layer of layers) {
    const image = renderLayer(layer, Math.max(width, height));
    if (!image) continue;
    const s = layer.settings;
    const fit = (layer.role === 'background' ? Math.max : Math.min)(width / image.width, height / image.height) * s.scale / 100;
    ctx.save(); ctx.translate(width * (.5 + s.x / 100), height * (.5 + s.y / 100)); ctx.rotate(s.rotation * Math.PI / 180);
    ctx.scale(s.flip ? -1 : 1, 1); ctx.drawImage(image, -image.width * fit / 2, -image.height * fit / 2, image.width * fit, image.height * fit); ctx.restore();
  }
  return canvas;
}

export function openGreenScreen({ initialSource, insert, download }) {
  if (document.getElementById('greenScreenDialog')) return;
  const dialog = document.createElement('dialog'); dialog.id = 'greenScreenDialog'; dialog.className = 'bg-dialog'; dialog.setAttribute('aria-labelledby', 'gsTitle');
  const range = (id, label, min, max, value) => `<label>${label} <output for="${id}"></output><input id="${id}" type="range" min="${min}" max="${max}" value="${value}"></label>`;
  dialog.innerHTML = `
    <div class="dialog-head"><h2 id="gsTitle">Green Screen Studio</h2><button id="gsClose" type="button">Close</button></div>
    <div class="gs-workspace">
      <section class="gs-view" aria-label="Composition preview">
        <canvas id="gsPreview" width="960" height="540" tabindex="0" aria-label="Combined scene: drag to position the selected layer" aria-describedby="gsPlacementHint"></canvas>
        <p id="gsPlacementHint" class="hint">Drag in the combined preview to move the selected layer. Arrow keys nudge it; Shift moves farther. Background → Subject → Overlay. Select a layer to change its source or settings. All processing stays on your device. Save or add the scene before closing; the studio setup is not saved.</p>
        <div class="gs-row"><label>Output size <select id="gsSize"><option value="1280,720">HD · 1280 × 720</option><option value="1920,1080">Full HD · 1920 × 1080</option><option value="1080,1080">Square · 1080 × 1080</option><option value="1080,1920">Portrait · 1080 × 1920</option></select></label><label><input id="gsTransparent" type="checkbox" checked> Transparent empty areas</label><label>Canvas color <input id="gsBackground" type="color" value="#ffffff"></label></div>
        <p id="gsStatus" class="hint" role="status">Choose a subject photo or start the camera, then add a background.</p>
      </section>
      <section class="gs-controls" aria-label="Layer controls">
        <label>Edit layer <select id="gsLayer"><option value="2">Overlay (front)</option><option value="1" selected>Subject</option><option value="0">Background (back)</option></select></label>
        <p id="gsSourceName" class="hint">No source</p>
        <label><input id="gsSpill" type="checkbox"> Remove green/blue fringe</label>
        <p class="hint">Neutralizes leftover screen color around the subject. Turn off if it changes green or blue details you want to keep.</p>
        <div class="gs-row"><label class="gs-file">Choose photo<input id="gsPhoto" type="file" accept="image/*"></label><label class="gs-file">Take a photo<input id="gsCapture" type="file" accept="image/*" capture="environment"></label></div>
        <div class="gs-row"><select id="gsFacing" aria-label="Camera direction"><option value="user">Front camera</option><option value="environment">Back camera</option></select><button id="gsCamera">Start camera</button><button id="gsFreeze" disabled>Freeze camera</button><button id="gsRemove">Remove source</button></div>
        <p class="hint">If live camera access is blocked, use Take a photo or allow Camera in your browser and device settings.</p>
        <canvas id="gsSource" width="400" height="225" aria-label="Layer source: sample a color or paint a mask"></canvas>
        <div class="gs-row"><label>Source tool <select id="gsTool"><option value="sample">Pick screen color</option><option value="erase">Erase mask</option><option value="restore">Restore mask</option></select></label>${range('gsBrush', 'Brush size', 1, 50, 10)}<button id="gsUndoMask">Undo mask stroke</button><button id="gsClearMask">Clear mask</button></div>
        <p class="hint">Click or tap the source to sample its backdrop. Drag with Erase mask to hide unwanted areas. Restore mask restores manually erased areas; color removal and crop still apply.</p>
        <label><input id="gsKey" type="checkbox" checked> Remove screen color</label>
        <div class="gs-row"><label>Screen color <input id="gsColor" type="color" value="#00ff00"></label><button data-gs-color="#00ff00">Green</button><button data-gs-color="#0000ff">Blue</button></div>
        ${range('gsTolerance', 'Tolerance', 0, 255, 45)}${range('gsSmoothing', 'Edge smoothing', 0, 100, 25)}
        <details><summary>Position, size, and crop</summary>
          ${range('gsX', 'Horizontal position', -100, 100, 0)}${range('gsY', 'Vertical position', -100, 100, 0)}${range('gsScale', 'Size (%)', 10, 300, 100)}${range('gsRotation', 'Rotation (°)', -180, 180, 0)}
          <label><input id="gsFlip" type="checkbox"> Flip horizontally</label>
          ${range('gsLeft', 'Crop left (%)', 0, 45, 0)}${range('gsRight', 'Crop right (%)', 0, 45, 0)}${range('gsTop', 'Crop top (%)', 0, 45, 0)}${range('gsBottom', 'Crop bottom (%)', 0, 45, 0)}
          <button id="gsReset">Reset layer adjustments</button>
        </details>
      </section>
    </div>
    <div class="dialog-actions"><button id="gsDownload">Save scene PNG</button><button id="gsInsert" class="primary">Add scene to ImageSplat</button></div>`;
  document.body.append(dialog);
  const $ = id => dialog.querySelector('#' + id);
  const layers = ['background', 'subject', 'overlay'].map(role => ({ role, settings: defaults(role === 'subject'), source: null, name: 'No source', url: null }));
  if (initialSource) { layers[1].source = initialSource; layers[1].name = 'Selected ImageSplat image'; }
  let selected = 1, stream = null, cameraLayer = null, request = 0, frame = 0, lastPaint = 0, busy = false, loading = 0, closed = false, stroke = null;
  const fields = { gsKey: 'key', gsColor: 'color', gsTolerance: 'tolerance', gsSmoothing: 'smoothing', gsSpill: 'spill', gsX: 'x', gsY: 'y', gsScale: 'scale', gsRotation: 'rotation', gsFlip: 'flip', gsLeft: 'left', gsRight: 'right', gsTop: 'top', gsBottom: 'bottom' };
  const message = text => { $('gsStatus').textContent = text; };
  function controls() {
    const layer = layers[selected]; $('gsSourceName').textContent = layer.name;
    for (const [id, key] of Object.entries(fields)) { const el = $(id); if (el.type === 'checkbox') el.checked = layer.settings[key]; else el.value = layer.settings[key]; }
    $('gsFreeze').disabled = !stream; outputs();
  }
  function outputs() { dialog.querySelectorAll('output').forEach(out => { out.value = $(out.htmlFor).value; }); }
  function draw() {
    if (closed) return;
    const [w, h] = $('gsSize').value.split(',').map(Number), scale = Math.min(1, 960 / Math.max(w, h));
    const result = composite(layers, Math.round(w * scale), Math.round(h * scale), $('gsTransparent').checked ? null : $('gsBackground').value);
    const preview = $('gsPreview'); preview.width = result.width; preview.height = result.height; preview.getContext('2d').drawImage(result, 0, 0);
    const source = $('gsSource'), layer = layers[selected];
    if (layer.source) {
      const size = dimensions(layer.source), ratio = Math.min(1, 480 / Math.max(size.width, size.height));
      source.width = Math.max(1, Math.round(size.width * ratio)); source.height = Math.max(1, Math.round(size.height * ratio));
      // Sampling always shows the original; mask tools show the keyed/masked result.
      const image = $('gsTool').value === 'sample' ? layer.source : renderLayer(layer, 480);
      if (image) source.getContext('2d').drawImage(image, 0, 0, source.width, source.height);
    } else { source.width = 400; source.height = 225; }
    $('gsDownload').disabled = $('gsInsert').disabled = busy || !!loading || !layers.some(l => l.source);
  }
  function loop(time) { if (closed || !stream) return; if (time - lastPaint > 65 && !busy) { draw(); lastPaint = time; } frame = requestAnimationFrame(loop); }
  function freezeCamera() {
    request++;
    const tracks = stream?.getTracks() || [];
    if (stream && cameraLayer?.source) {
      const video = cameraLayer.source, size = dimensions(video);
      if (size.width && size.height) { const still = makeCanvas(size.width, size.height); still.getContext('2d').drawImage(video, 0, 0); cameraLayer.source = still; cameraLayer.name = 'Camera snapshot'; }
      else { cameraLayer.source = null; cameraLayer.name = 'No source'; }
      video.pause(); video.srcObject = null;
    }
    tracks.forEach(track => track.stop()); stream = null; cameraLayer = null; cancelAnimationFrame(frame);
    if (!closed) { $('gsCamera').disabled = false; controls(); draw(); }
  }
  function release(layer) { layer.loadVersion = (layer.loadVersion || 0) + 1; if (cameraLayer === layer) freezeCamera(); if (layer.url) URL.revokeObjectURL(layer.url); layer.url = null; layer.source = null; layer.name = 'No source'; }
  async function loadPhoto(file) {
    if (!file || busy) return;
    const layer = layers[selected], version = layer.loadVersion = (layer.loadVersion || 0) + 1; request++; $('gsCamera').disabled = false; loading++; draw();
    const url = URL.createObjectURL(file), image = new Image();
    try {
      image.src = url; await image.decode();
      if (closed || version !== layer.loadVersion) { URL.revokeObjectURL(url); return; }
      release(layer); layer.source = image; layer.url = url; layer.name = file.name; layer.settings = defaults(layer.role === 'subject');
      controls(); message('Photo loaded. Sample the screen color or adjust the selected layer.');
    } catch { URL.revokeObjectURL(url); if (!closed) message('This image could not be opened. Try PNG, JPEG, or WebP.'); }
    finally { loading--; if (!closed) draw(); }
  }
  for (const id of ['gsPhoto', 'gsCapture']) {
    $(id).onchange = () => { const file = $(id).files[0]; $(id).value = ''; void loadPhoto(file); };
    $(id).onclick = () => { if (stream) freezeCamera(); };
  }
  $('gsCamera').onclick = async () => {
    freezeCamera(); const token = ++request, layer = layers[selected]; layer.loadVersion = (layer.loadVersion || 0) + 1; $('gsCamera').disabled = true; message('Allow camera access to preview your green-screen scene.');
    let opened;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
      opened = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: $('gsFacing').value }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (closed || token !== request) { opened.getTracks().forEach(t => t.stop()); return; }
      const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.srcObject = opened;
      await video.play();
      if (closed || token !== request) { video.pause(); video.srcObject = null; opened.getTracks().forEach(t => t.stop()); return; }
      release(layer); stream = opened; cameraLayer = layer; layer.source = video; layer.name = 'Live camera'; layer.settings = defaults(layer.role === 'subject');
      opened.getVideoTracks()[0].addEventListener('ended', () => { if (stream === opened) { freezeCamera(); message('Camera stopped. The last frame is available as a photo.'); } });
      controls(); draw(); frame = requestAnimationFrame(loop); message('Camera is live. Pick the screen color, add a background, then save a scene or freeze the camera.');
    } catch (error) {
      opened?.getTracks().forEach(t => t.stop());
      if (!closed && token === request) message(['NotAllowedError', 'SecurityError'].includes(error.name) ? 'Camera access is blocked. Allow Camera for this site and your browser in device settings, or use Take a photo / Choose photo.' : 'Camera could not start. Close other camera apps, try the other camera, or use Take a photo / Choose photo.');
    } finally { if (!closed && token === request) $('gsCamera').disabled = false; }
  };
  $('gsFreeze').onclick = () => { freezeCamera(); message('Camera frozen. You can edit and save this frame.'); };
  $('gsRemove').onclick = () => { request++; $('gsCamera').disabled = false; release(layers[selected]); controls(); draw(); };
  $('gsLayer').onchange = () => { selected = +$('gsLayer').value; stroke = null; controls(); draw(); };
  dialog.addEventListener('input', e => {
    if (fields[e.target.id]) { const el = e.target; layers[selected].settings[fields[el.id]] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value; }
    outputs(); if (!busy) draw();
  });
  dialog.querySelectorAll('[data-gs-color]').forEach(button => { button.onclick = () => { layers[selected].settings.color = button.dataset.gsColor; layers[selected].settings.key = true; controls(); draw(); }; });
  $('gsReset').onclick = () => { layers[selected].settings = defaults(layers[selected].role === 'subject'); controls(); draw(); };
  $('gsUndoMask').onclick = () => { layers[selected].settings.strokes.pop(); draw(); };
  $('gsClearMask').onclick = () => { layers[selected].settings.strokes = []; draw(); };
  const previewView = $('gsPreview');
  let placementDrag = null;
  function positionLayer(layer, x, y) {
    layer.settings.x = Math.max(-100, Math.min(100, x));
    layer.settings.y = Math.max(-100, Math.min(100, y));
    controls(); draw();
  }
  function endPlacement(cancel = false) {
    if (!placementDrag) return;
    const drag = placementDrag; placementDrag = null;
    previewView.classList.remove('dragging');
    if (previewView.hasPointerCapture(drag.pointerId)) previewView.releasePointerCapture(drag.pointerId);
    if (cancel) positionLayer(drag.layer, drag.x, drag.y);
  }
  previewView.onpointerdown = e => {
    if (busy || loading || placementDrag || e.button !== 0 || !e.isPrimary || !layers[selected].source) return;
    const rect = previewView.getBoundingClientRect(), layer = layers[selected];
    placementDrag = { pointerId: e.pointerId, layer, x: layer.settings.x, y: layer.settings.y, clientX: e.clientX, clientY: e.clientY, width: rect.width, height: rect.height };
    previewView.focus({ preventScroll: true }); previewView.setPointerCapture(e.pointerId); previewView.classList.add('dragging'); e.preventDefault();
  };
  previewView.onpointermove = e => {
    const drag = placementDrag;
    if (!drag || drag.pointerId !== e.pointerId || busy) return;
    positionLayer(drag.layer, drag.x + (e.clientX - drag.clientX) / drag.width * 100, drag.y + (e.clientY - drag.clientY) / drag.height * 100);
  };
  previewView.onpointerup = e => { if (placementDrag?.pointerId === e.pointerId) endPlacement(); };
  previewView.onpointercancel = e => { if (placementDrag?.pointerId === e.pointerId) endPlacement(true); };
  previewView.onlostpointercapture = () => endPlacement();
  previewView.onkeydown = e => {
    if (busy || loading || !layers[selected].source || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault(); const step = e.shiftKey ? 10 : 1, s = layers[selected].settings;
    positionLayer(layers[selected], s.x + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0), s.y + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0));
  };
  const sourceView = $('gsSource');
  function sourcePoint(e) { const rect = sourceView.getBoundingClientRect(); return { x: Math.max(0, Math.min(.999999, (e.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(.999999, (e.clientY - rect.top) / rect.height)) }; }
  function sample(e) {
    const p = sourcePoint(e), rgb = sourceView.getContext('2d').getImageData(Math.floor(p.x * sourceView.width), Math.floor(p.y * sourceView.height), 1, 1).data;
    layers[selected].settings.color = '#' + [...rgb.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join(''); layers[selected].settings.key = true; controls(); draw();
  }
  sourceView.onpointerdown = e => {
    if (busy || !layers[selected].source) return;
    sourceView.setPointerCapture(e.pointerId);
    if ($('gsTool').value === 'sample') { sample(e); return; }
    stroke = { restore: $('gsTool').value === 'restore', size: +$('gsBrush').value / 100, points: [sourcePoint(e)] }; layers[selected].settings.strokes.push(stroke); draw();
  };
  sourceView.onpointermove = e => { if (busy || !sourceView.hasPointerCapture(e.pointerId)) return; if ($('gsTool').value === 'sample') sample(e); else if (stroke) { stroke.points.push(sourcePoint(e)); draw(); } };
  sourceView.onpointerup = sourceView.onpointercancel = () => { stroke = null; };
  function cleanup() {
    if (closed) return; closed = true; freezeCamera(); layers.forEach(release); dialog.remove(); window.removeEventListener('pagehide', cleanup);
  }
  $('gsClose').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
  dialog.addEventListener('close', cleanup); window.addEventListener('pagehide', cleanup);
  async function finish(save) {
    if (busy || loading || !layers.some(l => l.source)) return;
    busy = true; dialog.querySelectorAll('input,select,button').forEach(el => el.disabled = true); message('Preparing scene…');
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const [width, height] = $('gsSize').value.split(',').map(Number);
      const result = composite(layers, width, height, $('gsTransparent').checked ? null : $('gsBackground').value);
      if (save) await download(result, 'imagesplat-green-screen.png'); else await insert(result);
      dialog.close();
    } catch (error) { console.error(error); message('Scene could not be saved. Try a smaller output size.'); }
    finally { busy = false; if (!closed) { dialog.querySelectorAll('input,select,button').forEach(el => el.disabled = false); controls(); draw(); } }
  }
  $('gsDownload').onclick = () => finish(true); $('gsInsert').onclick = () => finish(false);
  dialog.showModal(); controls(); draw();
}
