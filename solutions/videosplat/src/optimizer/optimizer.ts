import { supportedRecordingType } from "../media/recording";

export type OptimizerPreset = "editing" | "share" | "tiny" | "custom";

export interface OptimizeOptions {
  maxWidth: number;
  maxHeight: number;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
  frameRate: number;
  includeAudio: boolean;
}

export const OPTIMIZER_PRESETS: Record<Exclude<OptimizerPreset, "custom">, OptimizeOptions> = {
  editing: { maxWidth: 1280, maxHeight: 720, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000, frameRate: 30, includeAudio: true },
  share: { maxWidth: 1920, maxHeight: 1080, videoBitsPerSecond: 1_800_000, audioBitsPerSecond: 96_000, frameRate: 30, includeAudio: true },
  tiny: { maxWidth: 854, maxHeight: 480, videoBitsPerSecond: 650_000, audioBitsPerSecond: 64_000, frameRate: 24, includeAudio: true },
};

export function outputDimensions(width: number, height: number, options: OptimizeOptions) {
  const scale = Math.min(1, options.maxWidth / width, options.maxHeight / height);
  const even = (value: number) => Math.max(2, Math.round(value * scale / 2) * 2);
  return { width: even(width), height: even(height) };
}

export function estimatedBytes(duration: number, options: OptimizeOptions) {
  const bits = options.videoBitsPerSecond + (options.includeAudio ? options.audioBitsPerSecond : 0);
  return Math.ceil(duration * bits / 8);
}

export async function optimizeVideo(file: File, options: OptimizeOptions, onProgress: (ratio: number) => void, signal?: AbortSignal): Promise<Blob> {
  signal?.throwIfAborted();
  if (!file.type.startsWith("video/")) throw new Error("Choose a video file to optimize.");
  if (!("MediaRecorder" in window) || !("captureStream" in HTMLCanvasElement.prototype))
    throw new Error("This browser cannot create a local optimized copy. Try current Chrome or Edge.");
  const mimeType = supportedRecordingType(options.includeAudio);
  if (!mimeType) throw new Error("This browser has no supported WebM encoder.");
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.playsInline = true;
  video.preload = "auto";
  // Keep decoding active and route audio through Web Audio, without muting the
  // source signal. The destination stream is recorded, not played to speakers.
  video.muted = !options.includeAudio;
  video.setAttribute("aria-hidden", "true");
  Object.assign(video.style, { position: "fixed", width: "2px", height: "2px", left: "-10px", opacity: "0.001", pointerEvents: "none" });
  document.body.append(video);
  let stream: MediaStream | undefined;
  let audioContext: AudioContext | undefined;
  let recorder: MediaRecorder | undefined;
  let animation = 0;
  let removeAbort = () => {};
  try {
    await new Promise<void>((resolve, reject) => {
      const abort = () => reject(signal?.reason ?? new DOMException("Optimization canceled", "AbortError"));
      removeAbort = () => signal?.removeEventListener("abort", abort);
      signal?.addEventListener("abort", abort, { once: true });
      video.onloadedmetadata = () => { removeAbort(); resolve(); };
      video.onerror = () => { removeAbort(); reject(new Error("The browser could not decode this video.")); };
      video.src = sourceUrl;
    });
    signal?.throwIfAborted();
    const size = outputDimensions(video.videoWidth, video.videoHeight, options);
    const canvas = document.createElement("canvas");
    canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas rendering is unavailable.");
    stream = canvas.captureStream(options.frameRate);
    if (options.includeAudio) {
      try {
        audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        destination.stream.getAudioTracks().forEach((track) => stream!.addTrack(track));
        await audioContext.resume();
      } catch {
        throw new Error("Audio could not be connected. Optimization stopped to avoid creating a silent copy.");
      }
    }
    signal?.throwIfAborted();
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: options.videoBitsPerSecond, audioBitsPerSecond: options.audioBitsPerSecond });
    const encoder = recorder;
    const chunks: Blob[] = [];
    const blob = await new Promise<Blob>((resolve, reject) => {
      const stop = () => { if (encoder.state !== "inactive") encoder.stop(); };
      const abort = () => {
        stop();
        reject(signal?.reason ?? new DOMException("Optimization canceled", "AbortError"));
      };
      removeAbort = () => signal?.removeEventListener("abort", abort);
      signal?.addEventListener("abort", abort, { once: true });
      encoder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      encoder.onerror = () => reject(new Error("Local video encoding failed."));
      encoder.onstop = () => chunks.length
        ? resolve(new Blob(chunks, { type: mimeType }))
        : reject(new Error("The encoder produced an empty file."));
      video.onended = stop;
      video.onerror = () => reject(new Error("The video could not be decoded completely."));
      const draw = () => {
        if (signal?.aborted || encoder.state === "inactive") return;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        onProgress(Number.isFinite(video.duration) && video.duration > 0 ? Math.min(1, video.currentTime / video.duration) : 0);
        if (!video.ended) animation = requestAnimationFrame(draw);
      };
      encoder.start(1000);
      void video.play().then(draw, reject);
    });
    signal?.throwIfAborted();
    onProgress(1);
    return blob;
  } finally {
    removeAbort();
    cancelAnimationFrame(animation);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    await audioContext?.close();
    video.pause();
    video.removeAttribute("src"); video.load(); video.remove();
    URL.revokeObjectURL(sourceUrl);
  }
}
