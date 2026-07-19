const STOP_WORDS = new Set(
  (
    'a an and are as at be but by for from had has have he her his i in is it its of on or she that the their them then there these they this to was were will with you your our we us my me not no do does did so if out up down over under again more most can just like get got go went one two also into about which who what when where why how'
  ).split(' '),
);

export interface WordCloudEntry {
  word: string;
  count: number;
  weight: number; // 0..1, relative to the most frequent word
}

// Count meaningful words (stop-words and very short tokens removed) and return
// the most frequent, each with a 0..1 weight for sizing.
export function buildWordCloud(text: string, maxWords = 40): WordCloudEntry[] {
  const counts = new Map<string, number>();
  const tokens = text
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/);
  for (const token of tokens) {
    if (token.length < 3 || STOP_WORDS.has(token) || /^\d+$/.test(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, maxWords);
  const max = sorted[0]?.[1] ?? 1;
  return sorted.map(([word, count]) => ({ word, count, weight: count / max }));
}
