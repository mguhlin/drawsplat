import { describe, expect, it, vi } from "vitest";
import { captureErrorMessage, microphoneConstraints, needsCanvasComposition, supportedRecordingType } from "./capture";

describe("local recorder capability helpers", () => {
  it("chooses the first browser-supported WebM format", () => {
    const supported = vi.fn((type: string) => type.includes("vp8"));
    vi.stubGlobal("MediaRecorder", { isTypeSupported: supported });
    expect(supportedRecordingType()).toBe("video/webm;codecs=vp8,opus");
    vi.unstubAllGlobals();
  });

  it("turns permission and device failures into useful guidance", () => {
    expect(captureErrorMessage(new DOMException("Denied", "NotAllowedError"))).toContain(
      "permission",
    );
    expect(captureErrorMessage(new DOMException("Missing", "NotFoundError"))).toContain(
      "not found",
    );
    expect(captureErrorMessage(new Error("Encoder unavailable"))).toBe(
      "Encoder unavailable",
    );
  });

  it("requests the chosen headset microphone exactly", () => {
    expect(microphoneConstraints("headset-mic")).toMatchObject({
      deviceId: { exact: "headset-mic" },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
    expect(microphoneConstraints()).not.toHaveProperty("deviceId");
  });

  it("uses direct browser video tracks unless a camera overlay is requested", () => {
    expect(needsCanvasComposition("screen")).toBe(false);
    expect(needsCanvasComposition("camera")).toBe(false);
    expect(needsCanvasComposition("screen-camera")).toBe(true);
  });
});
