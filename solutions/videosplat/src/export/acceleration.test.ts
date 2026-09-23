import { afterEach, expect, it, vi } from 'vitest';
const { canEncodeVideo } = vi.hoisted(() => ({ canEncodeVideo: vi.fn() }));
vi.mock('mediabunny', () => ({ canEncodeVideo }));
import { chooseEncoder } from './frames';
import { DEFAULT_EXPORT } from './exporter';
afterEach(() => vi.resetAllMocks());
it('prefers a supported hardware codec over software', async () => {
  canEncodeVideo.mockImplementation(async (codec, config) => codec === 'vp8' && config.hardwareAcceleration === 'prefer-hardware');
  expect(await chooseEncoder(DEFAULT_EXPORT)).toEqual({ codec: 'vp8', hardwareAcceleration: 'prefer-hardware' });
});
it('falls back to software when hardware is unavailable', async () => {
  canEncodeVideo.mockImplementation(async (_codec, config) => config.hardwareAcceleration === 'prefer-software');
  expect(await chooseEncoder({ ...DEFAULT_EXPORT, format: 'mp4' })).toEqual({ codec: 'avc', hardwareAcceleration: 'prefer-software' });
});
it('honors the CPU override without requesting hardware', async () => {
  canEncodeVideo.mockResolvedValue(true);
  await chooseEncoder({ ...DEFAULT_EXPORT, acceleration: 'software' });
  expect(canEncodeVideo).toHaveBeenCalledTimes(1);
  expect(canEncodeVideo.mock.calls[0][1].hardwareAcceleration).toBe('prefer-software');
});
it('rejects unsupported codecs so the caller can use compatible export', async () => {
  canEncodeVideo.mockResolvedValue(false);
  await expect(chooseEncoder(DEFAULT_EXPORT)).rejects.toThrow('No compatible');
});
