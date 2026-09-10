import { describe, expect, it } from "vitest";
import { parseSubtitleFile, defaultSubtitles, validateSubtitleOptions } from "./subtitles";
describe("subtitle validation", () => {
 const source = "\uFEFF1\r\n00:00:01,000 --> 00:00:03,000\r\nHello\r\nworld";
 it("parses multiline BOM/CRLF SRT and shifts timing", () => expect(parseSubtitleFile(source, -2)).toEqual([{start: 0, end: 1, text: "Hello\nworld"}]));
 it("parses VTT and strips markup", () => expect(parseSubtitleFile("WEBVTT\n\n00:01.000 --> 00:02.000 align:start\n<i>Hello</i>")[0].text).toBe("Hello"));
 it("rejects invalid times, reversed cues, empty files and nonfinite controls", () => {
  for (const source of ["garbage", "1\n00:00:99,000 --> 00:01:00,000\nBad", "1\n00:00:03,000 --> 00:00:01,000\nBad"]) expect(() => parseSubtitleFile(source)).toThrow();
  expect(() => validateSubtitleOptions({...defaultSubtitles, offset: NaN})).toThrow();
  expect(() => parseSubtitleFile(source, -10)).toThrow();
 });
});
