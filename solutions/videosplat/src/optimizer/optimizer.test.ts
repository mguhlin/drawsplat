import { describe, expect, it } from "vitest";
import { estimatedBytes, OPTIMIZER_PRESETS, outputDimensions } from "./optimizer";

describe("video optimizer planning", () => {
  it("scales down without changing aspect ratio", () => expect(outputDimensions(3840, 2160, OPTIMIZER_PRESETS.editing)).toEqual({ width: 1280, height: 720 }));
  it("does not upscale small sources", () => expect(outputDimensions(640, 360, OPTIMIZER_PRESETS.editing)).toEqual({ width: 640, height: 360 }));
  it("estimates encoded size from selected bitrates", () => expect(estimatedBytes(10, { ...OPTIMIZER_PRESETS.tiny, includeAudio: false })).toBe(812500));
});
