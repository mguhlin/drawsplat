import { createField, createId, createRecord } from '../model/database';
import type { ListSplatTable } from '../model/types';

// Keep cell contents as text. Never interpret imported Markdown as HTML.
export function splitMarkdownRow(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let codeTicks = 0;
  const text = line.trim();
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '\\' && ['|', '\\'].includes(text[index + 1])) {
      cell += text[++index];
    } else if (char === '`') {
      let count = 1;
      while (text[index + count] === '`') count++;
      if (!codeTicks) codeTicks = count;
      else if (codeTicks === count) codeTicks = 0;
      cell += '`'.repeat(count);
      index += count - 1;
    } else if (char === '|' && !codeTicks) {
      cells.push(cell.trim());
      cell = '';
    } else cell += char;
  }
  cells.push(cell.trim());
  if (cells[0] === '' && text.startsWith('|')) cells.shift();
  if (cells.at(-1) === '' && text.endsWith('|')) cells.pop();
  return cells;
}

export function parseMarkdownTables(markdown: string): string[][][] {
  const lines = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const tables: string[][][] = [];
  const isSeparator = (line: string) => {
    const cells = splitMarkdownRow(line);
    return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
  };
  for (let index = 0; index < lines.length - 1; index++) {
    if (!(lines[index].includes('|') || lines[index + 1].includes('|')) || !isSeparator(lines[index + 1])) continue;
    const headers = splitMarkdownRow(lines[index]);
    if (!headers.length || headers.length !== splitMarkdownRow(lines[index + 1]).length) continue;
    const rows = [headers];
    index += 2;
    while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
      if (index + 1 < lines.length && isSeparator(lines[index + 1])) break;
      const cells = splitMarkdownRow(lines[index]);
      rows.push(headers.map((_, column) => cells[column] ?? ''));
      index++;
    }
    tables.push(rows);
    index--;
  }
  return tables;
}

export function tableFromMarkdownRows(name: string, rows: string[][]): ListSplatTable {
  if (!rows.length || !rows[0].length) throw new Error('No Markdown table selected.');
  const fields = rows[0].map((header, index) => createField(header.trim() || `Field ${index + 1}`));
  return {
    id: createId('table'), name: name.trim() || 'Imported Markdown', fields,
    records: rows.slice(1).map(row => createRecord(fields, Object.fromEntries(fields.map((field, index) => [field.id, row[index] ?? ''])))),
  };
}
