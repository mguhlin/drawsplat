import { describe, expect, it } from "vitest";
import { concatManifest, durationRanges, equalRanges, formatTime, joinCommand, sizeRanges, trimCommand } from "./commands";

describe("media commands", () => {
  it("formats FFmpeg timestamps", () => expect(formatTime(3661.25)).toBe("01:01:01.250"));
  it("creates equal ranges without rounding gaps", () => expect(equalRanges(10, 3)).toEqual([{ start: 0, end: 10 / 3 }, { start: 10 / 3, end: 20 / 3 }, { start: 20 / 3, end: 10 }]));
  it("creates fixed duration ranges and keeps the remainder", () => expect(durationRanges(610, 300)).toEqual([{ start: 0, end: 300 }, { start: 300, end: 600 }, { start: 600, end: 610 }]));
  it("derives approximate ranges from requested byte size", () => expect(sizeRanges(600, 1_000, 250)).toEqual([{ start: 0, end: 150 }, { start: 150, end: 300 }, { start: 300, end: 450 }, { start: 450, end: 600 }]));
  it("uses stream copy for a fast cut", () => expect(trimCommand("in.mp4", "out.mp4", { start: 5, end: 12 }, "fast")).toContain("copy"));
  it("uses an MP4 compatibility encode for precise cuts", () => expect(trimCommand("in.avi", "out.mp4", { start: 5, end: 12 }, "precise")).toContain("libx264"));
  it("escapes concat manifest names and maps all streams", () => { expect(concatManifest(["one.mp4", "it's.mp4"])).toContain("it'\\''s.mp4"); expect(joinCommand("list.txt", "joined.mp4", "fast")).toContain("-map"); });
});
