// Pixel-based adjustments keep preview and full-resolution output consistent across browsers.
export function adjustPixels(source, values) {
  const result = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  const brightness = values.brightness * 2.55;
  const contrast = Math.pow(2, values.contrast / 50);
  const saturation = 1 + values.saturation / 100;
  const warmth = values.warmth * .6;
  for (let i = 0; i < result.data.length; i += 4) {
    const r = source.data[i], g = source.data[i + 1], b = source.data[i + 2];
    const gray = .2126 * r + .7152 * g + .0722 * b;
    [r, g, b].forEach((channel, j) => {
      result.data[i + j] = ((gray + (channel - gray) * saturation) - 127.5) * contrast + 127.5 + brightness + (j === 0 ? warmth : j === 2 ? -warmth : 0);
    });
  }
  return result;
}

export function openAdjustments(source, apply) {
  if (document.querySelector('#photoAdjustDialog')) return;
  const dialog = document.createElement('dialog');
  dialog.id = 'photoAdjustDialog';
  dialog.className = 'bg-dialog';
  dialog.setAttribute('aria-labelledby', 'photoAdjustTitle');
  dialog.style.cssText = 'width:min(920px,calc(100vw - 28px));max-height:90vh;overflow:auto';
  const controls = ['brightness', 'contrast', 'saturation', 'warmth'];
  dialog.innerHTML = `<div class="dialog-head"><h2 id="photoAdjustTitle">Adjust photo</h2><button type="button" data-close>Close</button></div>
    <div class="dialog-body"><p class="hint">Preview changes side by side. Apply updates only this image layer at its original resolution. You can undo the result.</p>
    <div class="color-previews"><div><strong>Before</strong><canvas id="photoBefore" aria-label="Original photo"></canvas></div><div><strong>After</strong><canvas id="photoAfter" aria-label="Adjusted photo"></canvas></div></div>
    ${controls.map(key => `<div class="field"><label for="photo-${key}">${key[0].toUpperCase()+key.slice(1)} <output for="photo-${key}">0</output></label><input id="photo-${key}" type="range" min="-100" max="100" value="0"></div>`).join('')}
    <p role="status" id="photoAdjustStatus"></p></div><div class="dialog-actions"><button type="button" data-reset>Reset</button><button type="button" data-close>Cancel</button><button class="primary" type="button" data-apply>Apply to layer</button></div>`;
  document.body.append(dialog);
  const before = dialog.querySelector('#photoBefore'), after = dialog.querySelector('#photoAfter');
  const scale = Math.min(1, 700 / Math.max(source.width, source.height));
  before.width = after.width = Math.max(1, Math.round(source.width * scale));
  before.height = after.height = Math.max(1, Math.round(source.height * scale));
  before.getContext('2d').drawImage(source, 0, 0, before.width, before.height);
  const pixels = before.getContext('2d').getImageData(0, 0, before.width, before.height);
  const values = () => Object.fromEntries(controls.map(key => [key, +dialog.querySelector('#photo-'+key).value]));
  const update = () => {
    dialog.querySelectorAll('input').forEach(input => { input.previousElementSibling.querySelector('output').value = input.value; });
    after.getContext('2d').putImageData(adjustPixels(pixels, values()), 0, 0);
    dialog.querySelector('[data-apply]').disabled = Object.values(values()).every(value => value === 0);
  };
  dialog.addEventListener('input', update);
  dialog.querySelector('[data-reset]').onclick = () => { dialog.querySelectorAll('input').forEach(input => { input.value = 0; }); update(); };
  dialog.querySelectorAll('[data-close]').forEach(button => { button.onclick = () => dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector('[data-apply]').onclick = async () => {
    const button = dialog.querySelector('[data-apply]'); button.disabled = true;
    dialog.querySelector('#photoAdjustStatus').textContent = 'Applying at original resolution…';
    try {
      const output = document.createElement('canvas'); output.width = source.width; output.height = source.height;
      output.getContext('2d').putImageData(adjustPixels(source.getContext('2d').getImageData(0, 0, source.width, source.height), values()), 0, 0);
      await apply(output); dialog.close();
    } catch (error) {
      console.error(error); button.disabled = false;
      dialog.querySelector('#photoAdjustStatus').textContent = 'Could not apply these adjustments. Try again or cancel.';
    }
  };
  update(); dialog.showModal();
}
