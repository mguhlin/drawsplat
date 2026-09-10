export const MIN_ZOOM = 0.00001;
export const MAX_ZOOM = 16;
export const BASE_PIXELS_PER_SECOND = 42;
export const clampZoom = (zoom: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
export const fitTimelineZoom = (duration: number, availableWidth: number) =>
  clampZoom(Math.max(1, availableWidth - 32) / (Math.max(1, duration) * BASE_PIXELS_PER_SECOND));
export function rulerInterval(pixelsPerSecond: number) {
  const minimum = 70 / pixelsPerSecond;
  const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
  return steps.find(step => step >= minimum) ?? Math.ceil(minimum / 3600) * 3600;
}
