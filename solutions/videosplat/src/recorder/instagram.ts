import type { CropRect } from './crop';
export type InstagramFormat = 'original' | 'reel' | 'story' | 'feed';
export function instagramCrop(format: InstagramFormat, width: number, height: number): CropRect {
  if (format === 'original' || width <= 0 || height <= 0) return { x: 0, y: 0, width: 1, height: 1 };
  const ratio = format === 'feed' ? 4 / 5 : 9 / 16;
  const w = Math.min(1, ratio * height / width);
  const h = Math.min(1, width / (ratio * height));
  return { x: (1 - w) / 2, y: (1 - h) / 2, width: w, height: h };
}
