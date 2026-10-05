import { test } from "node:test";
import assert from "node:assert/strict";
import { timeline, videoFilter, retainedSegments, sourceTimeAt, editedTimeAt, selectionCuts } from "../src/model.js";
test("panels count toward total and placement limits", () => {
  assert.equal(timeline(180, 0, 174, 3, 3, "reel").total, 180);
  assert.throws(() => timeline(180, 0, 175, 3, 3, "reel"), /Shorten/);
  assert.equal(timeline(80, 10, 64, 3, 3, "story").total, 60);
  assert.throws(() => timeline(80, 10, 65, 3, 3, "story"), /Shorten/);
});
test("reject invalid trims and times; accept skipped panels", () => {
  assert.equal(timeline(10, 1, 4, 0, 0, "reel").total, 3);
  for (const values of [[10, -1, 5, 3, 3], [10, 5, 5, 3, 3], [10, 0, 11, 3, 3], [10, 0, 5, NaN, 3], [10, 0, 5, 11, 3]]) assert.throws(() => timeline(...values, "reel"));
  assert.throws(() => timeline(10, 0, 1, 0, 0, "reel"), /at least 3/);
});
test("fit preserves full image; fill normalizes center crop and both enforce 30 fps", () => {
  assert.match(videoFilter(1080, 1920, "contain"), /pad=1080:1920/);
  assert.match(videoFilter(1080, 1350, "crop"), /crop=1080:1350/);
  assert.match(videoFilter(1080, 1920, "contain"), /setsar=1,fps=30,format=yuv420p/);
});

test("cuts join remaining source ranges and adjust duration limits", () => {
  const cuts = [{start: 2, end: 4}, {start: 6, end: 8}];
  assert.deepEqual(retainedSegments(10, 1, 9, cuts), [{start:1,end:2},{start:4,end:6},{start:8,end:9}]);
  assert.equal(timeline(10, 1, 9, 3, 3, "reel", cuts).total, 10);
  assert.equal(timeline(80, 0, 80, 3, 3, "story", [{start:20,end:46}]).total, 60);
  assert.throws(() => timeline(10, 0, 10, 3, 3, "reel", [{start:0,end:10}]), /one frame/);
  assert.deepEqual(retainedSegments(10, 0, 10, [{start:2,end:6},{start:4,end:8}]), [{start:0,end:2},{start:8,end:10}]);
});
test("edited selections spanning joins map back to all original source pieces", () => {
  const parts = [{start:0,end:2},{start:4,end:6},{start:8,end:10}];
  assert.equal(sourceTimeAt(parts, 2), 4);
  assert.equal(sourceTimeAt(parts, 3), 5);
  assert.equal(sourceTimeAt(parts, 99), 10);
  assert.equal(editedTimeAt(parts, 5), 3);
  assert.equal(editedTimeAt(parts, 3), 2);
  assert.deepEqual(selectionCuts(parts, 1, 5), [{start:1,end:2},{start:4,end:6},{start:8,end:9}]);
  assert.throws(() => selectionCuts(parts, 0, 7), /Select/);
  assert.throws(() => selectionCuts(parts, 2, 1), /Select/);
  assert.throws(() => selectionCuts(parts, 0, .01), /Select/);
});
