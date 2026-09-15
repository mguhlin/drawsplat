import { useEffect, useRef } from 'react';
import { chromaSettings, createChromaRenderer } from '../render/chroma';
import { renderRect, type FitMode } from '../render/geometry';
export function ChromaPreview({ properties, width, height }: { properties: Record<string, number | string | boolean>; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!, render = createChromaRenderer(), settings = chromaSettings(properties);
    const scale = Math.min(1, 960 / Math.max(width, height)); canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    let frame = 0, last = -Infinity, lastSource = '', lastTime = -1;
    const draw = (now: number) => {
      const source = canvas.parentElement?.querySelector('video,img') as HTMLVideoElement | HTMLImageElement | null;
      if (source && now - last >= 30) {
        const w = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
        const h = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
        const video = source instanceof HTMLVideoElement ? source : null;
        const sourceUrl = source.currentSrc || source.src;
        const sourceTime = video?.currentTime ?? 0;
        if (w && h && (!video || (video.readyState >= 2 && !video.seeking)) && (sourceUrl !== lastSource || sourceTime !== lastTime || (video && !video.paused))) {
          const ratio = Math.min(1, 960 / Math.max(w, h));
          const keyed = render(source, w * ratio, h * ratio, settings);
          const rect = renderRect(w, h, canvas.width, canvas.height, String(properties.fit ?? 'fit') as FitMode);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(keyed, rect.x + canvas.width / 2, rect.y + canvas.height / 2, rect.width, rect.height);
          last = now; lastSource = sourceUrl; lastTime = sourceTime;
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw); return () => cancelAnimationFrame(frame);
  }, [properties, width, height]);
  return <canvas className="chroma-preview" aria-label="Green screen preview" ref={ref}/>;
}
