import test from 'node:test';
import assert from 'node:assert/strict';
import { paragraphs, pictureGeometry, pageObjects } from './presentation-model.mjs';
import { drawingPath } from './presentation-pptx.mjs';
import { odfPath } from './presentation-odp.mjs';

test('native text slices inline formatting at linked-frame boundaries and preserves blank paragraphs', () => {
  const style = { font: 'Arial', size: 12, weight: 'normal', color: '#123456', align: 'left', lineHeight: 1.4 };
  const story = { style, text: 'Alpha\n\nBravo', marks: [{ from: 2, to: 9, bold: true, size: 18, font: 'Georgia' }] };
  const all = paragraphs({}, story, 0, 12, style);
  assert.deepEqual(all.map(p => p.runs.map(r => r.text).join('')), ['Alpha', '', 'Bravo']);
  const tail = paragraphs({}, story, 7, 12, { ...style, size: 6 });
  assert.equal(tail.flatMap(p => p.runs).map(r => r.text).join(''), 'Bravo');
  assert.deepEqual(tail[0].runs.map(r => [r.text, r.style.bold, r.style.size, r.style.font]), [['Br', true, 9, 'Liberation Serif'], ['avo', false, 6, 'Liberation Sans']]);
});
test('native column boxes rotate around the original frame center and add bleed once', () => {
  const story = { style: { font: 'Arial', size: 12, color: '#000000' }, text: 'AB' };
  const object = { id: 'f', type: 'text', storyId: 's', x: 10, y: 20, w: 100, h: 40, rotation: 90 };
  const layout = { fragments: new Map([['f', { columns: [{ start: 0, end: 1, x: 0, y: 0, w: 50, h: 40 }, { start: 1, end: 2, x: 50, y: 0, w: 50, h: 40 }] }]]) };
  const result = pageObjects({ stories: { s: story } }, { objects: [object] }, layout, 9, () => {});
  assert.deepEqual(result.map(o => [Math.round(o.x), Math.round(o.y), o.rotation]), [[44, 4, 90], [44, 54, 90]]);
  assert.deepEqual(result.map(o => o.paragraphs[0].runs[0].text), ['A', 'B']);
});
test('native picture cover and source crop preserve their independent crop rectangles', () => {
  const o = { x: 10, y: 20, w: 100, h: 100, fit: 'cover', asset: { width: 200, height: 100 } };
  assert.deepEqual(pictureGeometry(o).crop, { l: .25, r: .25, t: 0, b: 0 });
  assert.deepEqual(pictureGeometry({ ...o, crop: { x: 0, y: 0, w: 2, h: 1 } }).crop, { l: -0, t: -0, r: .5, b: 0 });
  const contain = pictureGeometry({ ...o, fit: 'contain' });
  assert.deepEqual([contain.x, contain.y, contain.w, contain.h], [10, 45, 100, 50]);
});
test('native freeforms preserve relative coordinates, reflected Bezier controls and subpath closes', () => {
  const geometry = drawingPath('M10 20 l10 0 h10 v20 c0 10 10 10 10 0 s10 -10 10 0 q5 5 10 0 t10 0 z', [10, 20, 100, 100]);
  assert.match(geometry, /<a:moveTo><a:pt x="0" y="0"\/>/);
  assert.match(geometry, /<a:lnTo><a:pt x="20000" y="20000"\/>/);
  assert.equal((geometry.match(/<a:cubicBezTo>/g) || []).length, 2);
  assert.equal((geometry.match(/<a:quadBezTo>/g) || []).length, 2);
  assert.match(geometry, /<a:close\/>/);
  assert.equal(drawingPath('M0 0 A10 10 0 0 0 20 20', [0, 0, 20, 20]), null);
  assert.equal(drawingPath('M0', [0, 0, 20, 20]), null);
});
test('ODF integer viewports scale fractional path coordinates while retaining arc flags and angles', () => {
  assert.deepEqual(odfPath('M.5 .25 A10.5 12.25 45 0 1 20.5 30.25z', [.5, .25, 20.5, 30.25]), { viewBox: '500 250 20500 30250', path: 'M500 250 A10500 12250 45 0 1 20500 30250 z' });
});
