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

const recorderType = () => ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));

export async function optimizeVideo(file: File, options: OptimizeOptions, onProgress: (ratio: number) => void, signal?: AbortSignal): Promise<Blob> {
  if (!file.type.startsWith("video/")) throw new Error("Choose a video file to optimize.");
  if (!("MediaRecorder" in window) || !("captureStream" in HTMLCanvasElement.prototype)) throw new Error("This browser cannot create a local optimized copy. Try current Chrome or Edge.");
  const mimeType = recorderType(); if (!mimeType) throw new Error("This browser has no supported WebM encoder.");
  const sourceUrl = URL.createObjectURL(file); const video = document.createElement("video"); video.muted = true; video.playsInline = true; video.preload = "auto"; video.src = sourceUrl;
  try {
    await new Promise<void>((resolve, reject) => { video.onloadedmetadata = () => resolve(); video.onerror = () => reject(new Error("The browser could not decode this video.")); });
    const size = outputDimensions(video.videoWidth, video.videoHeight, options); const canvas = document.createElement("canvas"); canvas.width = size.width; canvas.height = size.height; const context = canvas.getContext("2d", { alpha: false }); if (!context) throw new Error("Canvas rendering is unavailable.");
    const stream = canvas.captureStream(options.frameRate); let audioContext: AudioContext | undefined;
    if (options.includeAudio) {
      try { audioContext = new AudioContext(); const source = audioContext.createMediaElementSource(video); const destination = audioContext.createMediaStreamDestination(); source.connect(destination); destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track)); } catch { /* Video-only output remains valid. */ }
    } else video.muted = true;
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: options.videoBitsPerSecond, audioBitsPerSecond: options.audioBitsPerSecond }); const chunks: Blob[] = [];
    const result = new Promise<Blob>((resolve, reject) => { recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); }; recorder.onerror = () => reject(new Error("Local video encoding failed.")); recorder.onstop = () => chunks.length ? resolve(new Blob(chunks, { type: mimeType })) : reject(new Error("The encoder produced an empty file.")); });
    let animation = 0; const draw = () => { if (signal?.aborted) { video.pause(); if (recorder.state !== "inactive") recorder.stop(); return; } context.drawImage(video, 0, 0, canvas.width, canvas.height); onProgress(video.duration ? Math.min(1, video.currentTime / video.duration) : 0); if (!video.ended) animation = requestAnimationFrame(draw); };
    signal?.addEventListener("abort", () => { video.pause(); cancelAnimationFrame(animation); if (recorder.state !== "inactive") recorder.stop(); }, { once: true });
    recorder.start(1000); await video.play(); draw(); await new Promise<void>((resolve) => { video.onended = () => resolve(); signal?.addEventListener("abort", () => resolve(), { once: true }); }); cancelAnimationFrame(animation); if (recorder.state !== "inactive") recorder.stop(); const blob = await result; onProgress(1); if (signal?.aborted) throw new DOMException("Optimization canceled", "AbortError"); await audioContext?.close(); stream.getTracks().forEach((track) => track.stop()); return blob;
  } finally { video.pause(); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(sourceUrl); }
}
