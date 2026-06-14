export type CellType = 'blank' | 'number' | 'text' | 'formula';
export type CellTextAlign = 'left' | 'center' | 'right';
export type CellVerticalAlign = 'bottom' | 'middle' | 'top';

export interface CellFormat {
  align?: CellTextAlign;
  backgroundColor?: string;
  border?: boolean;
  bold?: boolean;
  fontFamily?: string;
  fontSize?: number;
  italic?: boolean;
  strikethrough?: boolean;
  textColor?: string;
  underline?: boolean;
  verticalAlign?: CellVerticalAlign;
  wrapText?: boolean;
}

export interface CellMerge {
  colSpan: number;
  rowSpan: number;
}

export interface SheetCell {
  rawValue: string;
  displayValue: string;
  format?: CellFormat;
  hiddenBy?: CellAddress;
  merge?: CellMerge;
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
