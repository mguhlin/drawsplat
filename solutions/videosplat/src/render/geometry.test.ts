import { describe, expect, it } from "vitest";
import { renderRect } from "./geometry";

describe("renderRect", () => {
  it("fits an entire portrait source inside a landscape canvas", () => {
    expect(renderRect(1080, 1920, 1920, 1080, "fit")).toEqual({
      x: -303.75,
      y: -540,
      width: 607.5,
      height: 1080,
    });
  });

  it("fills the canvas and centers overflow for cropping", () => {
    const rect = renderRect(1080, 1920, 1920, 1080, "fill");
    expect(rect.x).toBe(-960);
    expect(rect.y).toBeCloseTo(-1706.67, 2);
    expect(rect.width).toBe(1920);
    expect(rect.height).toBeCloseTo(3413.33, 2);
  });

  it("stretches to the exact canvas bounds", () => {
    expect(renderRect(640, 480, 1920, 1080, "stretch")).toEqual({
      x: -960,
      y: -540,
      width: 1920,
      height: 1080,
    });
  });
});
