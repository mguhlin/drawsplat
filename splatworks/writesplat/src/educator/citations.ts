export type CitationStyle = 'mla' | 'apa' | 'chicago';

export interface CitationFields {
  style: CitationStyle;
  author: string;
  title: string;
  publisher: string;
  year: string;
  url: string;
  accessDate: string;
}

export function formatCitation(fields: CitationFields): string {
  if (fields.style === 'apa') {
    return formatApa(fields);
  }

  if (fields.style === 'chicago') {
    return formatChicago(fields);
  }

  return formatMla(fields);
}

function formatMla(fields: CitationFields): string {
  return joinParts([
    punctuate(fields.author, '.'),
    quoteTitle(fields.title),
    punctuate(fields.publisher, ','),
    punctuate(fields.year, '.'),
    fields.url,
    fields.accessDate ? `Accessed ${fields.accessDate}.` : '',
  ]);
}

function formatApa(fields: CitationFields): string {
  return joinParts([
    fields.author ? `${fields.author} (${fields.year || 'n.d.'}).` : '',
    fields.title ? `${fields.title}.` : '',
    fields.publisher ? `${fields.publisher}.` : '',
    fields.url,
  ]);
}

function formatChicago(fields: CitationFields): string {
  return joinParts([
    punctuate(fields.author, '.'),
    quoteTitle(fields.title),
    punctuate(fields.publisher, ','),
    punctuate(fields.year, '.'),
    fields.url,
    fields.accessDate ? `Accessed ${fields.accessDate}.` : '',
  ]);
}

function quoteTitle(title: string): string {
  return title ? `"${title}."` : '';
}

function punctuate(value: string, punctuation: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.endsWith(punctuation.trim()) ? trimmed : `${trimmed}${punctuation}`;
}

function joinParts(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.');
}
