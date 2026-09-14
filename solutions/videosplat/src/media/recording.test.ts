import { afterEach, expect, it, vi } from "vitest";
import { supportedRecordingType } from "./recording";
afterEach(() => vi.unstubAllGlobals());
it("does not declare an audio codec for a video-only stream", () => {
  vi.stubGlobal("MediaRecorder", { isTypeSupported: (type: string) => type.includes("vp8") });
  expect(supportedRecordingType(false)).toBe("video/webm;codecs=vp8");
  expect(supportedRecordingType(true)).toBe("video/webm;codecs=vp8,opus");
});
