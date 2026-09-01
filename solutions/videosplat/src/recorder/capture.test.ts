import { describe, expect, it, vi } from "vitest";
import { captureErrorMessage, displayCaptureOptions, isScreenSelectionCanceled, microphoneConstraints, needsCanvasComposition, supportedRecordingType } from "./capture";

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

  it("distinguishes a canceled screen chooser from a recording failure", () => {
    expect(isScreenSelectionCanceled(new DOMException("Canceled", "AbortError"))).toBe(true);
    expect(isScreenSelectionCanceled(new DOMException("Denied", "NotAllowedError"))).toBe(false);
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
    expect(needsCanvasComposition("camera", true)).toBe(true);
    expect(needsCanvasComposition("screen-camera")).toBe(true);
  });

  it("does not contradict Chrome's current-tab display constraints", () => {
    expect(displayCaptureOptions("browser")).toMatchObject({
      preferCurrentTab: true,
      selfBrowserSurface: "include",
    });
    expect(displayCaptureOptions("window")).toMatchObject({
      video: { displaySurface: "window" },
    });
    expect(displayCaptureOptions("window")).not.toHaveProperty("preferCurrentTab");
    expect(displayCaptureOptions("window")).not.toHaveProperty("selfBrowserSurface");
    expect(displayCaptureOptions("window")).not.toHaveProperty("surfaceSwitching");
    expect(displayCaptureOptions("monitor", false, 60)).toMatchObject({
      audio: false,
      video: { frameRate: { ideal: 60 }, displaySurface: "monitor" },
    });
    expect(displayCaptureOptions("monitor", false, 60)).not.toHaveProperty("surfaceSwitching");
  });
});
