import { recordingResult } from "../media/recording";
import { waitForMedia } from "../media/ready";
import { supportedRecordingType } from "./capture";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropPixels(
  rect: CropRect,
  sourceWidth: number,
  sourceHeight: number,
) {
  const x = Math.round(Math.max(0, Math.min(1, rect.x)) * sourceWidth);
  const y = Math.round(Math.max(0, Math.min(1, rect.y)) * sourceHeight);
  const width = Math.max(
    2,
    Math.round(Math.max(0.02, Math.min(1 - rect.x, rect.width)) * sourceWidth),
  );
  const height = Math.max(
    2,
    Math.round(Math.max(0.02, Math.min(1 - rect.y, rect.height)) * sourceHeight),
  );
  return { x, y, width, height };
}

export async function cropRecording(
  file: File,
  rect: CropRect,
  onProgress: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  signal?.throwIfAborted();
  if (rect.x === 0 && rect.y === 0 && rect.width === 1 && rect.height === 1) {
    onProgress(1);
    return file;
  }
  const mimeType = supportedRecordingType();
  if (!mimeType || !("captureStream" in HTMLCanvasElement.prototype))
    throw new Error("This browser cannot crop the recording locally.");
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.preload = "auto";
  video.playsInline = true;
  video.setAttribute("aria-hidden", "true");
  Object.assign(video.style, {
    position: "fixed",
    width: "2px",
    height: "2px",
    left: "-10px",
    bottom: "0",
    opacity: "0.001",
    pointerEvents: "none",
  });
  // Chromium can throttle audio delivery from detached media elements. Keep
  // this local playback element attached off-screen for a stable decoder clock.
  document.body.append(video);
  let output: MediaStream | undefined;
  let playbackStream: MediaStream | undefined;
  let audioContext: AudioContext | undefined;
  let recorder: MediaRecorder | undefined;
  let frame = 0;
  let abort: () => void = () => {};
  const canceled = new Promise<never>((_, reject) => {
    abort = () => reject(signal?.reason ?? new DOMException("Canceled", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
  });
  void canceled.catch(() => {});
  try {
    await Promise.race([waitForMedia(video, signal), canceled]);
    const source = cropPixels(rect, video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas rendering is unavailable.");
    output = canvas.captureStream(30);
    const stream = output;
    try {
      audioContext = new AudioContext({ latencyHint: "playback" });
      const destination = audioContext.createMediaStreamDestination();
      audioContext.createMediaElementSource(video).connect(destination);
      destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      await audioContext.resume();
    } catch {
      await audioContext?.close().catch(() => {});
      audioContext = undefined;
      const mediaCapture = (
        video as HTMLVideoElement & { captureStream?: () => MediaStream }
      ).captureStream?.bind(video);
      playbackStream = mediaCapture?.();
      const decodedAudioTracks = playbackStream?.getAudioTracks() ?? [];
      if (!decodedAudioTracks.length)
        throw new Error("This browser could not preserve recording audio while cropping.");
      decodedAudioTracks.forEach((track) => stream.addTrack(track));
    }
    const activeRecorder = new MediaRecorder(output, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
      audioBitsPerSecond: 128_000,
    });
    recorder = activeRecorder;
    const result = recordingResult(activeRecorder, mimeType);
    activeRecorder.start(1000);
    video.currentTime = 0;
    await Promise.race([video.play(), canceled]);
    await Promise.race([new Promise<void>((resolve, reject) => {
      activeRecorder.addEventListener("error", () => reject(new Error("The local crop failed.")), { once: true });
      activeRecorder.addEventListener("stop", () => { if (!video.ended) reject(new Error("The browser stopped cropping early. Retry with a shorter recording.")); }, { once: true });
      const draw = () => {
        try {
          context.drawImage(
            video,
            source.x,
            source.y,
            source.width,
            source.height,
            0,
            0,
            canvas.width,
            canvas.height,
          );
          onProgress(video.duration ? Math.min(1, video.currentTime / video.duration) : 0);
          if (video.ended) {
            activeRecorder.stop();
            resolve();
          } else frame = requestAnimationFrame(draw);
        } catch (error) { reject(error); }
      };
      frame = requestAnimationFrame(draw);
    }), canceled]);
    const blob = await Promise.race([result, canceled]);
    signal?.throwIfAborted();
    onProgress(1);
    return blob;
  } finally {
    signal?.removeEventListener("abort", abort);
    cancelAnimationFrame(frame);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    video.pause();
    playbackStream?.getTracks().forEach((track) => track.stop());
    output?.getTracks().forEach((track) => track.stop());
    await audioContext?.close().catch(() => {});
    video.removeAttribute("src");
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}
