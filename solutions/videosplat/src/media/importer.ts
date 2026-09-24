import type { Asset } from "../domain/project";

const SUPPORTED = /^(video|audio|image)\//;
// Audio and image processing still require full-file decoding.
const MAX_IMPORT_BYTES = 512 * 1024 * 1024;

export interface ImportedMedia { asset: Asset; blob: Blob }

export async function hashBlob(blob: Blob): Promise<string> {
  // Bound hashing memory even for long recordings. Keep SHA-256 compatible
  // with saved project hashes so relinking existing media continues to work.
  if (blob.size > 8 * 1024 * 1024) {
    const { createSHA256 } = await import("hash-wasm");
    const hash = await createSHA256();
    for (let offset = 0; offset < blob.size; offset += 4 * 1024 * 1024) {
      hash.update(new Uint8Array(await blob.slice(offset, offset + 4 * 1024 * 1024).arrayBuffer()));
    }
    return hash.digest();
  }
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function loadElement(element: HTMLMediaElement, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    element.preload = "metadata";
    element.onloadedmetadata = () => resolve();
    element.onerror = () => reject(new Error("The browser could not decode this media file."));
    element.src = url;
  });
}

async function recoverMediaDuration(element: HTMLMediaElement, file: File): Promise<number | undefined> {
  // WebM metadata may describe only the first fragment, even when finite.
  // Probe encoded packets before trusting it for a recording's timeline length.
  if (!file.type.includes("webm") && Number.isFinite(element.duration) && element.duration > 0)
    return element.duration;
  // Read encoded timestamps without decoding or trusting a speculative seek.
  // MediaRecorder WebM often has no duration header, especially across browsers.
  const { Input, ALL_FORMATS, BlobSource } = await import("mediabunny");
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file, { maxCacheSize: 8 * 1024 * 1024 }) });
  try {
    const duration = await input.computeDuration();
    if (Number.isFinite(duration) && duration > 0) return duration;
  } catch { /* A browser may support a format the demuxer does not. */ }
  finally { input.dispose(); }
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      const duration = Number.isFinite(element.duration) && element.duration > 0
        ? element.duration
        : undefined;
      if (!duration || settled) return;
      settled = true;
      cleanup();
      element.currentTime = 0;
      resolve(duration);
    };
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(undefined);
    }, 2000);
    const cleanup = () => {
      clearTimeout(timeout);
      element.removeEventListener("durationchange", finish);
      element.removeEventListener("timeupdate", finish);
      element.removeEventListener("seeked", finish);
    };
    element.addEventListener("durationchange", finish);
    element.addEventListener("timeupdate", finish);
    element.addEventListener("seeked", finish);
    // MediaRecorder WebM blobs frequently omit a duration header. Chromium
    // discovers the encoded end when asked to seek beyond it.
    try {
      element.currentTime = Number.MAX_SAFE_INTEGER;
    } catch {
      settled = true;
      cleanup();
      resolve(undefined);
    }
  });
}

async function videoThumbnail(video: HTMLVideoElement): Promise<string | undefined> {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 320 / Math.max(1, video.videoWidth));
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  try {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      await new Promise<void>((resolve) => { video.onseeked = () => resolve(); video.currentTime = Math.min(.25, video.duration / 2); });
    }
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", .72);
  } catch { return undefined; }
}

async function imageMetadata(url: string) {
  const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("The browser could not decode this image.")); image.src = url; });
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 320 / Math.max(1, image.naturalWidth));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { width: image.naturalWidth, height: image.naturalHeight, thumbnail: canvas.toDataURL("image/jpeg", .72) };
}

async function audioWaveform(file: File): Promise<number[] | undefined> {
  try {
    const context = new AudioContext();
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const channel = decoded.getChannelData(0); const bins = 80; const step = Math.max(1, Math.floor(channel.length / bins)); const peaks: number[] = [];
    for (let bin = 0; bin < bins; bin++) { let peak = 0; const end = Math.min(channel.length, (bin + 1) * step); for (let i = bin * step; i < end; i++) peak = Math.max(peak, Math.abs(channel[i])); peaks.push(Number(peak.toFixed(3))); }
    await context.close(); return peaks;
  } catch { return undefined; }
}

export async function importMedia(file: File): Promise<ImportedMedia> {
  if (!SUPPORTED.test(file.type)) throw new Error(`${file.name} is not a supported video, audio, or image file.`);
  if (!file.type.startsWith("video/") && file.size > MAX_IMPORT_BYTES) throw new Error(`${file.name} is larger than the current 512 MB import limit.`);
  const kind = file.type.split("/")[0] as Asset["kind"];
  const id = crypto.randomUUID(); const url = URL.createObjectURL(file);
  try {
    let duration: number | undefined; let width: number | undefined; let height: number | undefined; let thumbnail: string | undefined; let waveform: number[] | undefined;
    if (kind === "video") { const video = document.createElement("video"); await loadElement(video, url); duration = await recoverMediaDuration(video, file); width = video.videoWidth; height = video.videoHeight; thumbnail = await videoThumbnail(video); video.removeAttribute("src"); video.load(); }
    if (kind === "audio") { const audio = document.createElement("audio"); await loadElement(audio, url); duration = await recoverMediaDuration(audio, file); waveform = await audioWaveform(file); audio.removeAttribute("src"); audio.load(); }
    if (kind === "image") ({ width, height, thumbnail } = await imageMetadata(url));
    if (kind !== "image" && !(duration && Number.isFinite(duration) && duration > 0))
      throw new Error(`Could not determine the full duration of ${file.name}. The file was not added; try exporting it again.`);
    return { blob: file, asset: { id, name: file.name, kind, size: file.size, mimeType: file.type, duration, width, height, thumbnail, waveform, contentHash: await hashBlob(file), storedLocally: true } };
  } finally { URL.revokeObjectURL(url); }
}
