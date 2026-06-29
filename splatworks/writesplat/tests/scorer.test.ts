import { describe, expect, it } from 'vitest';
import { analyzeReadability, countSyllables } from '../src/analysis/scorer';

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
});
