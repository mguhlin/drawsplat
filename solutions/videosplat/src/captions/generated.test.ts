import { describe, expect, it } from 'vitest';
import { addGeneratedCaptions } from './generated';
import { createProject } from '../domain/project';
import { audioSections, cuesToSrt, hasAudio, normalizeCues, validateCues } from '@splat/local-subtitles/core';
describe('generated subtitles', () => {
  it('places captions relative to the selected timeline clip and preserves other tracks', () => {
    const project = createProject();
    project.tracks[0].clips.push({ id: 'video', name: 'Recording', kind: 'video', start: 45, sourceStart: 12, duration: 10, properties: {} });
    const next = addGeneratedCaptions(project, 'video', [{ start: 1, end: 3, text: 'Hello there' }]);
    expect(next.tracks.at(-1)?.clips[0]).toMatchObject({ start: 46, duration: 2, properties: { text: 'Hello there', subtitleLayout: true } });
    expect(next.tracks.slice(0, 2)).toEqual(project.tracks);
    expect(project.tracks).toHaveLength(2);
    expect(() => addGeneratedCaptions(project, 'video', [{ start: 1, end: 11, text: 'Too long' }])).toThrow('beyond');
    expect(() => addGeneratedCaptions(project, 'missing', [{ start: 0, end: 1, text: 'Hi' }])).toThrow('no longer');
  });
  it('bounds missing timestamps and excludes invalid or empty output', () => {
    expect(normalizeCues([{ timestamp: [0, 2], text: ' Hi ' }, { timestamp: [1, null], text: 'there' }, { timestamp: [8, 10], text: '' }], 5)).toEqual([{ start: 0, end: 2, text: 'Hi' }, { start: 2, end: 5, text: 'there' }]);
  });
  it('rejects invalid edits and formats millisecond carry correctly', () => {
    expect(() => validateCues([{ start: 2, end: 1, text: 'oops' }])).toThrow();
    expect(() => validateCues([{ start: NaN, end: 1, text: 'oops' }])).toThrow();
    expect(cuesToSrt([{ start: 59.9999, end: 62, text: 'Hi' }])).toContain('00:01:00,000 --> 00:01:02,000');
  });
  it('splits long audio near silence without dropping or overlapping samples', () => {
    const audio = new Float32Array(51 * 16000).fill(.1);
    audio.fill(0, 22 * 16000, 23 * 16000);
    const sections = audioSections(audio);
    expect(sections).toHaveLength(3);
    expect(sections[0].end / 16000).toBeCloseTo(22.05);
    expect(sections.at(-1)?.end).toBe(audio.length);
    sections.forEach((section, i) => { expect(section.start).toBe(i ? sections[i - 1].end : 0); expect(section.end - section.start).toBeLessThanOrEqual(25 * 16000); });
  });
  it('detects silent audio before starting a model download', () => {
    expect(hasAudio(new Float32Array(16000))).toBe(false);
    expect(hasAudio(Float32Array.from([0, .1, -.1]))).toBe(true);
  });
});
