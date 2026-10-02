import { describe, expect, it } from "vitest";
import { validateSubtitleExport } from "./validate-export";
const video = { codec_type: "video", width: 1920, height: 1080, start_time: "0", duration: "10", nb_read_packets: "300" };
const audio = { codec_type: "audio", start_time: "0", duration: "10.02", nb_read_packets: "500" };
describe("subtitle export verification", () => {
  it("accepts complete video with optional audio", () => {
    expect(() => validateSubtitleExport({ streams: [video, audio] }, 10)).not.toThrow();
    expect(() => validateSubtitleExport({ streams: [video] }, 0)).not.toThrow();
  });
  it("rejects missing, empty, delayed, or truncated video", () => {
    for (const streams of [[], [audio], [{ ...video, nb_read_packets: "0" }], [{ ...video, start_time: "344" }], [{ ...video, duration: "2" }]])
      expect(() => validateSubtitleExport({ streams }, 10)).toThrow(/missing video|incorrect timing/);
  });
  it("rejects an audio tail beyond the video", () => {
    expect(() => validateSubtitleExport({ streams: [video, { ...audio, duration: "26" }] }, 10)).toThrow(/out of sync/);
  });
});
