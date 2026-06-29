import { analyzeReadability } from './scorer';

export type WarningKind = 'hard' | 'very-hard' | 'passive' | 'adverb' | 'alternative' | 'weak';

export interface WritingWarning {
  kind: WarningKind;
  text: string;
  suggestion?: string;
}

export interface WritingWarnings {
  hardSentences: WritingWarning[];
  veryHardSentences: WritingWarning[];
  passiveVoice: WritingWarning[];
  adverbs: WritingWarning[];
  alternatives: WritingWarning[];
  weakPhrases: WritingWarning[];
}

const intensifiers = new Set(['very', 'really', 'quite', 'rather']);
const weakPhraseList = [
  'i think',
  'i believe',
  'sort of',
  'kind of',
  'in my opinion',
  'it seems',
  'maybe',
  'perhaps',
];

const simplerAlternatives = new Map<string, string>([
  ['utilize', 'use'],
  ['commence', 'start'],
  ['endeavor', 'try'],
  ['terminate', 'end'],
  ['approximately', 'about'],
  ['assist', 'help'],
  ['demonstrate', 'show'],
  ['individuals', 'people'],
  ['numerous', 'many'],
  ['sufficient', 'enough'],
  ['purchase', 'buy'],
  ['require', 'need'],
]);

export function analyzeWritingWarnings(text: string, targetGrade: number): WritingWarnings {
  const sentences = splitSentences(text);

  return {
    hardSentences: sentences
      .filter((sentence) => sentenceGrade(sentence) > targetGrade + 2)
      .map((sentence) => ({ kind: 'hard', text: sentence })),
    veryHardSentences: sentences
      .filter((sentence) => sentenceGrade(sentence) > targetGrade + 4)
      .map((sentence) => ({ kind: 'very-hard', text: sentence })),
    passiveVoice: detectPassiveVoice(text),
    adverbs: detectAdverbs(text),
    alternatives: detectAlternatives(text),
    weakPhrases: detectWeakPhrases(text),
  };
}

export function splitSentences(text: string): string[] {
  return (
    text
      .match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
}

function sentenceGrade(sentence: string): number {
  return analyzeReadability(sentence).fleschKincaidGrade;
}

function detectPassiveVoice(text: string): WritingWarning[] {
  const matches = text.match(/\b(?:am|is|are|was|were|be|been|being)\b\s+(?:\w+\s+){0,4}?\w+(?:ed|en)\b/giu) ?? [];
  return matches.map((match) => ({
    kind: 'passive',
    text: match.trim(),
    suggestion: 'Try naming who did the action.',
  }));
}

function detectAdverbs(text: string): WritingWarning[] {
  const words = text.match(/\b[A-Za-z]+(?:['-][A-Za-z]+)?\b/g) ?? [];
  return words
    .filter((word) => {
      const lower = word.toLowerCase();
      return intensifiers.has(lower) || (lower.endsWith('ly') && lower.length > 4);
    })
    .map((word) => ({
      kind: 'adverb',
      text: word,
      suggestion: 'Check whether a stronger verb would help.',
    }));
}

function detectAlternatives(text: string): WritingWarning[] {
  const words = text.match(/\b[A-Za-z]+(?:['-][A-Za-z]+)?\b/g) ?? [];
  return words.flatMap((word) => {
    const suggestion = simplerAlternatives.get(word.toLowerCase());
    if (!suggestion) {
      return [];
    }

    return [{ kind: 'alternative', text: word, suggestion }];
  });
}

function detectWeakPhrases(text: string): WritingWarning[] {
  const lower = text.toLowerCase();
  return weakPhraseList.flatMap((phrase) => {
    if (!lower.includes(phrase)) {
      return [];
    }

    return [
      {
        kind: 'weak',
        text: phrase,
        suggestion: 'Consider making the statement more direct.',
      },
    ];
  });
}
