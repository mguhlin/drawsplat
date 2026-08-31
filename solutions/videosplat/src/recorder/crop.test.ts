import { describe, expect, it } from "vitest";
import { cropPixels } from "./crop";

describe("recording crop geometry", () => {
  it("converts a normalized visual selection to source pixels", () => {
    expect(cropPixels({ x: 0.25, y: 0.1, width: 0.5, height: 0.75 }, 1920, 1080)).toEqual({
      x: 480,
      y: 108,
      width: 960,
      height: 810,
    });
  });

  it("keeps selections inside the recording", () => {
    expect(cropPixels({ x: 0.9, y: 0.9, width: 0.5, height: 0.5 }, 1000, 500)).toEqual({
      x: 900,
      y: 450,
      width: 100,
      height: 50,
    });
  });
});
