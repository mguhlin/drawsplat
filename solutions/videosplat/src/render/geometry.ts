export type FitMode = "fit" | "fill" | "stretch";

export interface RenderRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function renderRect(
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  mode: FitMode = "fit",
): RenderRect {
  if (mode === "stretch")
    return {
      x: -canvasWidth / 2,
      y: -canvasHeight / 2,
      width: canvasWidth,
      height: canvasHeight,
    };

  const scale =
    mode === "fill"
      ? Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight)
      : Math.min(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return { x: -width / 2, y: -height / 2, width, height };
}
