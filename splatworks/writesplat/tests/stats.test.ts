import { describe, expect, it } from 'vitest';
import { countDocumentStats } from '../src/app/stats';

describe('document stats', () => {
  it('counts words, sentences, and paragraph-like blocks', () => {
    const stats = countDocumentStats('<h1>Draft</h1><p>Hello class. Write clearly.</p><p>Revise.</p>');

    expect(stats.words).toBe(6);
    expect(stats.sentences).toBe(3);
    expect(stats.paragraphs).toBe(3);
  });
});
