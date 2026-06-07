import type {
  CellAddress,
  SelectionRange,
  SheetCell,
  SheetData,
} from './types';
import { recalculateSheet } from '../formulas/engine';

const BLANK_CELL: SheetCell = {
  rawValue: '',
  displayValue: '',
  type: 'blank',
};

export function createSheet(rows: number, cols: number): SheetData {
  return recalculateSheet(
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ ...BLANK_CELL })),
    ),
  );
}

export function createCell(rawValue: string): SheetCell {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return { ...BLANK_CELL };
  }

  if (trimmedValue.startsWith('=')) {
    return {
      rawValue,
      displayValue: rawValue,
      type: 'formula',
    };
  }

  const numberValue = Number(trimmedValue);

  if (!Number.isNaN(numberValue) && Number.isFinite(numberValue)) {
    return {
      rawValue,
      displayValue: trimmedValue,
      type: 'number',
    };
  }

  return {
    rawValue,
    displayValue: rawValue,
    type: 'text',
  };
}

export function updateCell(
  sheet: SheetData,
  address: CellAddress,
  rawValue: string,
): SheetData {
  return recalculateSheet(
    sheet.map((row, rowIndex) =>
      row.map((cell, colIndex) =>
        rowIndex === address.row && colIndex === address.col
          ? createCell(rawValue)
          : cell,
      ),
    ),
  );
}

export function pasteCells(
  sheet: SheetData,
  start: CellAddress,
  values: string[][],
): SheetData {
  return recalculateSheet(
    sheet.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const pastedRow = rowIndex - start.row;
        const pastedCol = colIndex - start.col;
        const pastedValue = values[pastedRow]?.[pastedCol];

        return pastedValue === undefined ? cell : createCell(pastedValue);
      }),
    ),
  );
}

export function parsePastedText(text: string): string[][] {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = normalizedText.endsWith('\n')
    ? normalizedText.slice(0, -1).split('\n')
    : normalizedText.split('\n');

  return rows.map((row) => row.split('\t'));
}

export function normalizeSelection(selection: SelectionRange): SelectionRange {
  return {
    start: {
      row: Math.min(selection.start.row, selection.end.row),
      col: Math.min(selection.start.col, selection.end.col),
    },
    end: {
      row: Math.max(selection.start.row, selection.end.row),
      col: Math.max(selection.start.col, selection.end.col),
    },
  };
}

export function serializeSelection(
  sheet: SheetData,
  selection: SelectionRange,
): string {
  const normalized = normalizeSelection(selection);
  const rows: string[] = [];

  for (let row = normalized.start.row; row <= normalized.end.row; row += 1) {
    const values: string[] = [];

    for (let col = normalized.start.col; col <= normalized.end.col; col += 1) {
      values.push(sheet[row]?.[col]?.rawValue ?? '');
    }

    rows.push(values.join('\t'));
  }

  return rows.join('\n');
}

export function getColumnName(index: number): string {
  let value = index + 1;
  let name = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

export function isCellInSelection(
  address: CellAddress,
  selection: SelectionRange,
): boolean {
  const normalized = normalizeSelection(selection);

  return (
    address.row >= normalized.start.row &&
    address.row <= normalized.end.row &&
    address.col >= normalized.start.col &&
    address.col <= normalized.end.col
  );
}
