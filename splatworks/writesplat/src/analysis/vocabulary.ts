import type { TextBlock } from './ranges';

export interface VocabularyRange {
  term: string;
  from: number;
  to: number;
}

export function parseVocabularyTerms(input: string): string[] {
  const seen = new Set<string>();
  return input
    .split(/[\n,;]+/u)
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => {
      const key = term.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export function findVocabularyRanges(blocks: TextBlock[], terms: string[]): VocabularyRange[] {
  return blocks.flatMap((block) =>
    terms.flatMap((term) => {
      const ranges: VocabularyRange[] = [];
      const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'giu');
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(block.text)) !== null) {
        ranges.push({
          term,
          from: block.from + match.index,
          to: block.from + match.index + match[0].length,
        });
      }

      return ranges;
    }),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
