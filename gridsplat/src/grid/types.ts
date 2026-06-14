export type CellType = 'blank' | 'number' | 'text' | 'formula';
export type CellTextAlign = 'left' | 'center' | 'right';

export interface CellFormat {
  align?: CellTextAlign;
  backgroundColor?: string;
  border?: boolean;
  bold?: boolean;
  fontSize?: number;
  italic?: boolean;
  strikethrough?: boolean;
  textColor?: string;
  underline?: boolean;
}

export interface SheetCell {
  rawValue: string;
  displayValue: string;
  format?: CellFormat;
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
