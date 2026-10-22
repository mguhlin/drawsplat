// SPDX-License-Identifier: AGPL-3.0-or-later
import { createBackgroundProcessor } from '../backdropsplat/processor.mjs';
import { validateDimensions, MAX_FILES, exportName, uniqueName } from '../backdropsplat/pixels.mjs';
import { BACKGROUNDS, drawBackground } from '../backdropsplat/backgrounds.mjs';
import { decodeImage, fetchBackground, onlineImageURL } from '../backdropsplat/background-source.mjs';

export function openBackgroundStudio({ sources, mode = 'photo', apply, download }) {
  if (!sources.length || sources.length > MAX_FILES) throw new Error('Select between 1 and 20 image layers.');
  for (const source of sources) validateDimensions(source.canvas.width, source.canvas.height);
  if (document.querySelector('#backgroundStudio')) return;
  if (!document.querySelector('#backgroundStudioStyles')) {
    const link = document.createElement('link'); link.id = 'backgroundStudioStyles'; link.rel = 'stylesheet';
    link.href = new URL('./background-studio.css', import.meta.url).href; document.head.append(link);
  }
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog'); dialog.id = 'backgroundStudio'; dialog.setAttribute('aria-labelledby', 'bs-title');
  dialog.innerHTML = `
    <header class="bs-head"><div><h2 id="bs-title">Background removal</h2><span class="bs-byline">BackdropSplat in ImageSplat</span></div><button type="button" id="bs-close" aria-label="Close background removal">Close</button></header>
    <div class="bs-body">
      <p class="bs-intro">Preview your selected image layers before applying. Every attempt starts from the original; one Undo restores all layers.</p>
      <div class="bs-workspace"><section class="bs-settings" aria-label="Background settings">
        <label for="bs-layer">Preview layer</label><select id="bs-layer"></select>
        <label for="bs-mode">Remove background</label><select id="bs-mode"><option value="photo">Photo subject</option><option value="white">White background</option><option value="color">Colored background</option></select>
        <div id="bs-photo"><label for="bs-model">Photo quality</label><select id="bs-model"><option value="fast">Fast · 44 MB model</option><option value="best">Best · 219 MB · WebGPU</option></select><p>Photo processing stays on this device. First use downloads a model from Hugging Face plus a 22 MB local engine. Unsupported Best falls back to Fast with a notice.</p></div>
        <div id="bs-key"><div id="bs-color-field"><label for="bs-color">Color to remove</label><input id="bs-color" type="color" value="#ffffff"><p>Click the original image to sample a color.</p></div>
          <label for="bs-scope">Remove matching pixels</label><select id="bs-scope"><option value="edges">Connected to image edges</option><option value="all">Every matching pixel</option></select>
          <p>Edges protects enclosed matching areas. Every matching pixel also clears white centers in lettering and logos.</p>
          <label for="bs-tolerance">Tolerance <output id="bs-tolerance-value">20</output></label><input id="bs-tolerance" type="range" min="0" max="255" value="20">
          <label for="bs-softness">Soft edge <output id="bs-softness-value">20</output></label><input id="bs-softness" type="range" min="0" max="100" value="20">
        </div>
        <p class="bs-local">White and color removal work without model downloads or external connections.</p>
        <label for="bs-background">Layer / export background</label><select id="bs-background"><option value="transparent">Transparent</option><option value="white">White</option><option value="color">Custom color</option><option id="bs-image-option" value="image" disabled>Image background · choose below</option></select>
        <p><a href="#bs-replacement">Choose a new image background</a> below the previews.</p>
        <label id="bs-fill-label" for="bs-fill" hidden>Background color</label><input id="bs-fill" type="color" value="#7956c9" hidden>
        <label for="bs-format">Download format</label><select id="bs-format"><option value="png">PNG · keeps transparency</option><option value="jpeg">JPEG · solid background</option></select><p id="bs-format-note">Apply uses your chosen background. Transparent keeps the cutout alone.</p>
      </section>
      <section class="bs-images" aria-label="Before and after">
        <div class="bs-views"><figure><figcaption>Original <span id="bs-dimensions"></span></figcaption><div class="bs-scroll"><canvas id="bs-original" aria-label="Original image; click to sample a background color"></canvas></div></figure><figure><figcaption>Result <span id="bs-result-note">Process to preview</span></figcaption><div class="bs-scroll"><canvas id="bs-result" aria-label="Background removal preview"></canvas></div></figure></div>
        <label class="bs-zoom" for="bs-zoom">Preview zoom <input id="bs-zoom" type="range" min="25" max="300" value="100"><output id="bs-zoom-value">100%</output></label>
        <p id="bs-status" role="status" aria-live="polite">Choose a mode, then process your selected layers.</p>
        <div class="bs-process-actions"><button type="button" id="bs-process" class="primary">Process selected layers</button><button type="button" id="bs-stop" hidden>Stop processing</button></div>
        <section id="bs-replacement" class="bs-replacement" aria-labelledby="bs-replacement-title">
          <div class="bs-background-head"><h3 id="bs-replacement-title">Choose a new background</h3><button type="button" id="bs-bg-upload">Upload background</button><input id="bs-bg-file" type="file" accept="image/*" hidden></div>
          <p class="bs-help">Your cutout stays in front. One backdrop is used for all selected layers.</p>
          <div id="bs-bg-gallery" class="bs-bg-gallery" role="group" aria-label="Built-in backgrounds"></div>
          <form id="bs-bg-form"><label for="bs-bg-url">Online image URL</label><div class="bs-bg-url-row"><input id="bs-bg-url" type="url" placeholder="https://example.org/background.jpg" autocomplete="off" spellcheck="false" aria-describedby="bs-bg-url-help" required><button type="submit" id="bs-bg-load">Load image URL</button></div><p id="bs-bg-url-help" class="bs-help">Use a direct HTTPS image link. Some hosts block browser access; download the image and upload it instead. The image host receives the download request, without your subject image.</p></form>
          <p id="bs-bg-status" class="bs-bg-status" role="status" aria-live="polite">Choose a scene, upload an image, or load an image URL.</p>
          <div class="bs-bg-actions"><button type="button" id="bs-bg-stop" hidden>Cancel background load</button><button type="button" id="bs-bg-remove" disabled>Remove image background</button><a id="bs-bg-view" href="#bs-result" hidden>View result</a></div>
          <div id="bs-bg-fit-controls" hidden><label for="bs-bg-fit">Background placement</label><select id="bs-bg-fit"><option value="cover">Fill frame · crop edges as needed</option><option value="contain">Fit entire image · white margins</option></select><p class="bs-help">The background is centered at each layer's original image dimensions. Subjects keep their size and position. Changing backgrounds never reruns removal.</p></div>
        </section>
        <p class="bs-footnote">Exports keep the image’s full resolution. ImageSplat’s white canvas can hide transparency; use this checkerboard preview to inspect it. <a href="/wiki/backdropsplat.html" target="_blank" rel="noopener">Background removal guide ↗</a></p>
      </section></div>
    </div>
    <footer class="bs-actions"><button type="button" id="bs-cancel">Cancel</button><button type="button" id="bs-download" disabled>Download preview image</button><button type="button" id="bs-zip" disabled>Download all (ZIP)</button><button type="button" id="bs-apply" class="primary" disabled>Apply to selected layers</button></footer>`;
  document.body.append(dialog);
  const $ = id => dialog.querySelector('#bs-' + id);
  const processor = createBackgroundProcessor(), results = sources.map(() => null);
  let busy = false, processing = false, applying = false, generation = 0, closed = false, replacement, backgroundTask;
  const networkAllowed = () => window.SplatPrivacy?.getState().optionalConnections !== false;
  sources.forEach((source, i) => { const option = document.createElement('option'); option.value = i; option.textContent = source.name; $('layer').append(option); });
  $('mode').value = mode;
  const index = () => +$('layer').value;
  const status = text => { $('status').textContent = text; };
  const options = () => ({ mode: $('mode').value, model: $('model').value, scope: $('scope').value,
    color: ($('mode').value === 'white' ? '#ffffff' : $('color').value).match(/\w\w/g).map(x => parseInt(x, 16)),
    tolerance: +$('tolerance').value, softness: +$('softness').value });
  function composite(source, jpeg = false) {
    const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height, {
      type: $('background').value, color: $('fill').value,
      image: replacement?.canvas, fit: $('bg-fit').value
    }, jpeg);
    ctx.drawImage(source, 0, 0); return canvas;
  }
  function drawPreview(id, source) {
    const canvas = $(id), scale = Math.min(1, 800 / Math.max(source.width, source.height));
    canvas.width = Math.max(1, Math.round(source.width * scale)); canvas.height = Math.max(1, Math.round(source.height * scale));
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    canvas.style.width = `${+$('zoom').value}%`;
  }
  function update() {
    const locked = busy || Boolean(backgroundTask);
    const imageOutput = $('background').value === 'image';
    $('image-option').disabled = !replacement;
    $('image-option').textContent = replacement ? 'Image background' : 'Image background · choose below';
    $('bg-fit-controls').hidden = !replacement;
    $('bg-stop').hidden = !backgroundTask;
    $('bg-remove').disabled = locked || !replacement;
    $('bg-view').hidden = !results[index()];
    for (const button of dialog.querySelectorAll('.bs-bg-choice')) {
      button.disabled = locked;
      button.setAttribute('aria-pressed', String(imageOutput && replacement?.id === button.dataset.background));
    }
    const photo = $('mode').value === 'photo'; $('photo').hidden = !photo; $('key').hidden = photo;
    $('color-field').hidden = $('mode').value !== 'color';
    $('fill').hidden = $('fill-label').hidden = $('background').value !== 'color';
    $('tolerance-value').value = $('tolerance').value; $('softness-value').value = $('softness').value;
    $('zoom-value').value = $('zoom').value + '%';
    $('format-note').textContent = $('format').value === 'jpeg' && $('background').value === 'transparent'
      ? 'JPEG downloads use white. Apply to layers still preserves transparency.' : 'Apply uses your chosen background. Transparent keeps the cutout alone.';
    const current = results[index()], original = sources[index()].canvas;
    drawPreview('original', original);
    const preview = current ? composite(current.canvas, $('format').value === 'jpeg') : original;
    drawPreview('result', preview); if (current) preview.width = preview.height = 1;
    $('dimensions').textContent = `${original.width} × ${original.height}`;
    $('result-note').textContent = current ? (current.note || 'Ready') : 'Process to preview';
    for (const id of ['mode', 'model', 'scope', 'color', 'tolerance', 'softness', 'layer', 'background', 'fill', 'format', 'bg-upload', 'bg-file', 'bg-url', 'bg-load', 'bg-fit']) $(id).disabled = locked;
    $('process').disabled = locked; $('stop').hidden = !processing;
    $('download').disabled = locked || !current; $('zip').disabled = locked || !results.some(Boolean);
    $('apply').disabled = locked || !results.every(Boolean);
    $('close').disabled = $('cancel').disabled = applying;
    $('process').textContent = sources.length === 1 ? 'Process image' : `Process ${sources.length} selected layers`;
    $('apply').textContent = sources.length === 1 ? 'Apply to layer' : `Apply to ${sources.length} layers`;
  }
  function invalidate() {
    results.fill(null); status('Settings changed. Process again before applying or downloading.'); update();
  }
  async function processAll() {
    if (busy || backgroundTask || closed) return;
    busy = processing = true; const run = ++generation; update();
    try {
      const settings = options();
      for (let i = 0; i < sources.length; i++) {
        $('layer').value = i; status(`Processing layer ${i + 1} of ${sources.length}…`); update();
        results[i] = await processor.process(sources[i].canvas, settings, text => status(`Layer ${i + 1} of ${sources.length}: ${text}`));
        if (closed || run !== generation) return;
        update();
      }
      const notes = [...new Set(results.map(r => r.note).filter(Boolean))];
      status(`${sources.length} ${sources.length === 1 ? 'image' : 'images'} ready. Review, download, or apply. ${notes.join(' ')}`);
    } catch (error) { if (!closed && run === generation) status(error.message); }
    finally { if (!closed && run === generation) { busy = processing = false; update(); } }
  }
  function stop() { if (!processing) return; ++generation; processor.cancel(); busy = processing = false; status('Processing cancelled. Completed previews remain available; original layers are unchanged.'); update(); }
  function close() { if (applying) return; dialog.close(); }
  dialog.addEventListener('cancel', event => { if (applying) event.preventDefault(); });
  dialog.addEventListener('close', () => { closed = true; ++generation; processor.dispose(); cancelBackground(); clearInterval(privacyWatch); releaseReplacement(); dialog.remove(); previousFocus?.focus(); });
  $('close').onclick = $('cancel').onclick = close;
  $('stop').onclick = stop; $('process').onclick = processAll;
  for (const id of ['mode', 'model', 'scope', 'color', 'tolerance', 'softness']) $(id).addEventListener('input', invalidate);
  for (const id of ['layer', 'background', 'fill', 'format', 'zoom', 'bg-fit']) $(id).addEventListener('input', update);
  $('original').addEventListener('click', event => {
    if (busy || backgroundTask || $('mode').value !== 'color') return;
    const source = sources[index()].canvas, rect = $('original').getBoundingClientRect();
    const x = Math.max(0, Math.min(source.width - 1, Math.floor((event.clientX - rect.left) * source.width / rect.width)));
    const y = Math.max(0, Math.min(source.height - 1, Math.floor((event.clientY - rect.top) * source.height / rect.height)));
    const pixel = source.getContext('2d').getImageData(x, y, 1, 1).data;
    $('color').value = '#' + [...pixel].slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join(''); invalidate();
  });
  const toBlob = (canvas, jpeg) => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image encoding failed.')), jpeg ? 'image/jpeg' : 'image/png', .94));
  async function save(all) {
    if (busy || backgroundTask || closed) return;
    busy = true; update();
    try {
      const jpeg = $('format').value === 'jpeg';
      if (!all) {
        const blob = await toBlob(composite(results[index()].canvas, jpeg), jpeg);
        if (!closed) await download(blob, exportName(sources[index()].name, jpeg ? 'jpeg' : 'png'));
      }
      else {
        if (!window.JSZip) await new Promise((resolve, reject) => {
          const script = document.createElement('script'); script.src = new URL('../../vendor/jszip.min.js', import.meta.url).href;
          script.onload = resolve; script.onerror = () => reject(new Error('ZIP could not load. Download images individually.')); document.head.append(script);
        });
        const zip = new window.JSZip(), used = new Set();
        for (let i = 0; i < results.length; i++) if (results[i]) {
          if (closed) return;
          zip.file(uniqueName(exportName(sources[i].name, jpeg ? 'jpeg' : 'png'), used), await toBlob(composite(results[i].canvas, jpeg), jpeg));
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        if (!closed) await download(blob, 'imagesplat-cutouts.zip');
      }
      if (!closed) status('Download ready. Original layers are unchanged until you Apply.');
    } catch (error) { if (!closed) status(error.message); }
    finally { busy = false; if (!closed) update(); }
  }
  $('download').onclick = () => save(false); $('zip').onclick = () => save(true);
  $('apply').onclick = async () => {
    if (busy || backgroundTask || closed || !results.every(Boolean)) return;
    busy = applying = true; update();
    try { await apply(results.map(r => composite(r.canvas))); applying = false; close(); }
    catch (error) { status(error.message); }
    finally { applying = busy = false; if (!closed) update(); }
  };
  function backgroundStatus(text) { $('bg-status').textContent = text; }
  function releaseReplacement() {
    if (replacement) { replacement.canvas.width = replacement.canvas.height = 1; replacement = null; }
  }
  function cancelBackground(message = 'Background loading cancelled. Your previous backdrop is kept.') {
    const task = backgroundTask; if (!task) return;
    backgroundTask = null; clearTimeout(task.timeout); task.controller.abort();
    if (!closed) { backgroundStatus(message); update(); }
  }
  async function loadReplacement(source) {
    if (busy || backgroundTask || closed) return;
    if (source.kind === 'url') {
      try { source.url = onlineImageURL(source.url).href; }
      catch (error) { backgroundStatus(error.message); return; }
      if (!networkAllowed()) { backgroundStatus('Optional connections are off in Privacy. Upload a background or choose a built-in scene, or enable connections to load an online image.'); return; }
    }
    if (source.id && replacement?.id === source.id) { $('background').value = 'image'; backgroundStatus(`${replacement.name} selected.`); update(); return; }
    const task = { controller: new AbortController(), kind: source.kind }; backgroundTask = task;
    if (source.kind === 'url') task.timeout = setTimeout(() => cancelBackground('The online image timed out. Try another direct image URL or upload a file.'), 30_000);
    backgroundStatus('Loading background…'); update(); let canvas;
    try {
      let file;
      if (source.kind === 'url') file = await fetchBackground(source.url, { signal: task.controller.signal });
      else if (source.file) file = source.file;
      else {
        const response = await fetch(source.url, { signal: task.controller.signal });
        if (!response.ok) throw new Error('This built-in background could not load. Reload or upload your own image.');
        file = await response.blob();
      }
      if (closed || backgroundTask !== task) return;
      canvas = await decodeImage(file);
      if (closed || backgroundTask !== task) return;
      if (source.kind === 'url' && !networkAllowed()) { cancelBackground('Online background download stopped because optional connections are off.'); return; }
      releaseReplacement(); replacement = { canvas, name: source.name, id: source.id }; canvas = null;
      $('background').value = 'image';
      backgroundStatus(`${replacement.name} selected. ${results.every(Boolean) ? 'Preview, download, or apply with this background.' : 'Process your selected layers to see them in this setting.'}`);
    } catch (error) {
      if (!closed && backgroundTask === task) backgroundStatus(source.kind === 'url' && /cannot open/.test(error.message) ? 'This URL did not return a readable image. Use a direct image link or upload a file.' : error.message);
    } finally {
      if (canvas) canvas.width = canvas.height = 1;
      clearTimeout(task.timeout);
      if (backgroundTask === task) { backgroundTask = null; if (!closed) update(); }
    }
  }
  for (const scene of BACKGROUNDS) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'bs-bg-choice'; button.dataset.background = scene.id;
    button.setAttribute('aria-label', scene.name); button.setAttribute('aria-pressed', 'false'); button.title = scene.description;
    const img = new Image(); img.src = scene.url; img.alt = ''; img.width = 160; img.height = 100;
    const label = document.createElement('span'); label.textContent = scene.name; button.append(img, label);
    button.onclick = () => loadReplacement({ kind: 'builtin', ...scene }); $('bg-gallery').append(button);
  }
  $('bg-upload').onclick = () => $('bg-file').click();
  $('bg-file').onchange = async () => { const file = $('bg-file').files[0]; if (file) await loadReplacement({ kind: 'file', file, name: file.name || 'Uploaded background' }); if (!closed) $('bg-file').value = ''; };
  $('bg-form').onsubmit = event => {
    event.preventDefault(); const url = $('bg-url').value.trim(); let name = 'Online image';
    try { name += ' · ' + new URL(url).hostname; } catch { /* Validation gives the useful error. */ }
    void loadReplacement({ kind: 'url', url, name });
  };
  $('bg-stop').onclick = () => cancelBackground();
  $('bg-remove').onclick = () => {
    if (busy || backgroundTask) return;
    releaseReplacement(); if ($('background').value === 'image') $('background').value = 'transparent';
    backgroundStatus('Image background removed. The transparent cutout is still available.'); update();
  };
  const privacyWatch = setInterval(() => {
    if (backgroundTask?.kind === 'url' && !networkAllowed()) cancelBackground('Online background download stopped because optional connections are off. Uploads and built-in scenes still work.');
  }, 250);
  update(); dialog.showModal();
}
