import test from 'node:test';
import assert from 'node:assert/strict';
import { colorCutout, validateDimensions, exportName, uniqueName } from '../solutions/backdropsplat/pixels.mjs';

function fixture() {
  const pixels = new Uint8ClampedArray(7 * 7 * 4).fill(255);
  for (let y = 1; y < 6; y++) for (let x = 1; x < 6; x++) pixels.set([0, 0, 0, 255], (y * 7 + x) * 4);
  pixels.set([255, 255, 255, 255], (3 * 7 + 3) * 4);
  return pixels;
}
const alpha = (pixels, x, y) => pixels[(y * 7 + x) * 4 + 3];

test('edge-connected removal preserves enclosed white inside a subject', () => {
  const source = fixture(), result = colorCutout(source, 7, 7, { scope: 'edges', tolerance: 0, softness: 0 });
  assert.equal(alpha(result, 0, 0), 0);
  assert.equal(alpha(result, 3, 3), 255);
  assert.equal(alpha(result, 2, 2), 255);
});
test('all-matching removal clears logo openings as well as the backdrop', () => {
  const result = colorCutout(fixture(), 7, 7, { scope: 'all', tolerance: 0, softness: 0 });
  assert.equal(alpha(result, 3, 3), 0);
  assert.equal(alpha(result, 0, 0), 0);
  assert.equal(alpha(result, 2, 2), 255);
});
test('a transparent path connects the edge to a matching internal region', () => {
  const source = fixture();
  for (let y = 0; y < 3; y++) source.set([0, 0, 0, 0], (y * 7 + 3) * 4);
  const result = colorCutout(source, 7, 7, { scope: 'edges', tolerance: 0, softness: 0 });
  assert.equal(alpha(result, 3, 3), 0);
});
test('soft edges multiply existing alpha and keep original RGB', () => {
  const source = new Uint8ClampedArray([225, 225, 225, 128]);
  const result = colorCutout(source, 1, 1, { scope: 'all', tolerance: 20, softness: 20 });
  assert.deepEqual([...result], [225, 225, 225, 64]);
});
test('zero softness has a hard boundary and never increases transparency elsewhere', () => {
  const source = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 120, 0, 0, 0, 0]);
  const result = colorCutout(source, 3, 1, { scope: 'all', tolerance: 0, softness: 0 });
  assert.deepEqual([...result], [255, 255, 255, 0, 0, 0, 0, 120, 0, 0, 0, 0]);
});
test('color matching removes green while preserving red', () => {
  const source = new Uint8ClampedArray([0, 255, 0, 255, 255, 0, 0, 255]);
  const result = colorCutout(source, 2, 1, { color: [0, 255, 0], scope: 'all', tolerance: 0, softness: 0 });
  assert.equal(result[3], 0); assert.equal(result[7], 255);
});
test('every processing attempt starts from unchanged source pixels', () => {
  const source = fixture(), before = source.slice();
  colorCutout(source, 7, 7, { scope: 'all' });
  assert.deepEqual(source, before);
  assert.equal(alpha(colorCutout(source, 7, 7, { scope: 'edges' }), 3, 3), 255);
});
test('dimensions and pixel buffers are bounded before allocation', () => {
  assert.throws(() => validateDimensions(0, 2), /invalid/);
  assert.throws(() => validateDimensions(8193, 1), /8,192/);
  assert.throws(() => validateDimensions(5000, 5000), /16 megapixels/);
  assert.throws(() => colorCutout(new Uint8ClampedArray(3), 1, 1), /incomplete/);
  assert.doesNotThrow(() => validateDimensions(4000, 4000));
});
test('download names are filesystem-safe and duplicate ZIP names remain distinct', () => {
  assert.equal(exportName('../a:b.png', 'jpeg'), '-a-b-cutout.jpg');
  const used = new Set();
  assert.equal(uniqueName('logo-cutout.png', used), 'logo-cutout.png');
  assert.equal(uniqueName('logo-cutout.png', used), 'logo-cutout-2.png');
  assert.equal(uniqueName('logo-cutout.png', used), 'logo-cutout-3.png');
});
