import { test } from "node:test";
import assert from "node:assert/strict";
import { timeline, videoFilter } from "../src/model.js";
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
