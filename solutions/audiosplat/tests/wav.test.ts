import { describe, expect, it } from 'vitest';
import { encodeWav, formatTime } from '../src/audio/wav';

describe('WAV export', () => {
  it('writes a valid stereo PCM header and expected size', async () => {
    const left = new Float32Array([0, 1, -1]);
    const right = new Float32Array([0.5, -0.5, 0]);
    const buffer = {
      numberOfChannels: 2, length: 3, sampleRate: 48000,
      getChannelData: (channel: number) => channel === 0 ? left : right,
    } as AudioBuffer;
    const blob = encodeWav(buffer);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WAVE');
    expect(blob.size).toBe(44 + 3 * 2 * 2);
  });

  it('formats timeline values consistently', () => {
    expect(formatTime(0)).toBe('0:00.00');
    expect(formatTime(65.25)).toBe('1:05.25');
    expect(formatTime(-2)).toBe('0:00.00');
  });
});
