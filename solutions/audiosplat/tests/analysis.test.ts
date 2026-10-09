import { expect, it } from 'vitest';
import { analyzeAudio, formatDbfs } from '../src/audio/analysis';
const buffer = (channels: number[][], rate = 4) => ({
  length: channels[0].length, sampleRate: rate, numberOfChannels: channels.length,
  getChannelData: (index: number) => new Float32Array(channels[index]),
}) as AudioBuffer;
it('measures each channel separately within the trimmed source range', () => {
  const input = buffer([[1, .5, -.5, 1], [-1, .25, .25, -1]]);
  const result = analyzeAudio(input, .25, .75);
  expect(result.duration).toBe(.5);
  expect(result.frames).toBe(2);
  expect(result.channels[0]).toEqual({peak: .5, rms: .5, dcOffset: 0, fullScaleSamples: 0});
  expect(result.channels[1]).toEqual({peak: .25, rms: .25, dcOffset: .25, fullScaleSamples: 0});
});
it('counts full-scale samples and handles silence without invalid dB values', () => {
  const result = analyzeAudio(buffer([[1, -1, 1.5, 0], [0, 0, 0, 0]]), 0, 1);
  expect(result.channels[0].fullScaleSamples).toBe(3);
  expect(result.channels[0].peak).toBe(1.5);
  expect(result.channels[1].rms).toBe(0);
  expect(formatDbfs(0)).toBe('−∞ dBFS');
  expect(formatDbfs(.5)).toBe('-6.02 dBFS');
});
it('clamps to available samples, rejects empty or invalid ranges and never writes audio', () => {
  const samples = new Float32Array([.5, -.5]);
  const input = {length:2, sampleRate:4, numberOfChannels:1, getChannelData:()=>samples} as unknown as AudioBuffer;
  expect(analyzeAudio(input, -1, 10).frames).toBe(2);
  expect([...samples]).toEqual([.5, -.5]);
  for (const range of [[1, 1], [NaN, 1], [0, Infinity], [2, 3]])
    expect(()=>analyzeAudio(input, range[0], range[1])).toThrow();
});
