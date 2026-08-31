import { describe, expect, it, vi } from "vitest";
import { captureErrorMessage, supportedRecordingType } from "./capture";

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
});
