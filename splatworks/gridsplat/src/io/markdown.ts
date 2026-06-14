import type { SheetData } from '../grid/types';
import { matrixToSheet, sheetToMatrix, type SheetMatrix } from './matrix';

function escapeCell(value: string): string {
  return value.replaceAll('|', '\\|').trim();
}

function splitMarkdownRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replaceAll('\\|', '|').trim());
}

function isSeparatorRow(row: string): boolean {
  return splitMarkdownRow(row).every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function matrixToMarkdown(matrix: SheetMatrix): string {
  if (matrix.length === 0) {
    return '|  |\n| --- |';
  }

  const width = Math.max(...matrix.map((row) => row.length), 1);
  const rows = matrix.map((row) =>
    Array.from({ length: width }, (_, index) => escapeCell(row[index] ?? '')),
  );
  const header = rows[0];
  const separator = Array.from({ length: width }, () => '---');
  const body = rows.slice(1);

  return [header, separator, ...body]
    .map((row) => `| ${row.join(' | ')} |`)
    .join('\n');
}

export function markdownToMatrix(markdown: string): SheetMatrix {
  const rows = markdown
    .trim()
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length < 2 || !isSeparatorRow(rows[1])) {
    throw new Error('This does not look like a Markdown table.');
  }

  return [rows[0], ...rows.slice(2)].map(splitMarkdownRow);
}

export function exportMarkdown(sheet: SheetData): string {
  return matrixToMarkdown(sheetToMatrix(sheet));
}

export function importMarkdown(markdown: string): SheetData {
  return matrixToSheet(markdownToMatrix(markdown));
}
