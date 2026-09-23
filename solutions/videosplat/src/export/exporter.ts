import { recordingResult } from "../media/recording";
import { waitForMedia } from "../media/ready";
import { createChromaRenderer } from "../render/chroma";
import { projectDuration } from "../timeline/engine";
import type { VideoSplatProject } from "../domain/project";
import { audioGain, drawComposition, type VisualSource } from "./composition";
export { audioGain, transitionGain } from "./composition";
import { transcodeExport, type ExportFormat } from "./transcoder";
import { supportedRecordingType } from "../media/recording";

export interface ExportOptions {
  width: number;
  height: number;
  frameRate: number;
  videoBitsPerSecond: number;
  includeAudio: boolean;
  burnSubtitles?: boolean;
  format: ExportFormat;
  rangeStart?: number;
  rangeEnd?: number;
  acceleration?: "auto" | "software" | "compatible";
}
export const DEFAULT_EXPORT: ExportOptions = {
  width: 1280,
  height: 720,
  frameRate: 30,
  videoBitsPerSecond: 4_000_000,
  includeAudio: true,
  burnSubtitles: true,
  format: "webm",
  acceleration: "auto",
};
async function exportCompatible(
  project: VideoSplatProject,
  urls: Record<string, string>,
  options: ExportOptions,
  onProgress: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  if (
    !("MediaRecorder" in window) ||
    !("captureStream" in HTMLCanvasElement.prototype)
  )
    throw new Error(
      "This browser cannot export a local composition. Try current Chrome or Edge.",
    );
  const mimeType = supportedRecordingType(options.includeAudio);
  if (!mimeType) throw new Error("This browser has no supported WebM encoder.");
  const fullDuration = projectDuration(project);
  const rangeStart = Math.max(0, options.rangeStart ?? 0);
  const rangeEnd = Math.min(fullDuration, options.rangeEnd ?? fullDuration);
  const duration = rangeEnd - rangeStart;
  if (duration <= 0)
    throw new Error("Add at least one timeline clip before exporting.");
  const missing = project.assets.filter(
    (asset) =>
      project.tracks.some((track) =>
        track.clips.some((clip) => clip.assetId === asset.id),
      ) && !urls[asset.id],
  );
  if (missing.length)
    throw new Error(
      `Relink missing media before export: ${missing.map((asset) => asset.name).join(", ")}`,
    );
  const renderChroma = createChromaRenderer();
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas rendering is unavailable.");
  const stream = canvas.captureStream(options.frameRate);
  let audioContext: AudioContext | undefined;
  let activeRecorder: MediaRecorder | undefined;
  let frame = 0;
  const media = new Map<string, HTMLMediaElement>();
  const audioGains = new Map<string, GainNode>();
  const images = new Map<string, HTMLImageElement>();
  try {
    audioContext = options.includeAudio
      ? new AudioContext({ latencyHint: "playback" })
      : undefined;
    const audioDestination = audioContext?.createMediaStreamDestination();
    const audioLimiter = audioContext?.createDynamicsCompressor();
    if (audioLimiter && audioDestination) {
      audioLimiter.threshold.value = -3;
      audioLimiter.knee.value = 6;
      audioLimiter.ratio.value = 12;
      audioLimiter.attack.value = 0.003;
      audioLimiter.release.value = 0.25;
      audioLimiter.connect(audioDestination);
    }
    audioDestination?.stream
      .getAudioTracks()
      .forEach((track) => stream.addTrack(track));
    for (const track of project.tracks)
      for (const clip of track.clips) {
        if (!clip.assetId) continue;
        const asset = project.assets.find((item) => item.id === clip.assetId);
        const url = urls[clip.assetId];
        if (!asset || !url) continue;
        if (asset.kind === "image") {
          const image = new Image();
          image.src = url;
          await waitForMedia(image, signal);
          images.set(clip.id, image);
        } else {
          const element = document.createElement(
            asset.kind,
          ) as HTMLMediaElement;
          element.src = url;
          element.preload = "auto";
          if (element instanceof HTMLVideoElement) element.playsInline = true;
          element.setAttribute("aria-hidden", "true");
          Object.assign(element.style, {
            position: "fixed",
            width: "2px",
            height: "2px",
            left: "-10px",
            bottom: "0",
            opacity: "0.001",
            pointerEvents: "none",
          });
          // Detached media elements can be throttled by Chromium, producing
          // missing or stuttering audio in a real-time MediaRecorder export.
          document.body.append(element);
          media.set(clip.id, element);
          await waitForMedia(element, signal);
          if (audioContext && audioLimiter) {
            try {
              const gain = audioContext.createGain();
              gain.gain.value = 0;
              audioContext.createMediaElementSource(element).connect(gain);
              gain.connect(audioLimiter);
              audioGains.set(clip.id, gain);
            } catch {
              throw new Error(`Audio could not be connected for ${clip.name}. Export stopped to avoid creating a silent video. Retry, or turn off Include timeline audio to deliberately export without sound.`);
            }
          }
        }
      }
    await audioContext?.resume();
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: options.videoBitsPerSecond,
      audioBitsPerSecond: 128_000,
    });
    activeRecorder = recorder;
    const result = recordingResult(recorder, mimeType);
    const started = performance.now();
    const finish = () => {
      cancelAnimationFrame(frame);
      media.forEach((element) => element.pause());
      if (recorder.state !== "inactive") recorder.stop();
    };
    recorder.start(1000);
    await new Promise<void>((resolve, reject) => {
      let finished = false;
      const complete = (error?: unknown) => {
        if (finished) return;
        finished = true;
        signal?.removeEventListener("abort", stop);
        recorder.removeEventListener("error", failed);
        recorder.removeEventListener("stop", interrupted);
        finish();
        error ? reject(error) : resolve();
      };
      const stop = () => complete();
      const failed = () => complete(new Error("Local composition encoding failed."));
      const interrupted = () => complete(new Error("The browser stopped exporting early. Retry with a smaller export."));
      recorder.addEventListener("error", failed);
      recorder.addEventListener("stop", interrupted);
      signal?.addEventListener("abort", stop, { once: true });
      if (signal?.aborted) { stop(); return; }
      const draw = () => {
        if (finished) return;
        try {
          const elapsed = (performance.now() - started) / 1000;
          const time = rangeStart + elapsed;
          if (signal?.aborted || elapsed >= duration) {
            complete();
            return;
          }
          for (const [clipId, element] of media) {
            const track = project.tracks.find((item) =>
              item.clips.some((clip) => clip.id === clipId),
            );
            const location = track?.clips.find((clip) => clip.id === clipId);
            const gain = audioGains.get(clipId);
            if (!location) continue;
            const active =
              time >= location.start && time < location.start + location.duration;
            if (!active) {
              if (gain) gain.gain.value = 0;
              if (!element.paused) element.pause();
              continue;
            }
            const expected = location.sourceStart + time - location.start;
            if (Math.abs(element.currentTime - expected) > 0.25)
              element.currentTime = expected;
            element.volume = 1;
            if (gain)
              gain.gain.value = track?.muted ? 0 : audioGain(location, time);
            if (element.paused) element.play().catch(error => { if (!finished) complete(error); });
          }
          drawComposition(project, time, canvas, context, new Map([...images, ...media] as [string, VisualSource][]), renderChroma, options);
          onProgress(
            Math.min(1, elapsed / duration) *
              (options.format === "webm" ? 1 : 0.85),
          );
          frame = requestAnimationFrame(draw);
        } catch (error) { complete(error); }
      };
      frame = requestAnimationFrame(draw);
    });
    let blob: Blob;
    try { blob = await result; } catch (error) { signal?.throwIfAborted(); throw error; }
    if (signal?.aborted)
      throw new DOMException("Export canceled", "AbortError");
    if (options.format === "webm") {
      onProgress(1);
      return blob;
    }
    onProgress(0.85);
    return await transcodeExport(blob, options.format, (ratio) =>
      onProgress(0.85 + ratio * 0.15), duration, signal,
    );
  } finally {
    cancelAnimationFrame(frame);
    if (activeRecorder && activeRecorder.state !== "inactive") activeRecorder.stop();
    media.forEach((element) => {
      element.pause();
      element.removeAttribute("src");
      element.load();
      element.remove();
    });
    stream.getTracks().forEach((track) => track.stop());
    await audioContext?.close().catch(() => {});
  }
}

export async function exportProject(
  project: VideoSplatProject, urls: Record<string, string>, options: ExportOptions,
  onProgress: (ratio: number) => void, signal?: AbortSignal, onStatus: (message: string) => void = () => {},
): Promise<Blob> {
  signal?.throwIfAborted();
  if (options.acceleration !== 'compatible' && options.format !== 'ogm') {
    try {
      const { exportFrames } = await import('./frames');
      return await exportFrames(project, urls, options, onProgress, signal, onStatus);
    } catch (error) {
      signal?.throwIfAborted();
      onProgress(0);
      onStatus(`Fast export unavailable (${error instanceof Error ? error.message : 'browser limitation'}). Restarting with compatible export.`);
    }
  } else onStatus('Compatible export · renders in real time');
  return exportCompatible(project, urls, options, onProgress, signal);
}
