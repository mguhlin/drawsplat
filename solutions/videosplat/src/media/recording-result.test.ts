import { afterEach, expect, it, vi } from "vitest";
import { recordingResult } from "./recording";
afterEach(()=>vi.useRealTimers());
it("keeps the final chunk when Firefox dispatches data after stop", async () => {
  vi.useFakeTimers();
  const recorder = new EventTarget() as MediaRecorder;
  const result = recordingResult(recorder, "video/webm");
  const data = (value:string) => {
    const event = new Event("dataavailable");
    Object.defineProperty(event,"data",{value:new Blob([value])});
    recorder.dispatchEvent(event);
  };
  data("first");
  recorder.dispatchEvent(new Event("stop"));
  await vi.advanceTimersByTimeAsync(20);
  data("last");
  await vi.advanceTimersByTimeAsync(100);
  expect((await result).size).toBe(9);
});
it("rejects encoder failures without waiting for stop", async () => {
  const recorder = new EventTarget() as MediaRecorder;
  const result = recordingResult(recorder,"video/webm");
  recorder.dispatchEvent(new Event("error"));
  await expect(result).rejects.toThrow("recorder failed");
});
