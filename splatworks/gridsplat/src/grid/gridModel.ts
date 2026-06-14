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

  if (format.fontFamily) {
    nextFormat.fontFamily = format.fontFamily;
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

  if (format.verticalAlign) {
    nextFormat.verticalAlign = format.verticalAlign;
  }

  if (format.wrapText) {
    nextFormat.wrapText = true;
  }

  return Object.keys(nextFormat).length > 0 ? nextFormat : undefined;
}

function withFormat(cell: SheetCell, format?: CellFormat): SheetCell {
  const compactedFormat = compactFormat(format);

  return compactedFormat ? { ...cell, format: compactedFormat } : cell;
}

function withCellMetadata(nextCell: SheetCell, previousCell: SheetCell): SheetCell {
  return {
    ...nextCell,
    hiddenBy: previousCell.hiddenBy,
    merge: previousCell.merge,
  };
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
          ? withCellMetadata(createCell(rawValue, cell.format), cell)
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
          : withCellMetadata(createCell(pastedValue, cell.format), cell);
      }),
    ),
  );
}

export function clearCellFormat(
  sheet: SheetData,
  selection: SelectionRange,
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

      const { format, ...nextCell } = cell;

      void format;

      return nextCell;
    }),
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

function rangesOverlap(first: SelectionRange, second: SelectionRange): boolean {
  return (
    first.start.row <= second.end.row &&
    first.end.row >= second.start.row &&
    first.start.col <= second.end.col &&
    first.end.col >= second.start.col
  );
}

function getMergeRange(
  sheet: SheetData,
  row: number,
  col: number,
): SelectionRange | null {
  const cell = sheet[row]?.[col];

  if (cell?.merge) {
    return {
      start: { row, col },
      end: {
        row: row + cell.merge.rowSpan - 1,
        col: col + cell.merge.colSpan - 1,
      },
    };
  }

  if (cell?.hiddenBy) {
    const owner = cell.hiddenBy;
    const ownerCell = sheet[owner.row]?.[owner.col];

    if (ownerCell?.merge) {
      return {
        start: owner,
        end: {
          row: owner.row + ownerCell.merge.rowSpan - 1,
          col: owner.col + ownerCell.merge.colSpan - 1,
        },
      };
    }
  }

  return null;
}

function removeMergeMetadata(
  sheet: SheetData,
  selection: SelectionRange,
): SheetData {
  const normalized = normalizeSelection(selection);
  const mergeOwners = new Set<string>();

  sheet.forEach((row, rowIndex) => {
    row.forEach((_, colIndex) => {
      const mergeRange = getMergeRange(sheet, rowIndex, colIndex);

      if (mergeRange && rangesOverlap(mergeRange, normalized)) {
        mergeOwners.add(`${mergeRange.start.row}:${mergeRange.start.col}`);
      }
    });
  });

  if (mergeOwners.size === 0) {
    return sheet;
  }

  return sheet.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const isOwner = mergeOwners.has(`${rowIndex}:${colIndex}`);
      const hiddenOwner = cell.hiddenBy
        ? `${cell.hiddenBy.row}:${cell.hiddenBy.col}`
        : null;

      if (!isOwner && (!hiddenOwner || !mergeOwners.has(hiddenOwner))) {
        return cell;
      }

      const { hiddenBy, merge, ...nextCell } = cell;

      void hiddenBy;
      void merge;

      return nextCell;
    }),
  );
}

export function mergeCells(
  sheet: SheetData,
  selection: SelectionRange,
): SheetData {
  const normalized = normalizeSelection(selection);
  const rowSpan = normalized.end.row - normalized.start.row + 1;
  const colSpan = normalized.end.col - normalized.start.col + 1;

  if (rowSpan === 1 && colSpan === 1) {
    return recalculateSheet(removeMergeMetadata(sheet, normalized));
  }

  const unmergedSheet = removeMergeMetadata(sheet, normalized);

  return recalculateSheet(
    unmergedSheet.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const isInsideSelection =
          rowIndex >= normalized.start.row &&
          rowIndex <= normalized.end.row &&
          colIndex >= normalized.start.col &&
          colIndex <= normalized.end.col;

        if (!isInsideSelection) {
          return cell;
        }

        const isOwner =
          rowIndex === normalized.start.row && colIndex === normalized.start.col;

        if (isOwner) {
          return {
            ...cell,
            merge: { colSpan, rowSpan },
          };
        }

        return {
          ...createCell('', cell.format),
          hiddenBy: normalized.start,
        };
      }),
    ),
  );
}

function compareCellValues(first: SheetCell, second: SheetCell): number {
  const firstNumber = Number(first.displayValue || first.rawValue);
  const secondNumber = Number(second.displayValue || second.rawValue);

  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return (first.displayValue || first.rawValue).localeCompare(
    second.displayValue || second.rawValue,
    undefined,
    { numeric: true, sensitivity: 'base' },
  );
}

export function sortRows(
  sheet: SheetData,
  selection: SelectionRange,
  keyCol: number,
  direction: 'ascending' | 'descending',
): SheetData {
  const normalized = normalizeSelection(selection);
  const sortedRows = sheet
    .slice(normalized.start.row, normalized.end.row + 1)
    .sort((firstRow, secondRow) => {
      const comparison = compareCellValues(
        firstRow[keyCol] ?? BLANK_CELL,
        secondRow[keyCol] ?? BLANK_CELL,
      );

      return direction === 'ascending' ? comparison : -comparison;
    });

  return recalculateSheet(
    sheet.map((row, rowIndex) =>
      rowIndex >= normalized.start.row && rowIndex <= normalized.end.row
        ? sortedRows[rowIndex - normalized.start.row]
        : row,
    ),
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
