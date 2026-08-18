import { describe, expect, it } from "vitest";
import { createProject } from "../domain/project";
import {
  addCaptionFile,
  captionsToSrt,
  captionsToVtt,
  parseCaptions,
} from "./captions";

describe("caption interchange", () => {
  const srt =
    "1\n00:00:01,000 --> 00:00:03,500\nHello locally\n\n2\n00:00:04,000 --> 00:00:05,000\nSecond line";
  it("parses SRT and WebVTT cues", () => {
    expect(parseCaptions(srt)[0]).toMatchObject({ start: 1, duration: 2.5 });
    expect(
      parseCaptions(`WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHi`),
    ).toHaveLength(1);
  });
  it("adds caption tracks and exports SRT and VTT", () => {
    const project = addCaptionFile(createProject(), srt);
    expect(project.tracks.at(-1)?.kind).toBe("caption");
    expect(captionsToSrt(project)).toContain("00:00:01,000 --> 00:00:03,500");
    expect(captionsToVtt(project)).toContain("00:00:01.000 --> 00:00:03.500");
  });
  it("rejects files without valid cues", () =>
    expect(() => addCaptionFile(createProject(), "not captions")).toThrow(
      /No valid/,
    ));
});
