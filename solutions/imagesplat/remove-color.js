// Color-key transparency. Always derive results from the unchanged source pixels.
export function removeColor(source, { color, tolerance = 20, smoothing = 10, mode = 'all', seed = null }) {
  const { width, height } = source;
  const data = new Uint8ClampedArray(source.data);
  const count = width * height;
  const hard = Math.max(0, tolerance), soft = Math.max(0, smoothing);
  const distance = p => { const i=p*4, r=source.data[i]-color[0], g=source.data[i+1]-color[1], b=source.data[i+2]-color[2]; return Math.sqrt((r*r+g*g+b*b)/3); };
  const matches = p => source.data[p * 4 + 3] > 0 && distance(p) <= hard + soft;
  let region;
  if (mode === 'connected') {
    region = new Uint8Array(count);
    const queue = new Int32Array(count);
    let head = 0, tail = 0;
    const visit = p => { if (!region[p] && matches(p)) { region[p] = 1; queue[tail++] = p; } };
    if (seed && seed.x >= 0 && seed.x < width && seed.y >= 0 && seed.y < height) visit(seed.y * width + seed.x);
    while (head < tail) {
      const p = queue[head++], x = p % width;
      if (x > 0) visit(p - 1);
      if (x < width - 1) visit(p + 1);
      if (p >= width) visit(p - width);
      if (p + width < count) visit(p + width);
    }
  }
  for (let p = 0; p < count; p++) {
    if (!source.data[p * 4 + 3] || (region && !region[p])) continue;
    const d = distance(p);
    const keep = d <= hard ? 0 : soft ? Math.min(1, (d - hard) / soft) : 1;
    data[p * 4 + 3] = Math.round(source.data[p * 4 + 3] * keep);
  }
  return new ImageData(data, width, height);
}

export function openRemoveColor({ source, name, apply, download }) {
  document.getElementById('removeColorDialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.id = 'removeColorDialog';
  dialog.className = 'bg-dialog';
  dialog.setAttribute('aria-labelledby', 'removeColorTitle');
  dialog.innerHTML = `
    <div class="dialog-head"><h2 id="removeColorTitle">Remove color</h2><button type="button" data-close>Close</button></div>
    <div class="dialog-body">
      <p class="hint">Click or tap the original image to pick a color. Changes affect this image layer only and stay on your device.</p>
      <div class="color-previews">
        <div><strong>Original — pick a color</strong><canvas id="colorOriginal" aria-label="Original image: click to pick a color"></canvas></div>
        <div><strong>Transparent preview</strong><canvas id="colorResult" aria-label="Transparent result preview"></canvas></div>
      </div>
      <div class="color-presets" role="group" aria-label="Backdrop presets"><button type="button" data-preset="#00ff00">Green screen</button><button type="button" data-preset="#0000ff">Blue screen</button><button type="button" data-preset="#ffffff">White</button><button type="button" data-preset="#000000">Black</button></div>
      <p class="hint">For green or blue screens, pick the actual backdrop color and use Connected area to protect separate matching colors inside your subject.</p>
      <div class="field"><label for="colorTarget">Color to remove</label><input id="colorTarget" type="color" value="#ffffff"></div>
      <div class="field"><label for="colorMode">Remove from</label><select id="colorMode"><option value="all">All matching colors</option><option value="connected">Connected area at clicked point</option></select></div>
      <div class="field"><label for="colorTolerance">Tolerance <output id="colorToleranceValue">20</output></label><input id="colorTolerance" type="range" min="0" max="255" value="20"></div>
      <div class="field"><label for="colorSmoothing">Edge smoothing <output id="colorSmoothingValue">10</output></label><input id="colorSmoothing" type="range" min="0" max="100" value="10"></div>
      <p id="colorStatus" class="hint" role="status"></p>
      <p class="hint">Download PNG keeps transparency at the image’s full resolution. Apply updates the layer; Undo restores it. The canvas background remains white.</p>
    </div>
    <div class="dialog-actions"><button type="button" data-reset>Reset</button><button type="button" data-download>Download PNG</button><button type="button" class="primary" data-apply>Apply to layer</button></div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const original = $('#colorOriginal'), preview = $('#colorResult');
  const pixels = source.getContext('2d').getImageData(0, 0, source.width, source.height);
  // Bound interactive preview cost. Final output is always computed at source resolution.
  const scale = Math.min(1, 700 / Math.max(source.width, source.height));
  original.width = preview.width = Math.max(1, Math.round(source.width * scale));
  original.height = preview.height = Math.max(1, Math.round(source.height * scale));
  original.getContext('2d').drawImage(source, 0, 0, original.width, original.height);
  const previewSource = original.getContext('2d').getImageData(0, 0, original.width, original.height);
  let seed = null, busy = false, frame;
  const options = () => ({ color: $('#colorTarget').value.match(/\w\w/g).map(v => parseInt(v, 16)), tolerance: +$('#colorTolerance').value, smoothing: +$('#colorSmoothing').value, mode: $('#colorMode').value, seed });
  function update() {
    const opts = options(), needsSeed = opts.mode === 'connected' && !seed;
    $('[data-download]').disabled = $('[data-apply]').disabled = needsSeed || busy;
    $('#colorToleranceValue').value = opts.tolerance;
    $('#colorSmoothingValue').value = opts.smoothing;
    $('#colorStatus').textContent = needsSeed ? 'Click the original image to choose the connected area.' : `${source.width} × ${source.height} pixels. Preview updates as you adjust the controls.`;
    if (opts.seed) opts.seed = { x: Math.min(original.width - 1, Math.floor(seed.x * original.width / source.width)), y: Math.min(original.height - 1, Math.floor(seed.y * original.height / source.height)) };
    preview.getContext('2d').putImageData(removeColor(previewSource, opts), 0, 0);
  }
  original.addEventListener('click', e => {
    if (busy) return;
    const rect = original.getBoundingClientRect();
    seed = { x: Math.min(source.width - 1, Math.max(0, Math.floor((e.clientX - rect.left) / rect.width * source.width))), y: Math.min(source.height - 1, Math.max(0, Math.floor((e.clientY - rect.top) / rect.height * source.height))) };
    const index = (seed.y * source.width + seed.x) * 4;
    $('#colorTarget').value = '#' + [...pixels.data.slice(index, index + 3)].map(v => v.toString(16).padStart(2, '0')).join('');
    update();
  });
  dialog.querySelectorAll('[data-preset]').forEach(button => { button.onclick = () => { $('#colorTarget').value = button.dataset.preset; update(); }; });
  dialog.addEventListener('input', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); });
  $('[data-reset]').onclick = () => { seed = null; $('#colorTarget').value = '#ffffff'; $('#colorMode').value = 'all'; $('#colorTolerance').value = 20; $('#colorSmoothing').value = 10; update(); };
  $('[data-close]').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel', e => { if (busy) e.preventDefault(); });
  dialog.addEventListener('close', () => { cancelAnimationFrame(frame); dialog.remove(); });
  async function finish(save) {
    if (busy) return;
    busy = true;
    dialog.querySelectorAll('button,input,select').forEach(el => el.disabled = true);
    $('#colorStatus').textContent = 'Processing full-resolution image…';
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const result = document.createElement('canvas');
      result.width = source.width; result.height = source.height;
      result.getContext('2d').putImageData(removeColor(pixels, options()), 0, 0);
      if (save) await download(result, name.replace(/\.[^.]+$/, '') + '-transparent.png');
      else await apply(result);
      dialog.close();
    } catch (error) {
      $('#colorStatus').textContent = 'Could not process this image. Try a smaller image or adjust the settings.';
      console.error(error);
    } finally {
      busy = false;
      dialog.querySelectorAll('button,input,select').forEach(el => el.disabled = false);
    }
  }
  $('[data-download]').onclick = () => finish(true);
  $('[data-apply]').onclick = () => finish(false);
  dialog.showModal();
  update();
}
