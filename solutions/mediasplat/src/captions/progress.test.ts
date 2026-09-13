import { afterEach, describe, expect, it, vi } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { fingerprint } from '../../../shared/subtitles/checkpoints';
import { MAX_SECONDS, SAMPLE_RATE, quietSectionLength, cuesToSrt } from '../../../shared/subtitles/core';
afterEach(() => vi.unstubAllGlobals());
describe('resumable long transcription', () => {
  it('fingerprints all file bytes and the selected range in bounded reads', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const original = new Uint8Array(3 * 1024 * 1024);
    const changed = original.slice(); changed[1500000] = 1;
    const signal = new AbortController().signal;
    const first = await fingerprint(new NodeBlob([original]) as unknown as Blob, 0, 60, signal);
    expect(await fingerprint(new NodeBlob([original]) as unknown as Blob, 0, 60, signal)).toBe(first);
    expect(await fingerprint(new NodeBlob([changed]) as unknown as Blob, 0, 60, signal)).not.toBe(first);
    expect(await fingerprint(new NodeBlob([original]) as unknown as Blob, 10, 60, signal)).not.toBe(first);
  });
  it('stops hashing when cancelled', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const controller = new AbortController(); controller.abort();
    await expect(fingerprint(new NodeBlob(['audio']) as unknown as Blob, 0, 10, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('chooses a quiet boundary and preserves the complete final window', () => {
    const audio = new Float32Array(25 * SAMPLE_RATE).fill(.5);
    audio.fill(0, 22 * SAMPLE_RATE, Math.round(22.1 * SAMPLE_RATE));
    expect(quietSectionLength(audio)).toBe(Math.round(22.05 * SAMPLE_RATE));
    expect(quietSectionLength(audio.subarray(0, 12000))).toBe(12000);
  });
  it('allows two hours and exports continuous timestamps beyond one hour', () => {
    expect(MAX_SECONDS).toBe(7200);
    expect(cuesToSrt([{start:3599.9,end:3600.2,text:'Across the hour'}, {start:7190,end:7199,text:'End'}])).toContain('00:59:59,900 --> 01:00:00,200');
    expect(cuesToSrt([{start:7190,end:7199,text:'End'}])).toContain('01:59:50,000 --> 01:59:59,000');
  });
});

it('isolates models while preserving legacy Tiny checkpoints', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const file = new NodeBlob(['same audio']) as unknown as Blob;
  const signal = new AbortController().signal;
  const legacy = await fingerprint(file, 0, 60, signal);
  expect(await fingerprint(file, 0, 60, signal, 'tiny')).toBe(legacy);
  const small = await fingerprint(file, 0, 60, signal, 'small');
  const medium = await fingerprint(file, 0, 60, signal, 'medium');
  const turbo = await fingerprint(file, 0, 60, signal, 'turbo');
  expect(new Set([legacy, small, medium, turbo]).size).toBe(4);
});

it('defaults to Small and tolerates unavailable or invalid saved preferences', async () => {
  const { preferredModel, rememberModel, getWhisperModel } = await import('../../../shared/subtitles/models');
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  expect(preferredModel()).toBe('small');
  rememberModel('medium');
  expect(preferredModel()).toBe('medium');
  rememberModel('turbo');
  expect(preferredModel()).toBe('turbo');
  rememberModel('local');
  expect(preferredModel()).toBe('local');
  values.set('splat.transcription.model', 'unsupported');
  expect(preferredModel()).toBe('small');
  expect(() => getWhisperModel('__proto__')).toThrow('supported Whisper model');
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
  expect(preferredModel()).toBe('small');
  expect(() => rememberModel('tiny')).not.toThrow();
});
