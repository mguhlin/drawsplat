export interface DocumentStats {
  words: number;
  sentences: number;
  paragraphs: number;
}

export function htmlToText(html: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html.replace(/<[^>]+>/g, ' ');
  return textarea.value.replace(/\s+/g, ' ').trim();
}

export function countDocumentStats(html: string): DocumentStats {
  const text = htmlToText(html);
  const words = text ? text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0 : 0;
  const sentences = text ? text.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.length ?? 0 : 0;
  const host = document.createElement('div');
  host.innerHTML = html;
  const paragraphs = host.querySelectorAll('p, li, blockquote, h1, h2, h3').length;

  return {
    words,
    sentences: sentences || (words > 0 ? 1 : 0),
    paragraphs,
  };
}
