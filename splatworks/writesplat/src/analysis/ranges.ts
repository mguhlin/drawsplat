import { analyzeReadability } from './scorer';

export type AnalysisRangeKind = 'hard' | 'very-hard' | 'passive' | 'adverb' | 'alternative' | 'weak';

export interface TextBlock {
  text: string;
  from: number;
}

export interface AnalysisRange {
  kind: AnalysisRangeKind;
  from: number;
  to: number;
}

const intensifierPattern = /\b(?:very|really|quite|rather)\b|\b[A-Za-z]{5,}ly\b/giu;
const passivePattern = /\b(?:am|is|are|was|were|be|been|being)\b\s+(?:\w+\s+){0,4}?\w+(?:ed|en)\b/giu;
const weakPatterns = [
  /\bi think\b/giu,
  /\bi believe\b/giu,
  /\bsort of\b/giu,
  /\bkind of\b/giu,
  /\bin my opinion\b/giu,
  /\bit seems\b/giu,
  /\bmaybe\b/giu,
  /\bperhaps\b/giu,
];
const alternativePattern =
  /\b(?:utilize|commence|endeavor|terminate|approximately|assist|demonstrate|individuals|numerous|sufficient|purchase|require)\b/giu;

export function findAnalysisRanges(blocks: TextBlock[], targetGrade: number): AnalysisRange[] {
  return blocks.flatMap((block) => [
    ...findSentenceRanges(block, targetGrade),
    ...findRegexRanges(block, passivePattern, 'passive'),
    ...findRegexRanges(block, intensifierPattern, 'adverb'),
    ...findRegexRanges(block, alternativePattern, 'alternative'),
    ...weakPatterns.flatMap((pattern) => findRegexRanges(block, pattern, 'weak')),
  ]);
}

function findSentenceRanges(block: TextBlock, targetGrade: number): AnalysisRange[] {
  const ranges: AnalysisRange[] = [];
  const sentencePattern = /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/gu;
  let match: RegExpExecArray | null;

  while ((match = sentencePattern.exec(block.text)) !== null) {
    const sentence = match[0].trim();
    if (!sentence) {
      continue;
    }

    const grade = analyzeReadability(sentence).fleschKincaidGrade;
    const startOffset = match.index + (match[0].match(/^\s*/u)?.[0].length ?? 0);
    const endOffset = startOffset + sentence.length;

    if (grade > targetGrade + 4) {
      ranges.push({ kind: 'very-hard', from: block.from + startOffset, to: block.from + endOffset });
    } else if (grade > targetGrade + 2) {
      ranges.push({ kind: 'hard', from: block.from + startOffset, to: block.from + endOffset });
    }
  }

  return ranges;
}

function findRegexRanges(block: TextBlock, pattern: RegExp, kind: AnalysisRangeKind): AnalysisRange[] {
  const ranges: AnalysisRange[] = [];
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(block.text)) !== null) {
    ranges.push({
      kind,
      from: block.from + match.index,
      to: block.from + match.index + match[0].length,
    });
  }

  return ranges;
}
