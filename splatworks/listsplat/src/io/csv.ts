import { createField, createRecord } from '../model/database';
import type { ListSplatTable } from '../model/types';

// Guess the delimiter from the first line so tab- and semicolon-separated
// exports (common outside US English locales) import cleanly instead of
// collapsing into one column.
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const candidates = [',', '\t', ';'];
  let best = ',';
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

export function parseCsv(text: string, delimiter: string = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted && char === '"' && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === delimiter) {
      row.push(field);
      field = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

export function tableFromCsv(name: string, csvText: string): ListSplatTable {
  const rows = parseCsv(csvText);
  const headers = rows[0]?.map((header, index) => header.trim() || `Field ${index + 1}`) ?? ['Field 1'];
  const fields = headers.map((header) => createField(header));
  const records = rows.slice(1).map((row) =>
    createRecord(
      fields,
      Object.fromEntries(fields.map((field, index) => [field.id, row[index] ?? ''])),
    ),
  );

  return {
    id: `table_${Date.now().toString(36)}`,
    name,
    fields,
    records: records.length > 0 ? records : [createRecord(fields)],
  };
}

export function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function tableToCsv(table: ListSplatTable): string {
  const headers = table.fields.map((field) => escapeCsvCell(field.name)).join(',');
  const rows = table.records.map((record) =>
    table.fields.map((field) => escapeCsvCell(record.values[field.id])).join(','),
  );
  return [headers, ...rows].join('\n');
}
