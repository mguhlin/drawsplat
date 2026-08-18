import { describe, expect, it } from "vitest";
import type { Clip } from "../domain/project";
import { audioGain, transitionGain } from "./exporter";
const clip: Clip = {
  id: "c",
  name: "c",
  kind: "video",
  start: 2,
  duration: 10,
  sourceStart: 0,
  properties: {
    transitionIn: 2,
    transitionOut: 2,
    volume: 0.8,
    fadeIn: 1,
    fadeOut: 1,
  },
};
describe("export evaluation", () => {
  it("evaluates visual transition opacity", () => {
    expect(transitionGain(clip, 3)).toBe(0.5);
    expect(transitionGain(clip, 7)).toBe(1);
    expect(transitionGain(clip, 11)).toBe(0.5);
  });
  it("evaluates audio gain and fades", () => {
    expect(audioGain(clip, 2.5)).toBe(0.5);
    expect(audioGain(clip, 7)).toBe(0.8);
    expect(audioGain(clip, 11.5)).toBe(0.5);
  });
});
