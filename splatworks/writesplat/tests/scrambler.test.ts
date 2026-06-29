import { describe, expect, it } from 'vitest';
import { scrambleParagraphs, scrambleSentences } from '../src/educator/scrambler';

describe('scrambler', () => {
  it('rotates sentences deterministically', () => {
    expect(scrambleSentences('First. Second. Third.')).toBe('Second. Third. First.');
  });

  it('rotates paragraphs deterministically', () => {
    expect(scrambleParagraphs('One\n\nTwo\n\nThree')).toBe('Two\n\nThree\n\nOne');
  });
});
