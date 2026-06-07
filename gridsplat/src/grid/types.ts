export type CellType = 'blank' | 'number' | 'text' | 'formula';

export interface SheetCell {
  rawValue: string;
  displayValue: string;
  type: CellType;
  errorType?: string;
}

export interface CellAddress {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellAddress;
  end: CellAddress;
}

export type SheetData = SheetCell[][];
