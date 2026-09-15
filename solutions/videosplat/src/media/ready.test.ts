import { expect, it } from "vitest";
import { waitForMedia } from "./ready";
it("interrupts a stalled decoder on cancellation", async () => {
  const controller = new AbortController();
  const result = waitForMedia(document.createElement("video"), controller.signal);
  controller.abort();
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
});
it("bounds decoder stalls and reports errors", async () => {
  await expect(waitForMedia(document.createElement("video"), undefined, 1)).rejects.toThrow("timed out");
  const image = document.createElement("img");
  const result = waitForMedia(image);
  image.dispatchEvent(new Event("error"));
  await expect(result).rejects.toThrow("could not be decoded");
});
it("accepts media already decoded before listeners attach", async () => {
  const video = document.createElement("video");
  Object.defineProperty(video, "readyState", { value: 2 });
  await expect(waitForMedia(video)).resolves.toBeUndefined();
});
