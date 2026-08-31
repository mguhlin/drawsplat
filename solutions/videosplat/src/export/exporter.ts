import { activeVisualClips, projectDuration } from "../timeline/engine";
import type { Clip, VideoSplatProject } from "../domain/project";
import { renderRect, type FitMode } from "../render/geometry";

export interface ExportOptions {
  width: number;
  height: number;
  frameRate: number;
  videoBitsPerSecond: number;
  includeAudio: boolean;
  rangeStart?: number;
  rangeEnd?: number;
}
export const DEFAULT_EXPORT: ExportOptions = {
  width: 1280,
  height: 720,
  frameRate: 30,
  videoBitsPerSecond: 4_000_000,
  includeAudio: true,
};
export const transitionGain = (clip: Clip, time: number) => {
  const local = time - clip.start;
  const fadeIn = Number(clip.properties.transitionIn ?? 0);
  const fadeOut = Number(clip.properties.transitionOut ?? 0);
  return Math.max(
    0,
    Math.min(
      1,
      fadeIn > 0 ? local / fadeIn : 1,
      fadeOut > 0 ? (clip.duration - local) / fadeOut : 1,
    ),
  );
};
export const audioGain = (clip: Clip, time: number) => {
  const local = time - clip.start;
  const fadeIn = Number(clip.properties.fadeIn ?? 0);
  const fadeOut = Number(clip.properties.fadeOut ?? 0);
  return Math.max(
    0,
    Math.min(
      1,
      Number(clip.properties.volume ?? 1),
      fadeIn > 0 ? local / fadeIn : 1,
      fadeOut > 0 ? (clip.duration - local) / fadeOut : 1,
    ),
  );
};

const recorderType = () =>
  [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ].find((type) => MediaRecorder.isTypeSupported(type));
const waitMedia = (media: HTMLMediaElement) =>
  new Promise<void>((resolve, reject) => {
    media.onloadedmetadata = () => resolve();
    media.onerror = () =>
      reject(new Error("A timeline media file could not be decoded."));
  });
const waitImage = (image: HTMLImageElement) =>
  new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("A timeline image could not be decoded."));
  });

export async function exportProject(
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
  const mimeType = recorderType();
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
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas rendering is unavailable.");
  const stream = canvas.captureStream(options.frameRate);
  const audioContext = options.includeAudio ? new AudioContext() : undefined;
  const audioDestination = audioContext?.createMediaStreamDestination();
  audioDestination?.stream
    .getAudioTracks()
    .forEach((track) => stream.addTrack(track));
  const media = new Map<string, HTMLMediaElement>();
  const images = new Map<string, HTMLImageElement>();
  try {
    for (const track of project.tracks)
      for (const clip of track.clips) {
        if (!clip.assetId) continue;
        const asset = project.assets.find((item) => item.id === clip.assetId);
        const url = urls[clip.assetId];
        if (!asset || !url) continue;
        if (asset.kind === "image") {
          const image = new Image();
          image.src = url;
          await waitImage(image);
          images.set(clip.id, image);
        } else {
          const element = document.createElement(
            asset.kind,
          ) as HTMLMediaElement;
          element.src = url;
          element.preload = "auto";
          if (element instanceof HTMLVideoElement) element.playsInline = true;
          await waitMedia(element);
          media.set(clip.id, element);
          if (audioContext && audioDestination) {
            try {
              audioContext
                .createMediaElementSource(element)
                .connect(audioDestination);
            } catch {
              /* Video-only export remains available. */
            }
          }
        }
      }
    await audioContext?.resume();
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: options.videoBitsPerSecond,
    });
    const chunks: Blob[] = [];
    const result = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () =>
        reject(new Error("Local composition encoding failed."));
      recorder.onstop = () =>
        chunks.length
          ? resolve(new Blob(chunks, { type: mimeType }))
          : reject(new Error("The exporter produced an empty file."));
    });
    let frame = 0;
    const started = performance.now();
    const finish = () => {
      cancelAnimationFrame(frame);
      media.forEach((element) => element.pause());
      if (recorder.state !== "inactive") recorder.stop();
    };
    signal?.addEventListener("abort", finish, { once: true });
    recorder.start(1000);
    await new Promise<void>((resolve) => {
      const draw = async () => {
        const elapsed = (performance.now() - started) / 1000;
        const time = rangeStart + elapsed;
        if (signal?.aborted || elapsed >= duration) {
          finish();
          resolve();
          return;
        }
        context.save();
        context.fillStyle = project.canvas.background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();
        for (const [clipId, element] of media) {
          const location = project.tracks
            .flatMap((track) => track.clips)
            .find((clip) => clip.id === clipId);
          if (!location) continue;
          const active =
            time >= location.start && time < location.start + location.duration;
          if (!active) {
            if (!element.paused) element.pause();
            continue;
          }
          const expected = location.sourceStart + time - location.start;
          if (Math.abs(element.currentTime - expected) > 0.25)
            element.currentTime = expected;
          element.volume = audioGain(location, time);
          if (element.paused) element.play().catch(() => {});
        }
        for (const { clip } of activeVisualClips(project, time)) {
          const p = clip.properties;
          context.save();
          context.globalAlpha =
            Number(p.opacity ?? 1) * transitionGain(clip, time);
          context.filter = `brightness(${Number(p.brightness ?? 1)}) contrast(${Number(p.contrast ?? 1)}) saturate(${Number(p.saturation ?? 1)}) hue-rotate(${Number(p.hue ?? 0)}deg) grayscale(${Number(p.grayscale ?? 0)}) blur(${Number(p.blur ?? 0)}px)`;
          context.translate(
            canvas.width / 2 + Number(p.x ?? 0),
            canvas.height / 2 + Number(p.y ?? 0),
          );
          context.rotate((Number(p.rotation ?? 0) * Math.PI) / 180);
          context.scale(Number(p.scale ?? 1), Number(p.scale ?? 1));
          if (clip.kind === "text" || clip.kind === "caption") {
            const text = String(p.text ?? clip.name);
            const fontSize = Number(p.fontSize ?? 48);
            context.font = `700 ${fontSize}px system-ui`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            const lines = text.split("\n");
            const width =
              Math.max(
                ...lines.map((line) => context.measureText(line).width),
              ) + 32;
            if (String(p.background ?? "transparent") !== "transparent") {
              context.fillStyle = String(p.background);
              context.fillRect(
                -width / 2,
                (-fontSize * lines.length) / 2 - 12,
                width,
                fontSize * lines.length + 24,
              );
            }
            context.fillStyle = String(p.color ?? "#ffffff");
            lines.forEach((line, index) =>
              context.fillText(
                line,
                0,
                (index - (lines.length - 1) / 2) * fontSize * 1.15,
              ),
            );
          } else {
            const source = (images.get(clip.id) ?? media.get(clip.id)) as
              | HTMLImageElement
              | HTMLVideoElement
              | undefined;
            if (source) {
              const sourceWidth =
                source instanceof HTMLVideoElement
                  ? source.videoWidth
                  : source.naturalWidth;
              const sourceHeight =
                source instanceof HTMLVideoElement
                  ? source.videoHeight
                  : source.naturalHeight;
              const rect = renderRect(
                sourceWidth,
                sourceHeight,
                canvas.width,
                canvas.height,
                String(p.fit ?? "fit") as FitMode,
              );
              context.drawImage(
                source,
                rect.x,
                rect.y,
                rect.width,
                rect.height,
              );
            }
          }
          context.restore();
        }
        onProgress(Math.min(1, elapsed / duration));
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    });
    const blob = await result;
    if (signal?.aborted)
      throw new DOMException("Export canceled", "AbortError");
    onProgress(1);
    return blob;
  } finally {
    media.forEach((element) => {
      element.pause();
      element.removeAttribute("src");
      element.load();
    });
    stream.getTracks().forEach((track) => track.stop());
    await audioContext?.close();
  }
}
