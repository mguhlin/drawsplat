// SPDX-License-Identifier: AGPL-3.0-or-later
import { MAX_FILES, MAX_FILE_BYTES, validateDimensions, exportName, uniqueName } from './pixels.mjs';
import { BACKGROUNDS, drawBackground } from './backgrounds.mjs';
import { fetchBackground, onlineImageURL, decodeImage as decode } from './background-source.mjs';

const $ = id => document.getElementById(id);
const tr = message => window.BackdropI18n?.translate(message) || message;
let currentStatus = ['Choose an image to begin.', ''], currentBackgroundStatus = ['No image background selected. Transparent and solid colors are also available.', ''];
const items = [];
let selectedId, nextId = 0, worker, activeTask, taskId = 0, batchId = 0;
let busy = false, importing = false, saving = false, previewGeneration = 0;
let replacement, backgroundTask;
const selected = () => items.find(item => item.id === selectedId);
const networkAllowed = () => window.SplatPrivacy?.getState().optionalConnections !== false;

function options() {
  const hex = $('mode').value === 'white' ? '#ffffff' : $('keyColor').value;
  return {
    mode: $('mode').value, model: $('model').value,
    color: hex.match(/\w\w/g).map(v => parseInt(v, 16)),
    scope: $('scope').value, tolerance: Number($('tolerance').value), softness: Number($('softness').value)
  };
}
function signature(value = options()) {
  return JSON.stringify(value.mode === 'photo' ? { mode: 'photo', model: value.model } : { ...value, model: null });
}
const validResult = item => Boolean(item?.result && item.signature === signature() && item.state !== 'working');
const readyItems = () => items.filter(item => validResult(item));
function status(message, type = '') { currentStatus = [message, type]; $('status').textContent = tr(message); $('status').className = 'status ' + type; }

function controls() {
  const locked = busy || importing || saving || Boolean(backgroundTask);
  $('process').disabled = locked || !selected()?.width;
  $('processAll').disabled = locked || !items.some(item => item.width);
  $('download').disabled = locked || !validResult(selected());
  $('downloadAll').disabled = locked || !readyItems().length;
  $('downloadAll').textContent = tr(readyItems().length ? `Download ${readyItems().length} completed images as ZIP` : 'Download completed images as ZIP');
  $('clear').disabled = locked || (!items.length && !replacement);
  for (const id of ['choose', 'paste', 'sample', 'files', 'mode', 'model', 'scope', 'tolerance', 'softness', 'keyColor', 'background', 'backgroundColor', 'format', 'uploadBackground', 'backgroundFile', 'backgroundURL', 'loadBackgroundURL', 'backgroundFit']) $(id).disabled = locked;
  $('cancel').hidden = !busy;
  $('cancelBackground').hidden = !backgroundTask;
  $('removeBackgroundImage').disabled = locked || !replacement;
  for (const button of document.querySelectorAll('.background-choice')) button.disabled = locked;
  $('dropZone').setAttribute('aria-disabled', String(locked));
  $('progress').hidden = !busy;
  for (const button of document.querySelectorAll('.remove-image')) button.disabled = locked;
}

function updateMode() {
  if (worker && !busy) { worker.terminate(); worker = null; }
  $('photoControls').hidden = $('mode').value !== 'photo';
  $('colorControls').hidden = $('mode').value === 'photo';
  $('keyColorRow').hidden = $('mode').value !== 'color';
  $('toleranceValue').value = $('tolerance').value;
  $('softnessValue').value = $('softness').value;
  if (selected()?.result && !validResult(selected())) status('Settings changed. Process the image again before downloading.');
  showPreview(); renderQueue(); controls();
}

function renderQueue() {
  $('queue').replaceChildren();
  $('queueCount').textContent = tr(`${items.length} images`);
  $('queueEmpty').hidden = Boolean(items.length);
  for (const item of items) {
    const row = document.createElement('li'); row.classList.toggle('selected', item.id === selectedId);
    const select = document.createElement('button'); select.className = 'select-image'; select.type = 'button';
    select.setAttribute('aria-pressed', String(item.id === selectedId));
    select.setAttribute('aria-label', `Preview ${item.name}`);
    if (item.thumb) { const thumb = new Image(); thumb.src = item.thumb; thumb.alt = ''; select.append(thumb); }
    const copy = document.createElement('span'); copy.className = 'file-copy';
    const name = document.createElement('span'); name.className = 'file-name'; name.textContent = item.name;
    const info = document.createElement('span'); info.className = 'file-state ' + item.state;
    info.textContent = item.state === 'error' ? tr(item.error) : item.state === 'working' ? tr('Processing…') : item.result ? validResult(item) ? `${tr('Ready')} · ${item.width} × ${item.height}${item.usedModel ? ' · ' + tr(item.usedModel === 'fast' ? 'Fast' : 'Best quality') : ''}${item.note ? ' · ' + item.note : ''}` : tr('Settings changed · process again') : tr(`Ready to process · ${item.width} × ${item.height}`);
    copy.append(name, info); select.append(copy);
    select.onclick = () => { selectedId = item.id; $('zoom').value = '1'; showPreview(); renderQueue(); controls(); };
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-image'; remove.textContent = tr('Remove'); remove.setAttribute('aria-label', `Remove ${item.name}`);
    remove.onclick = () => { if (!busy && !importing && !saving && !backgroundTask) removeItem(item); };
    row.append(select, remove); $('queue').append(row);
  }
}

function release(item) {
  for (const key of ['originalURL', 'resultURL', 'displayURL', 'thumb']) if (item[key]) URL.revokeObjectURL(item[key]);
}
function removeItem(item) {
  const index = items.indexOf(item); release(item); items.splice(index, 1);
  if (selectedId === item.id) selectedId = items[Math.min(index, items.length - 1)]?.id;
  showPreview(); renderQueue(); controls();
  if (!items.length) status('Choose an image to begin.');
}

const canvasBlob = (canvas, type = 'image/png') => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not encode this image. Try a smaller image.')), type, .94));

async function addFiles(files) {
  if (busy || importing || saving || backgroundTask) { status('Finish or cancel the current operation before adding more images.'); return; }
  const incoming = [...files];
  if (!incoming.length) return;
  importing = true; controls();
  const available = Math.max(0, MAX_FILES - items.length);
  let added = 0, errors = 0;
  for (const file of incoming.slice(0, available)) {
    const item = { id: ++nextId, file, name: file.name || 'pasted-image.png', state: 'ready' };
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('This file is over 40 MB. Use a smaller copy.');
      if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|avif|gif|bmp|heic|heif)$/i.test(item.name)) throw new Error('Choose an image file such as PNG, JPG, or WebP.');
      status(`Opening ${item.name}…`);
      const canvas = await decode(file); item.width = canvas.width; item.height = canvas.height;
      const thumb = document.createElement('canvas');
      const scale = Math.min(1, 96 / Math.max(item.width, item.height));
      thumb.width = Math.max(1, Math.round(item.width * scale)); thumb.height = Math.max(1, Math.round(item.height * scale));
      thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);
      item.thumb = URL.createObjectURL(await canvasBlob(thumb));
      item.originalURL = URL.createObjectURL(file);
      canvas.width = canvas.height = 1;
      added++;
    } catch (error) { item.state = 'error'; item.error = error.message; errors++; }
    items.push(item); if (item.width) selectedId = item.id;
  }
  importing = false;
  showPreview(); renderQueue(); controls();
  const skipped = incoming.length - Math.min(incoming.length, available);
  status(`${added} image${added === 1 ? '' : 's'} added.${errors ? ` ${errors} could not be opened; see the image list.` : ''}${skipped ? ` ${skipped} skipped; the batch limit is ${MAX_FILES}.` : ''}`, errors || skipped ? 'error' : '');
}

function fitPreview() {
  const item = selected(); if (!item?.width) return;
  const viewport = $('viewport');
  const scale = Math.min(1, viewport.clientWidth / item.width, viewport.clientHeight / item.height) * Number($('zoom').value);
  $('comparison').style.width = Math.max(1, Math.round(item.width * scale)) + 'px';
  $('comparison').style.height = Math.max(1, Math.round(item.height * scale)) + 'px';
}
function reveal() {
  $('comparison').style.setProperty('--reveal', $('reveal').value + '%');
  $('revealValue').value = $('reveal').value + '%';
}
async function showPreview() {
  const generation = ++previewGeneration, item = selected();
  $('dropZone').hidden = Boolean(item?.width); $('preview').hidden = !item?.width;
  if (!item?.width) return;
  $('imageName').textContent = item.name; $('dimensions').textContent = `${item.width} × ${item.height} pixels`;
  $('originalImage').src = item.originalURL;
  const hasResult = Boolean(item.result);
  $('resultImage').hidden = !hasResult; $('revealLine').hidden = !hasResult;
  $('comparison').classList.toggle('no-result', !hasResult);
  for (const id of ['reveal', 'showOriginal', 'showResult']) $(id).disabled = !hasResult;
  $('previewNote').textContent = hasResult ? `${validResult(item) ? 'Drag the comparison slider or use its arrow keys. Zero shows the result; 100 shows the original.' : 'Settings changed. This is the previous cutout; process again to update it.'}${item.note ? ' ' + item.note : ''}` : 'The original is shown until processing finishes.';
  $('previewNote').textContent = tr($('previewNote').textContent);
  fitPreview(); reveal();
  if (hasResult) {
    try {
      const blob = await composite(item, $('format').value);
      if (generation !== previewGeneration || !items.includes(item)) return;
      if (item.displayURL) URL.revokeObjectURL(item.displayURL);
      item.displayURL = URL.createObjectURL(blob); $('resultImage').src = item.displayURL;
    } catch (error) { status(error.message, 'error'); }
  }
}

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (!activeTask || data.id !== activeTask.id) return;
    if (data.type === 'progress') { status(data.text); return; }
    const task = activeTask; activeTask = null;
    if (data.type === 'result') task.resolve(data);
    else task.reject(new Error(data.message));
  };
  worker.onerror = event => {
    event.preventDefault();
    activeTask?.reject(new Error('The local engine could not start. Reload the page or try white/color removal.'));
    activeTask = null; worker?.terminate(); worker = null;
  };
  return worker;
}

async function processOne(item, settings, run) {
  item.state = 'working'; item.error = ''; renderQueue(); controls();
  const canvas = await decode(item.file);
  if (run !== batchId) throw new DOMException('Cancelled', 'AbortError');
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  canvas.width = canvas.height = 1;
  const currentWorker = ensureWorker();
  const output = await new Promise((resolve, reject) => {
    const id = ++taskId; activeTask = { id, resolve, reject, photo: settings.mode === 'photo' };
    currentWorker.postMessage({ id, width: item.width, height: item.height, pixels: pixels.data.buffer, options: settings, allowRemote: networkAllowed() }, [pixels.data.buffer]);
  });
  if (run !== batchId) throw new DOMException('Cancelled', 'AbortError');
  const result = document.createElement('canvas'); result.width = item.width; result.height = item.height;
  result.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(output.pixels), item.width, item.height), 0, 0);
  const blob = await canvasBlob(result); result.width = result.height = 1;
  if (run !== batchId) throw new DOMException('Cancelled', 'AbortError');
  if (item.resultURL) URL.revokeObjectURL(item.resultURL);
  item.result = blob; item.resultURL = URL.createObjectURL(blob); item.signature = signature(settings);
  item.usedModel = output.usedModel; item.note = output.note; item.state = 'done';
  if (replacement && $('background').value === 'image') backgroundStatus(`${replacement.name} selected. The result now uses this background.`, 'success');
}

async function processItems(candidates) {
  if (busy || importing || saving || backgroundTask) return;
  const work = candidates.filter(item => item?.width);
  if (!work.length) return;
  const settings = options();
  if (settings.mode === 'photo' && !networkAllowed()) {
    status('Optional connections are off in Privacy. Choose White or Colored background, or enable connections before downloading a photo model.', 'error'); return;
  }
  const run = ++batchId; busy = true; controls();
  $('progress').max = work.length; $('progress').value = 0;
  let done = 0, failed = 0;
  try {
    for (const item of work) {
      if (run !== batchId) break;
      status(`Processing ${item.name} (${done + failed + 1} of ${work.length})…`);
      try { await processOne(item, settings, run); done++; }
      catch (error) {
        if (run !== batchId || error.name === 'AbortError') break;
        item.state = 'error'; item.error = error.message; failed++;
      }
      if (run !== batchId) break;
      $('progress').value = done + failed;
      renderQueue(); if (selectedId === item.id) void showPreview();
    }
  } finally {
    if (run === batchId) {
      busy = false;
      for (const item of work) if (item.state === 'working') item.state = item.result ? 'done' : 'ready';
      renderQueue(); controls(); void showPreview();
      const note = work.find(item => item.note)?.note;
      status(`${done} image${done === 1 ? '' : 's'} ready.${failed ? ` ${failed} could not be processed; see the image list.` : ''}${note ? ' ' + note : ''}`, failed ? 'error' : 'success');
    }
  }
}
function cancel(message = 'Processing cancelled. Existing completed cutouts are kept.') {
  if (!busy) return;
  ++batchId;
  worker?.terminate(); worker = null;
  activeTask?.reject(new DOMException('Cancelled', 'AbortError')); activeTask = null;
  for (const item of items) if (item.state === 'working') item.state = item.result ? 'done' : 'ready';
  busy = false; status(message); renderQueue(); controls(); void showPreview();
}

async function composite(item, format) {
  const canvas = document.createElement('canvas'); canvas.width = item.width; canvas.height = item.height;
  try {
    const ctx = canvas.getContext('2d');
    // Paint the background synchronously before decoding the cutout. A new
    // background selection may safely release the previous canvas afterward.
    drawBackground(ctx, item.width, item.height, {
      type: $('background').value, color: $('backgroundColor').value,
      image: replacement?.canvas, fit: $('backgroundFit').value
    }, format === 'jpeg');
    const image = await createImageBitmap(item.result);
    try { ctx.drawImage(image, 0, 0); } finally { image.close(); }
    return await canvasBlob(canvas, format === 'jpeg' ? 'image/jpeg' : 'image/png');
  } finally { canvas.width = canvas.height = 1; }
}
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
async function download(all = false) {
  if (busy || importing || saving || backgroundTask) return;
  const work = all ? readyItems() : validResult(selected()) ? [selected()] : [];
  if (!work.length) return;
  const format = $('format').value;
  saving = true; controls();
  try {
    if (all) {
      if (!window.JSZip) throw new Error('ZIP support did not load. Download images individually or reload the page.');
      const zip = new window.JSZip(), names = new Set();
      for (const [i, item] of work.entries()) {
        status(`Preparing download ${i + 1} of ${work.length}…`);
        zip.file(uniqueName(exportName(item.name, format), names), await composite(item, format));
      }
      saveBlob(await zip.generateAsync({ type: 'blob', compression: 'STORE' }), 'backdropsplat-cutouts.zip');
    } else saveBlob(await composite(work[0], format), exportName(work[0].name, format));
    status(all ? 'ZIP download prepared.' : 'Image download prepared.', 'success');
  } catch (error) { status(error.message, 'error'); }
  finally { saving = false; controls(); }
}
function outputChanged() {
  const color = $('background').value === 'color';
  $('backgroundColor').hidden = $('backgroundColorLabel').hidden = !color;
  $('formatHint').textContent = $('format').value === 'jpeg' && $('background').value === 'transparent' ? 'JPEG cannot keep transparency, so it uses white. Choose PNG to keep a transparent cutout.' : 'Full image dimensions are preserved. The checkerboard is only a transparency preview.';
  $('formatHint').textContent = tr($('formatHint').textContent);
  renderBackground(); controls(); void showPreview();
}

function backgroundStatus(message, type = '') {
  currentBackgroundStatus = [message, type]; $('backgroundStatus').textContent = tr(message); $('backgroundStatus').className = 'status ' + type;
}
function renderBackground() {
  const imageOutput = $('background').value === 'image';
  $('imageBackgroundOption').disabled = !replacement;
  $('imageBackgroundOption').textContent = tr(replacement ? 'Image background' : 'Image background · choose below');
  $('backgroundFitControls').hidden = !replacement;
  $('backgroundThumbnail').hidden = !replacement;
  for (const button of document.querySelectorAll('.background-choice')) button.setAttribute('aria-pressed', String(imageOutput && replacement?.id === button.dataset.background));
  $('backgroundDetails').textContent = replacement ? `${replacement.canvas.width} × ${replacement.canvas.height} pixels.${imageOutput ? ' Used behind every completed cutout.' : ' Choose Image background under Output background to use this image again.'}` : '';
}
function clearReplacement() {
  if (replacement) { replacement.canvas.width = replacement.canvas.height = 1; URL.revokeObjectURL(replacement.thumb); replacement = null; }
  $('backgroundThumbnail').removeAttribute('src');
  if ($('background').value === 'image') $('background').value = 'transparent';
  backgroundStatus('No image background selected. Transparent and solid colors are also available.');
  renderBackground(); controls(); void showPreview();
}
function cancelBackground(message = 'Background loading cancelled. Your previous background is kept.') {
  const task = backgroundTask; if (!task) return;
  backgroundTask = null; clearTimeout(task.timeout); task.controller.abort();
  backgroundStatus(message); controls();
}
async function loadReplacement(source) {
  if (busy || importing || saving || backgroundTask) return;
  if (source.kind === 'url') {
    try { source.url = onlineImageURL(source.url).href; }
    catch (error) { backgroundStatus(error.message, 'error'); return; }
    if (!networkAllowed()) { backgroundStatus('Optional connections are off in Privacy. Upload a background or choose a built-in scene, or enable connections before loading an online image.', 'error'); return; }
  }
  if (source.id && replacement?.id === source.id) { $('background').value = 'image'; $('reveal').value = '0'; outputChanged(); backgroundStatus(`${replacement.name} selected.`, 'success'); return; }
  const task = { controller: new AbortController(), kind: source.kind }; backgroundTask = task;
  if (source.kind === 'url') task.timeout = setTimeout(() => cancelBackground('The online image timed out. Try another direct image URL or upload a file.'), 30_000);
  backgroundStatus('Loading background…'); controls();
  let canvas, thumb;
  try {
    let file;
    if (source.kind === 'url') file = await fetchBackground(source.url, { signal: task.controller.signal });
    else if (source.file) file = source.file;
    else {
      const response = await fetch(source.url, { signal: task.controller.signal });
      if (!response.ok) throw new Error('This built-in background could not load. Reload or upload your own image.');
      file = await response.blob();
    }
    if (file.size > MAX_FILE_BYTES) throw new Error('This background is over 40 MB. Use a smaller copy.');
    if (backgroundTask !== task) return;
    canvas = await decode(file);
    if (backgroundTask !== task) return;
    const small = document.createElement('canvas'); small.width = 128; small.height = 80;
    drawBackground(small.getContext('2d'), small.width, small.height, { type: 'image', image: canvas });
    thumb = URL.createObjectURL(await canvasBlob(small)); small.width = small.height = 1;
    if (backgroundTask !== task) return;
    if (source.kind === 'url' && !networkAllowed()) { cancelBackground('Online background download stopped because optional connections are off.'); return; }
    if (replacement) { replacement.canvas.width = replacement.canvas.height = 1; URL.revokeObjectURL(replacement.thumb); }
    replacement = { canvas, thumb, name: source.name, id: source.id }; canvas = null; thumb = null;
    $('backgroundThumbnail').src = replacement.thumb;
    $('background').value = 'image'; $('reveal').value = '0'; outputChanged();
    backgroundStatus(`${replacement.name} selected.${validResult(selected()) ? ' The result now uses this background.' : ' Remove the original background to see your subject in this setting.'}`, 'success');
  } catch (error) {
    if (backgroundTask === task) backgroundStatus(source.kind === 'url' && /cannot open/.test(error.message) ? 'This URL did not return a readable image. Use a direct image link or upload a file.' : error.message, 'error');
  } finally {
    if (canvas) canvas.width = canvas.height = 1;
    if (thumb) URL.revokeObjectURL(thumb);
    clearTimeout(task.timeout);
    if (backgroundTask === task) { backgroundTask = null; controls(); }
  }
}
for (const scene of BACKGROUNDS) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'background-choice'; button.dataset.background = scene.id;
  button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', tr(scene.name)); button.title = scene.description;
  const img = new Image(); img.src = scene.url; img.alt = ''; img.width = 160; img.height = 100;
  const label = document.createElement('span'); label.textContent = tr(scene.name); button.append(img, label);
  button.onclick = () => loadReplacement({ kind: 'builtin', ...scene }); $('backgroundGallery').append(button);
}
$('uploadBackground').onclick = () => $('backgroundFile').click();
$('backgroundFile').onchange = async () => { const file = $('backgroundFile').files[0]; if (file) await loadReplacement({ kind: 'file', file, name: file.name || 'Uploaded background' }); $('backgroundFile').value = ''; };
$('backgroundURLForm').onsubmit = event => {
  event.preventDefault(); const url = $('backgroundURL').value.trim();
  let name = 'Online image'; try { name = 'Online image · ' + new URL(url).hostname; } catch { /* Validation supplies the useful error. */ }
  void loadReplacement({ kind: 'url', url, name });
};
$('cancelBackground').onclick = () => cancelBackground();
$('removeBackgroundImage').onclick = () => { if (!busy && !importing && !saving && !backgroundTask) clearReplacement(); };

$('choose').onclick = () => $('files').click();
$('files').onchange = async () => { await addFiles($('files').files); $('files').value = ''; };
$('dropZone').onclick = () => { if (!busy && !importing && !saving && !backgroundTask) $('files').click(); };
$('dropZone').onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); $('dropZone').click(); } };
const area = document.querySelector('.image-area');
let dragDepth = 0;
window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('drop', event => event.preventDefault());
area.addEventListener('dragenter', event => { event.preventDefault(); dragDepth++; area.classList.add('drag-over'); });
area.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; area.classList.remove('drag-over'); } });
area.addEventListener('drop', event => { event.preventDefault(); dragDepth = 0; area.classList.remove('drag-over'); void addFiles(event.dataTransfer.files); });
window.addEventListener('paste', event => {
  if (/INPUT|TEXTAREA/.test(event.target?.tagName)) return;
  const clipboard = event.clipboardData;
  const files = [...(clipboard?.files || [])];
  if (!files.length) for (const item of clipboard?.items || []) {
    if (item.kind === 'file') { const file = item.getAsFile(); if (file) files.push(file); }
  }
  if (files.length) { event.preventDefault(); void addFiles(files); }
});
$('paste').onclick = async () => {
  try {
    const files = [];
    for (const item of await navigator.clipboard.read()) {
      const type = item.types.find(type => type.startsWith('image/'));
      if (type) files.push(new File([await item.getType(type)], 'pasted-image.png', { type }));
    }
    if (files.length) await addFiles(files); else status('Copy an image first, then paste it here.');
  } catch { status('Use Ctrl+V or Command+V to paste an image, or choose a local file.', 'error'); }
};
$('process').onclick = () => processItems([selected()]);
$('processAll').onclick = () => processItems([...items]);
$('cancel').onclick = () => cancel();
$('download').onclick = () => download(false);
$('downloadAll').onclick = () => download(true);
$('clear').onclick = () => {
  if (busy || importing || saving || backgroundTask) return;
  for (const item of items) release(item);
  items.length = 0; selectedId = undefined; ++previewGeneration;
  clearReplacement(); $('backgroundURL').value = ''; $('backgroundFile').value = '';
  $('originalImage').removeAttribute('src'); $('resultImage').removeAttribute('src');
  showPreview(); renderQueue(); controls(); status('Images cleared from this tab. Saved downloads are unchanged.');
};
for (const id of ['mode', 'model', 'scope', 'tolerance', 'softness', 'keyColor']) $(id).addEventListener('input', updateMode);
for (const id of ['background', 'backgroundColor', 'format', 'backgroundFit']) $(id).addEventListener('input', outputChanged);
$('zoom').onchange = fitPreview; $('reveal').oninput = reveal;
$('showOriginal').onclick = () => { $('reveal').value = '100'; reveal(); };
$('showResult').onclick = () => { $('reveal').value = '0'; reveal(); };
new ResizeObserver(fitPreview).observe($('viewport'));
let dragging = false;
$('comparison').onpointerdown = async event => {
  if ($('mode').value === 'color') {
    if (busy || importing || saving || backgroundTask || !selected()?.width) return;
    const item = selected(), rect = $('comparison').getBoundingClientRect();
    try {
      const canvas = await decode(item.file); if (selectedId !== item.id || busy) return;
      const x = Math.max(0, Math.min(item.width - 1, Math.floor((event.clientX - rect.left) / rect.width * item.width)));
      const y = Math.max(0, Math.min(item.height - 1, Math.floor((event.clientY - rect.top) / rect.height * item.height)));
      const pixel = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
      $('keyColor').value = '#' + [...pixel.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join('');
      canvas.width = canvas.height = 1; updateMode(); status('Color sampled from the original. Remove the background to apply it.');
    } catch (error) { status(error.message, 'error'); }
  } else if (selected()?.result) {
    dragging = true; $('comparison').setPointerCapture(event.pointerId);
    moveReveal(event);
  }
};
function moveReveal(event) {
  if (!dragging) return;
  const rect = $('comparison').getBoundingClientRect();
  $('reveal').value = String(Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100))); reveal();
}
$('comparison').onpointermove = moveReveal;
$('comparison').onpointerup = $('comparison').onpointercancel = () => { dragging = false; };

$('sample').onclick = async () => {
  const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 500;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 800, 500);
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(400, 180, 75, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#0f766e'; ctx.beginPath(); ctx.moveTo(400, 110); ctx.lineTo(425, 180); ctx.lineTo(400, 250); ctx.lineTo(375, 180); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#182139'; ctx.font = 'bold 72px Arial'; ctx.textAlign = 'center'; ctx.fillText('SplatWorks', 400, 370);
  $('mode').value = 'white'; $('scope').value = 'all'; updateMode();
  await addFiles([new File([await canvasBlob(canvas)], 'splatworks-logo-example.png', { type: 'image/png' })]);
  await processItems([selected()]);
};

// A worker is isolated from the shared privacy script; stop an active photo job
// when the window's privacy preference changes. White/color needs no network.
setInterval(() => {
  if (busy && options().mode === 'photo' && !networkAllowed()) cancel('Photo processing stopped because optional connections are off. White and color removal remain available.');
  if (backgroundTask?.kind === 'url' && !networkAllowed()) cancelBackground('Online background download stopped because optional connections are off. Uploads and built-in backgrounds still work.');
}, 250);
window.addEventListener('widget-i18n:changed', () => {
  for (const scene of BACKGROUNDS) { const button = document.querySelector(`[data-background="${scene.id}"]`); button.setAttribute('aria-label', tr(scene.name)); button.querySelector('span').textContent = tr(scene.name); }
  outputChanged(); renderQueue(); controls(); status(...currentStatus); backgroundStatus(...currentBackgroundStatus);
});
updateMode(); outputChanged(); renderQueue(); controls();
