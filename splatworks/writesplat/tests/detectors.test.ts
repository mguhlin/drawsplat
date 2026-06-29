import { describe, expect, it } from 'vitest';
import { analyzeWritingWarnings, splitSentences } from '../src/analysis/detectors';

describe('writing warning detectors', () => {
  it('splits sentences without dropping a final fragment', () => {
    expect(splitSentences('First sentence. Second sentence without punctuation')).toEqual([
      'First sentence.',
      'Second sentence without punctuation',
    ]);
  });

  it('detects classroom writing warnings', () => {
    const warnings = analyzeWritingWarnings(
      'I think the assignment was completed very quickly. Students utilize numerous examples.',
      6,
    );

    expect(warnings.passiveVoice.map((warning) => warning.text)).toContain('was completed');
    expect(warnings.adverbs.map((warning) => warning.text.toLowerCase())).toEqual(
      expect.arrayContaining(['very', 'quickly']),
    );
    expect(warnings.alternatives.map((warning) => warning.text.toLowerCase())).toEqual(
      expect.arrayContaining(['utilize', 'numerous']),
    );
    expect(warnings.weakPhrases.map((warning) => warning.text)).toContain('i think');
  });
});
