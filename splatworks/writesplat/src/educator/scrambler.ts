export function scrambleSentences(text: string): string {
  const sentences = splitSentences(text);
  return rotateItems(sentences).join(' ');
}

export function scrambleParagraphs(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return rotateItems(paragraphs).join('\n\n');
}

function splitSentences(text: string): string[] {
  return (
    text
      .match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/gu)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
}

function rotateItems(items: string[]): string[] {
  if (items.length <= 1) {
    return items;
  }

  return [...items.slice(1), items[0]];
}
