import { describe, expect, it } from 'vitest';
import { analyzeReadability, countSyllables, formatReadabilityGrade } from '../src/analysis/scorer';

describe('readability scorer', () => {
  it('counts syllables with common English corrections', () => {
    expect(countSyllables('cat')).toBe(1);
    expect(countSyllables('writing')).toBe(2);
    expect(countSyllables('readable')).toBe(3);
    expect(countSyllables('walked')).toBe(1);
  });

  it('returns Flesch-Kincaid scores for classroom text', () => {
    const score = analyzeReadability('Students write clear sentences. They revise drafts.');

    expect(score.words).toBe(7);
    expect(score.sentences).toBe(2);
    expect(score.syllables).toBeGreaterThan(7);
    expect(score.fleschKincaidGrade).toBeGreaterThanOrEqual(0);
    expect(score.fleschReadingEase).toBeGreaterThan(0);
  });

  it('handles empty text', () => {
    expect(analyzeReadability('')).toEqual({
      words: 0,
      sentences: 0,
      syllables: 0,
      fleschKincaidGrade: 0,
      fleschReadingEase: 0,
    });
  });

  it('turns out-of-range formula results into honest reading-level labels', () => {
    expect(formatReadabilityGrade(0, 0)).toBe('Start writing');
    expect(formatReadabilityGrade(7.4, 100)).toBe('Grade 7.4');
    expect(formatReadabilityGrade(14.2, 100)).toBe('College level');
    expect(formatReadabilityGrade(28.7, 100)).toBe('Postgraduate / very complex');
  });
});
