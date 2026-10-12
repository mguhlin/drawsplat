import { expect, it } from 'vitest';
import { instagramCrop } from './instagram';
it.each(['reel', 'story', 'feed'] as const)('keeps %s framing proportional and inside landscape/portrait sources', format => {
  for (const [width, height] of [[1920, 1080], [1080, 1920], [720, 1280], [1080, 1080]]) {
    const rect = instagramCrop(format, width, height);
    expect(rect.width * width / (rect.height * height)).toBeCloseTo(format === 'feed' ? 4 / 5 : 9 / 16);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(1);
    expect(rect.y + rect.height).toBeLessThanOrEqual(1);
  }
});
it('preserves the entire source for original framing or missing metadata', () => {
  expect(instagramCrop('original', 1920, 1080)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  expect(instagramCrop('reel', 0, 0)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
});
