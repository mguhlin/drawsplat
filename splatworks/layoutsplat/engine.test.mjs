import test from 'node:test';
import assert from 'node:assert/strict';
import { newPublication, validatePublication, toPoints, fromPoints, snapPosition, frame, uid, textStyle, linkFrames, removeObject } from './engine.mjs';
test('physical units preserve independently known print measurements', () => {
  assert.equal(toPoints(8.5, 'in'), 612);
  assert.ok(Math.abs(toPoints(21, 'cm') - 595.275590551181) < 1e-9);
  assert.equal(toPoints(6, 'pc'), 72); assert.equal(toPoints(96, 'px'), 72);
  assert.equal(fromPoints(72, 'in'), 1);
});
test('snapping compares both object edges and midlines within tolerance', () => {
  assert.equal(snapPosition(31, 10, [36], 2), 31);
  assert.equal(snapPosition(25, 10, [36], 2), 26);
  assert.equal(snapPosition(20, 10, [36], 2), 20);
});
test('linking independent stories preserves text and frame order, deleting frames preserves remaining stories', () => {
  const doc = newPublication(true), a = uid(), b = uid(), f1 = frame(a, 36, 36, 200, 100), f2 = frame(b, 36, 160, 200, 100);
  doc.pages[0].objects.push(f1, f2); doc.stories[a] = { text: 'First paragraph.', style: textStyle(), frames: [f1.id] }; doc.stories[b] = { text: 'Second paragraph.', style: textStyle(), frames: [f2.id] };
  linkFrames(doc, f1.id, f2.id);
  assert.equal(doc.stories[a].text, 'First paragraph.\n\nSecond paragraph.'); assert.deepEqual(doc.stories[a].frames, [f1.id, f2.id]); assert.equal(f2.storyId, a); assert.ok(!doc.stories[b]);
  assert.throws(() => linkFrames(doc, f1.id, f2.id)); removeObject(doc, f1.id); assert.equal(doc.stories[a].text, 'First paragraph.\n\nSecond paragraph.'); assert.deepEqual(doc.stories[a].frames, [f2.id]); validatePublication(doc);
  removeObject(doc, f2.id); assert.ok(!doc.stories[a]); validatePublication(doc);
});
test('project validation rejects unsupported versions, cyclic/duplicate links, invalid geometry, and executable assets', () => {
  const original = newPublication(); validatePublication(original);
  for (const corrupt of [d => d.version = 2, d => d.width = Infinity, d => d.guides.columns = 100, d => d.stories[Object.keys(d.stories)[0]].frames.push(d.stories[Object.keys(d.stories)[0]].frames[0]), d => d.assets[Object.keys(d.assets)[0]].src = 'javascript:alert(1)', d => d.stories[Object.keys(d.stories)[0]].style.color = 'red;position:fixed']) {
    const copy = structuredClone(original); corrupt(copy); assert.throws(() => validatePublication(copy));
  }
});
