import { describe, expect, it } from 'vitest';
import { findAnalysisRanges } from '../src/analysis/ranges';

describe('analysis ranges', () => {
  it('finds inline warning ranges with document offsets', () => {
    const ranges = findAnalysisRanges(
      [{ text: 'I think the assignment was completed very quickly. Students utilize examples.', from: 10 }],
      6,
    );

    expect(ranges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'weak', from: 10, to: 17 }),
        expect.objectContaining({ kind: 'passive', from: 33, to: 46 }),
        expect.objectContaining({ kind: 'adverb', from: 47, to: 51 }),
        expect.objectContaining({ kind: 'adverb', from: 52, to: 59 }),
        expect.objectContaining({ kind: 'alternative', from: 70, to: 77 }),
      ]),
    );
  });
});
