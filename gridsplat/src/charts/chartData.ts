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

export function buildChartData(
  sheet: SheetData,
  selection: SelectionRange,
  type: ChartKind,
  title = 'My Chart',
): ChartDataModel {
  const normalized = normalizeSelection(selection);
  const points: ChartPoint[] = [];

  for (let row = normalized.start.row; row <= normalized.end.row; row += 1) {
    const labelCell = sheet[row]?.[normalized.start.col];
    const valueCell =
      sheet[row]?.[
        normalized.start.col === normalized.end.col
          ? normalized.start.col
          : normalized.start.col + 1
      ];
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

export function buildFirstDataRangeChart(
  sheet: SheetData,
  type: ChartKind,
  title = 'My Chart',
): ChartDataModel {
  let endRow = -1;

  for (let row = sheet.length - 1; row >= 0; row -= 1) {
    if (sheet[row].some((cell) => cell.rawValue.trim().length > 0)) {
      endRow = row;
      break;
    }
  }

  if (endRow < 0) {
    return {
      points: [],
      title,
      type,
    };
  }

  return buildChartData(
    sheet,
    {
      start: { row: 1, col: 0 },
      end: { row: endRow, col: 1 },
    },
    type,
    title,
  );
}
