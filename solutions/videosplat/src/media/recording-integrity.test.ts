import { beforeEach, expect, it, vi } from "vitest";
import { recordingWarning } from "./recording-integrity";
const mocks = vi.hoisted(() => ({ duration: vi.fn(), dispose: vi.fn() }));
vi.mock("mediabunny", () => ({
  ALL_FORMATS: [], BlobSource: class {},
  Input: class {
    getPrimaryVideoTrack() { return { computeDuration: mocks.duration }; }
    dispose() { mocks.dispose(); }
  },
}));
beforeEach(() => vi.clearAllMocks());
it("warns when twenty minutes of capture produced only a short fragment", async () => {
  mocks.duration.mockResolvedValue(10);
  expect(await recordingWarning(new Blob(), 1200)).toContain("only 10 seconds");
  expect(mocks.dispose).toHaveBeenCalled();
});
it("accepts complete encoded video without inventing a duration", async () => {
  mocks.duration.mockResolvedValue(1199);
  expect(await recordingWarning(new Blob(), 1200)).toBeUndefined();
});
it("retains an unverifiable recording with a warning", async () => {
  mocks.duration.mockRejectedValue(new Error("invalid file"));
  expect(await recordingWarning(new Blob(), 1200)).toContain("could not be verified");
  expect(mocks.dispose).toHaveBeenCalled();
});
