import { describe, expect, it } from 'vitest';
import { findVocabularyRanges, parseVocabularyTerms } from '../src/analysis/vocabulary';

describe('vocabulary highlighter', () => {
  it('parses unique vocabulary terms', () => {
    expect(parseVocabularyTerms('moon, sun\nmoon; stars')).toEqual(['moon', 'sun', 'stars']);
  });

  it('finds whole-word vocabulary ranges', () => {
    const ranges = findVocabularyRanges([{ text: 'The moon is not moonlight. The sun is bright.', from: 5 }], [
      'moon',
      'sun',
    ]);

    expect(ranges).toEqual([
      { term: 'moon', from: 9, to: 13 },
      { term: 'sun', from: 36, to: 39 },
    ]);
  });
});
