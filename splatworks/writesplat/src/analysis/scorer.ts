export interface ReadabilityScore {
  words: number;
  sentences: number;
  syllables: number;
  fleschKincaidGrade: number;
  fleschReadingEase: number;
}

export function formatReadabilityGrade(grade: number, wordCount: number): string {
  if (wordCount === 0) return 'Start writing';
  if (grade <= 1) return 'Kindergarten–Grade 1';
  if (grade <= 12) return `Grade ${Math.max(1, grade).toFixed(1)}`;
  if (grade <= 16) return 'College level';
  return 'Postgraduate / very complex';
}

export function analyzeReadability(text: string): ReadabilityScore {
  const words = getWords(text);
  const sentenceCount = countSentences(text, words.length);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);

  if (words.length === 0) {
    return {
      words: 0,
      sentences: 0,
      syllables: 0,
      fleschKincaidGrade: 0,
      fleschReadingEase: 0,
    };
  }

  const wordsPerSentence = words.length / sentenceCount;
  const syllablesPerWord = syllables / words.length;

  return {
    words: words.length,
    sentences: sentenceCount,
    syllables,
    fleschKincaidGrade: roundOne(0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59),
    fleschReadingEase: roundOne(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord),
  };
}

export function countSyllables(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');

  if (!word) {
    return 0;
  }

  if (word.length <= 3) {
    return 1;
  }

  let normalized = word;
  normalized = normalized.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/u, '');
  normalized = normalized.replace(/^y/u, '');

  const groups = normalized.match(/[aeiouy]{1,2}/gu);
  return Math.max(1, groups?.length ?? 1);
}

function getWords(text: string): string[] {
  return text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) ?? [];
}

function countSentences(text: string, wordCount: number): number {
  if (wordCount === 0) {
    return 0;
  }

  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  return Math.max(1, sentences?.length ?? 1);
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
