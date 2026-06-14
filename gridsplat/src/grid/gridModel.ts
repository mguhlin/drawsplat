import type {
  CellFormat,
  CellAddress,
  SelectionRange,
  SheetCell,
  SheetData,
} from './types';
import Papa from 'papaparse';
import { recalculateSheet } from '../formulas/engine';

const BLANK_CELL: SheetCell = {
  rawValue: '',
  displayValue: '',
  type: 'blank',
};

function compactFormat(format?: CellFormat): CellFormat | undefined {
  if (!format) {
    return undefined;
  }

  const nextFormat: CellFormat = {};

  if (format.align) {
    nextFormat.align = format.align;
  }

  if (format.backgroundColor) {
    nextFormat.backgroundColor = format.backgroundColor;
  }

  if (format.border) {
    nextFormat.border = true;
  }

  if (format.bold) {
    nextFormat.bold = true;
  }

  if (format.fontSize) {
    nextFormat.fontSize = format.fontSize;
  }

  if (format.italic) {
    nextFormat.italic = true;
  }

  if (format.strikethrough) {
    nextFormat.strikethrough = true;
  }

  if (format.textColor) {
    nextFormat.textColor = format.textColor;
  }

  if (format.underline) {
    nextFormat.underline = true;
  }

  return Object.keys(nextFormat).length > 0 ? nextFormat : undefined;
}

function withFormat(cell: SheetCell, format?: CellFormat): SheetCell {
  const compactedFormat = compactFormat(format);

  return compactedFormat ? { ...cell, format: compactedFormat } : cell;
}

export function createSheet(rows: number, cols: number): SheetData {
  return recalculateSheet(
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ ...BLANK_CELL })),
    ),
  );
}

export function createCell(rawValue: string, format?: CellFormat): SheetCell {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return withFormat({ ...BLANK_CELL }, format);
  }

  if (trimmedValue.startsWith('=')) {
    return withFormat(
      {
        rawValue,
        displayValue: rawValue,
        type: 'formula',
      },
      format,
    );
  }

  const numberValue = Number(trimmedValue);

  if (!Number.isNaN(numberValue) && Number.isFinite(numberValue)) {
    return withFormat(
      {
        rawValue,
        displayValue: trimmedValue,
        type: 'number',
      },
      format,
    );
  }

  return withFormat(
    {
      rawValue,
      displayValue: rawValue,
      type: 'text',
    },
    format,
  );
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
          ? createCell(rawValue, cell.format)
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

        return pastedValue === undefined
          ? cell
          : createCell(pastedValue, cell.format);
      }),
    ),
  );
}

export function applyCellFormat(
  sheet: SheetData,
  selection: SelectionRange,
  format: CellFormat,
): SheetData {
  const normalized = normalizeSelection(selection);

  return sheet.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (
        rowIndex < normalized.start.row ||
        rowIndex > normalized.end.row ||
        colIndex < normalized.start.col ||
        colIndex > normalized.end.col
      ) {
        return cell;
      }

      return withFormat(cell, {
        ...cell.format,
        ...format,
      });
    }),
  );
}

export function clearCells(
  sheet: SheetData,
  selection: SelectionRange,
): SheetData {
  const normalized = normalizeSelection(selection);

  return recalculateSheet(
    sheet.map((row, rowIndex) =>
      row.map((cell, colIndex) =>
        rowIndex >= normalized.start.row &&
        rowIndex <= normalized.end.row &&
        colIndex >= normalized.start.col &&
        colIndex <= normalized.end.col
          ? createCell('', cell.format)
          : cell,
      ),
    ),
  );
}

export function parsePastedText(text: string): string[][] {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (normalizedText.includes('\t')) {
    const rows = normalizedText.endsWith('\n')
      ? normalizedText.slice(0, -1).split('\n')
      : normalizedText.split('\n');

    return rows.map((row) => row.split('\t'));
  }

  const result = Papa.parse<string[]>(normalizedText, {
    skipEmptyLines: false,
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
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
