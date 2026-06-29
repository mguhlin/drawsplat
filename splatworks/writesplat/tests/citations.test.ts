import { describe, expect, it } from 'vitest';
import { formatCitation } from '../src/educator/citations';

describe('citation formatter', () => {
  it('formats MLA citations', () => {
    expect(
      formatCitation({
        style: 'mla',
        author: 'Guhlin, Miguel',
        title: 'Classroom Writing',
        publisher: 'DrawSplat Press',
        year: '2026',
        url: 'https://drawsplat.org',
        accessDate: '29 June 2026',
      }),
    ).toBe('Guhlin, Miguel. "Classroom Writing." DrawSplat Press, 2026. https://drawsplat.org Accessed 29 June 2026.');
  });

  it('formats APA citations', () => {
    expect(
      formatCitation({
        style: 'apa',
        author: 'Guhlin, Miguel',
        title: 'Classroom Writing',
        publisher: 'DrawSplat Press',
        year: '2026',
        url: 'https://drawsplat.org',
        accessDate: '',
      }),
    ).toBe('Guhlin, Miguel (2026). Classroom Writing. DrawSplat Press. https://drawsplat.org');
  });
});
