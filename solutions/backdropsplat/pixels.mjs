// SPDX-License-Identifier: AGPL-3.0-or-later
// Original color-key implementation. No model, DOM, or network dependency.
export const MAX_PIXELS = 16_000_000;
export const MAX_EDGE = 8192;
export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 40 * 1024 * 1024;

export function validateDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1)
    throw new Error('This image has invalid dimensions.');
  if (width > MAX_EDGE || height > MAX_EDGE || width * height > MAX_PIXELS)
    throw new Error('Use an image up to 16 megapixels, with neither side longer than 8,192 pixels. Resize a copy and try again.');
}

export function colorCutout(source, width, height, { color = [255, 255, 255], tolerance = 20, softness = 20, scope = 'edges' } = {}) {
  validateDimensions(width, height);
  if (source.length !== width * height * 4) throw new Error('The image pixels are incomplete.');
  if (!['edges', 'all'].includes(scope)) throw new Error('Choose edges or all matching pixels.');
  const hard = Math.max(0, Math.min(255, Number(tolerance) || 0));
  const soft = Math.max(0, Math.min(100, Number(softness) || 0));
  const target = color.map(v => Math.max(0, Math.min(255, Number(v) || 0)));
  const result = new Uint8ClampedArray(source);
  const count = width * height;
  function distance(p) {
    const i = p * 4;
    return Math.hypot(source[i] - target[0], source[i + 1] - target[1], source[i + 2] - target[2]) / Math.sqrt(3);
  }
  let connected;
  if (scope === 'edges') {
    connected = new Uint8Array(count);
    const queue = new Uint32Array(count);
    let head = 0, tail = 0;
    const visit = p => {
      if (connected[p] || (source[p * 4 + 3] && distance(p) > hard + soft)) return;
      connected[p] = 1; queue[tail++] = p;
    };
    for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
    while (head < tail) {
      const p = queue[head++], x = p % width;
      if (x) visit(p - 1);
      if (x < width - 1) visit(p + 1);
      if (p >= width) visit(p - width);
      if (p + width < count) visit(p + width);
    }
  }
  for (let p = 0; p < count; p++) {
    if (!source[p * 4 + 3] || (connected && !connected[p])) continue;
    const d = distance(p);
    const keep = d <= hard ? 0 : soft ? Math.min(1, (d - hard) / soft) : 1;
    result[p * 4 + 3] = Math.round(source[p * 4 + 3] * keep);
  }
  return result;
}

export function exportName(name, format = 'png', suffix = 'cutout') {
  const base = String(name).replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/^\.+|[. ]+$/g, '').slice(0, 100) || 'image';
  return `${base}-${suffix}.${format === 'jpeg' ? 'jpg' : 'png'}`;
}

export function uniqueName(name, used) {
  const dot = name.lastIndexOf('.'), base = name.slice(0, dot), ext = name.slice(dot);
  let candidate = name, n = 2;
  while (used.has(candidate)) candidate = `${base}-${n++}${ext}`;
  used.add(candidate);
  return candidate;
}
