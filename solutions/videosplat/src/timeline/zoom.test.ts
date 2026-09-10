import { expect, it } from "vitest";
import { fitTimelineZoom, BASE_PIXELS_PER_SECOND, rulerInterval } from "./zoom";
it("fits short and multi-hour projects inside the visible track area", () => {
 for (const duration of [60, 1800, 7200]) for (const width of [130, 800, 1400]) {
  const zoom=fitTimelineZoom(duration,width);
  expect(duration * BASE_PIXELS_PER_SECOND * zoom).toBeLessThanOrEqual(width);
 }
});
it("keeps ruler labels spaced at overview and close-up scales",()=>{
 for(const zoom of [.0001,.01,.1,1,16]) {
  const pixels=BASE_PIXELS_PER_SECOND*zoom;
  expect(rulerInterval(pixels)*pixels).toBeGreaterThanOrEqual(70);
 }
});
