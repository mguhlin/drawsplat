import { useEffect, useRef } from "react";
import type { Clip } from "../domain/project";
import { drawSubtitle } from "../captions/render";
export function SubtitlePreview({ clip, width, height }: { clip: Clip; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const canvas = ref.current; const context = canvas?.getContext("2d"); if (context) { context.clearRect(0, 0, width, height); drawSubtitle(context, clip, width, height); } }, [clip, width, height]);
  return <canvas ref={ref} width={width} height={height} style={{width: "100%", height: "100%", objectFit: "contain"}} aria-label={String(clip.properties.text ?? clip.name)}/>;
}
