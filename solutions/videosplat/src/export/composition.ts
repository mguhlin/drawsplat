import type { Clip, VideoSplatProject } from '../domain/project';
import { activeVisualClips } from '../timeline/engine';
import { drawSubtitle } from '../captions/render';
import { chromaSettings, createChromaRenderer } from '../render/chroma';
import { renderRect, type FitMode } from '../render/geometry';
export type VisualSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas;
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

export function drawComposition(project: VideoSplatProject, time: number, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D,
  sources: Map<string, VisualSource>, renderChroma: ReturnType<typeof createChromaRenderer>, options: { burnSubtitles?: boolean }) {
  context.save();
  context.fillStyle = project.canvas.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
  for (const { clip } of activeVisualClips(project, time)) {
    if (clip.kind === "caption" && options.burnSubtitles === false) continue;
    const p = clip.properties;
    context.save();
    context.globalAlpha =
      Number(p.opacity ?? 1) * transitionGain(clip, time);
    if (clip.kind === "caption" && p.subtitleLayout) {
      drawSubtitle(context, clip, canvas.width, canvas.height);
      context.restore();
      continue;
    }
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
      const source = sources.get(clip.id);
      if (source) {
        const sourceWidth =
          source instanceof HTMLVideoElement
            ? source.videoWidth
            : source instanceof HTMLImageElement ? source.naturalWidth : source.width;
        const sourceHeight =
          source instanceof HTMLVideoElement
            ? source.videoHeight
            : source instanceof HTMLImageElement ? source.naturalHeight : source.height;
        const rect = renderRect(
          sourceWidth,
          sourceHeight,
          canvas.width,
          canvas.height,
          String(p.fit ?? "fit") as FitMode,
        );
        const key = chromaSettings(p);
        const factor = Math.min(1, Math.max(canvas.width, canvas.height) / Math.max(sourceWidth, sourceHeight));
        const renderedSource = key.enabled ? renderChroma(source, sourceWidth * factor, sourceHeight * factor, key) : source;
        context.drawImage(
          renderedSource,
          rect.x,
          rect.y,
          rect.width,
          rect.height,
        );
      }
    }
    context.restore();
  }

}
