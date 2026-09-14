import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { startCapture, type CaptureSession } from "../recorder/capture";
import { RecorderDialog } from "./RecorderDialog";

vi.mock("../recorder/capture", async (original) => ({
  ...await original<typeof import("../recorder/capture")>(),
  startCapture: vi.fn(),
}));
vi.mock("./RecordingAudioMeter", () => ({ RecordingAudioMeter: () => null }));

let session: CaptureSession;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:recording");
    static revokeObjectURL = vi.fn();
  });
  session = {
    previewStream: {} as MediaStream,
    state: "recording", startedAt: Date.now(),
    pause: vi.fn(), resume: vi.fn(), cancel: vi.fn(),
    stop: vi.fn().mockResolvedValue(new Blob(["recorded portion"], { type: "video/webm" })),
  };
  vi.mocked(startCapture).mockResolvedValue(session);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

async function begin() {
  render(<RecorderDialog onClose={vi.fn()} onAdd={vi.fn()} onStatus={vi.fn()}/>);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Start recording" })); });
}

it.each([false, true])("detects an unexpected recorder stop while paused=%s and offers the saved portion", async (paused) => {
  await begin();
  if (paused) fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  Object.defineProperty(session, "state", { value: "stopped" });
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  expect(session.stop).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert")).toHaveTextContent("browser stopped recording");
  expect(screen.getByRole("button", { name: "Use full recording" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Stop and choose crop" })).toBeNull();
});

it("finishes only once when source-ended and manual Stop arrive together", async () => {
  await begin();
  let finish!: (blob: Blob) => void;
  vi.mocked(session.stop).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const sourceEnded = vi.mocked(startCapture).mock.calls.at(-1)![2]!;
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Stop and choose crop" }));
    sourceEnded();
  });
  expect(session.stop).toHaveBeenCalledTimes(1);
  await act(async () => { finish(new Blob(["recording"], { type: "video/webm" })); });
  expect(screen.getByRole("button", { name: "Use full recording" })).toBeVisible();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("reports encoding failure instead of leaving the timer running", async () => {
  await begin();
  Object.defineProperty(session, "state", { value: "stopped" });
  vi.mocked(session.stop).mockRejectedValue(new Error("The browser recorder failed."));
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  expect(screen.getByRole("alert")).toHaveTextContent("browser recorder failed");
  expect(screen.getByRole("button", { name: "Start recording" })).toBeVisible();
});
