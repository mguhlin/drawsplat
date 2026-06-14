import { normalizeSelection } from '../grid/gridModel';
import type { SelectionRange, SheetData } from '../grid/types';

export type ChartKind = 'bar' | 'line' | 'pie' | 'scatter';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartDataModel {
  points: ChartPoint[];
  title: string;
  type: ChartKind;
}

export function findChartValueColumn(
  sheet: SheetData,
  selection: SelectionRange,
): number {
  const normalized = normalizeSelection(selection);

  if (normalized.start.col === normalized.end.col) {
    return normalized.start.col;
  }

  for (
    let col = normalized.start.col + 1;
    col <= normalized.end.col;
    col += 1
  ) {
    for (let row = normalized.start.row; row <= normalized.end.row; row += 1) {
      const cell = sheet[row]?.[col];
      const value = Number(cell?.displayValue ?? cell?.rawValue ?? '');

      if (Number.isFinite(value)) {
        return col;
      }
    }
  }

  return normalized.start.col + 1;
}

export function buildChartData(
  sheet: SheetData,
  selection: SelectionRange,
  type: ChartKind,
  title = 'My Chart',
): ChartDataModel {
  const normalized = normalizeSelection(selection);
  const valueCol = findChartValueColumn(sheet, selection);
  const points: ChartPoint[] = [];

  for (let row = normalized.start.row; row <= normalized.end.row; row += 1) {
    const labelCell = sheet[row]?.[normalized.start.col];
    const valueCell = sheet[row]?.[valueCol];
    const value = Number(valueCell?.displayValue ?? valueCell?.rawValue ?? '');

    if (Number.isFinite(value)) {
      points.push({
        label:
          labelCell?.displayValue || labelCell?.rawValue || `Row ${row + 1}`,
        value,
      });
    }
  }

  return {
    points,
    title,
    type,
  };
}

export function findFirstDataRangeSelection(
  sheet: SheetData,
): SelectionRange | null {
  let endRow = -1;
  let endCol = -1;

  for (let row = sheet.length - 1; row >= 0; row -= 1) {
    if (sheet[row].some((cell) => cell.rawValue.trim().length > 0)) {
      endRow = row;
      break;
    }
  }

  if (endRow < 0) {
    return null;
  }

  for (let row = 0; row <= endRow; row += 1) {
    for (let col = sheet[row].length - 1; col >= 0; col -= 1) {
      if (sheet[row][col].rawValue.trim().length > 0) {
        endCol = Math.max(endCol, col);
        break;
      }
    }
  }

  return {
    start: { row: 0, col: 0 },
    end: { row: endRow, col: Math.max(1, endCol) },
  };
}

export function buildFirstDataRangeChart(
  sheet: SheetData,
  type: ChartKind,
  title = 'My Chart',
): ChartDataModel {
  const selection = findFirstDataRangeSelection(sheet);

  if (!selection) {
    return {
      points: [],
      title,
      type,
    };
  }

  return buildChartData(
    sheet,
    selection,
    type,
    title,
  );
}
