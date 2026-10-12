import type { CellFormat, SheetData } from '../grid/types';
import { matrixToSheet, sheetToMatrix, type SheetMatrix } from './matrix';
import { createCell } from '../grid/gridModel';
import { recalculateSheet } from '../formulas/engine';

export const GRID_SPLAT_FILE_VERSION = 1;
export interface GridSplatFile {
  version: typeof GRID_SPLAT_FILE_VERSION;
  metadata: { createdAt: string; title: string };
  sheets: [{ id: string; name: string; cells: SheetMatrix; rows?: number; cols?: number;
    formats?: { row: number; col: number; format: CellFormat }[];
    merges?: { row: number; col: number; rowSpan: number; colSpan: number }[] }];
  charts: unknown[];
  pictureGraphs: unknown[];
}
export function createNativeFile(sheet: SheetData): GridSplatFile {
  const formats: NonNullable<GridSplatFile['sheets'][0]['formats']> = [], merges: NonNullable<GridSplatFile['sheets'][0]['merges']> = [];
  sheet.forEach((row,r) => row.forEach((cell,c) => {
    if (cell.format) formats.push({row:r,col:c,format:cell.format});
    if (cell.merge) merges.push({row:r,col:c,...cell.merge});
  }));
  return {version:1,metadata:{createdAt:new Date().toISOString(),title:'GridSplat™'},sheets:[{id:'sheet-1',name:'Sheet 1',cells:sheetToMatrix(sheet),rows:sheet.length,cols:sheet[0].length,formats,merges}],charts:[],pictureGraphs:[]};
}
export function sanitizeFormat(value: unknown): CellFormat {
  if (!value || typeof value !== 'object') throw new Error('Invalid cell formatting.');
  const input = value as Record<string,unknown>, result: Record<string,unknown> = {};
  for (const key of ['bold','italic','underline','strikethrough','border','wrapText']) if (typeof input[key] === 'boolean') result[key] = input[key];
  for (const key of ['textColor','backgroundColor']) if (typeof input[key] === 'string' && /^#[0-9a-f]{3,8}$/i.test(input[key])) result[key] = input[key];
  if (typeof input.fontFamily === 'string' && input.fontFamily.length <= 100) result.fontFamily = input.fontFamily;
  if (typeof input.fontSize === 'number' && input.fontSize >= 8 && input.fontSize <= 72) result.fontSize = input.fontSize;
  if (['left','center','right'].includes(String(input.align))) result.align = input.align;
  if (['top','middle','bottom'].includes(String(input.verticalAlign))) result.verticalAlign = input.verticalAlign;
  if (['plain','whole','decimal','currency','percent','thousands','scientific','date'].includes(String(input.numberFormat))) result.numberFormat = input.numberFormat;
  if (Number.isInteger(input.decimalPlaces) && Number(input.decimalPlaces) >= 0 && Number(input.decimalPlaces) <= 10) result.decimalPlaces = input.decimalPlaces;
  return result as CellFormat;
}
export function sheetFromNativeFile(file: GridSplatFile): SheetData {
  validateNativeFile(file);
  const source = file.sheets[0];
  const sheet = matrixToSheet(source.cells, source.rows ?? 20, source.cols ?? 20);
  const valid = (r:number,c:number) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < sheet.length && c < sheet[0].length;
  if (source.formats && (!Array.isArray(source.formats) || source.formats.length > 100000)) throw new Error('Invalid formatting records.');
  // Assign metadata once; avoid an O(cells × formats) import for large sheets.
  for (const entry of source.formats || []) {
    if (!entry || !valid(entry.row,entry.col)) throw new Error('Formatting points outside the sheet.');
    sheet[entry.row][entry.col] = {...sheet[entry.row][entry.col],format:sanitizeFormat(entry.format)};
  }
  if (source.merges && (!Array.isArray(source.merges) || source.merges.length > 10000)) throw new Error('Invalid merged ranges.');
  for (const merge of source.merges || []) {
    if (!merge || !valid(merge.row,merge.col) || !Number.isInteger(merge.rowSpan) || !Number.isInteger(merge.colSpan) || merge.rowSpan < 1 || merge.colSpan < 1 || !valid(merge.row + merge.rowSpan - 1, merge.col + merge.colSpan - 1)) throw new Error('Invalid merged range.');
    for(let r=merge.row;r<merge.row+merge.rowSpan;r++)for(let c=merge.col;c<merge.col+merge.colSpan;c++){
      if(sheet[r][c].merge || sheet[r][c].hiddenBy)throw new Error('Merged ranges overlap.');
    }
    sheet[merge.row][merge.col].merge={rowSpan:merge.rowSpan,colSpan:merge.colSpan};
    for(let r=merge.row;r<merge.row+merge.rowSpan;r++)for(let c=merge.col;c<merge.col+merge.colSpan;c++)if(r!==merge.row || c!==merge.col){
      sheet[r][c]={...createCell('',sheet[r][c].format),hiddenBy:{row:merge.row,col:merge.col}};
    }
  }
  return recalculateSheet(sheet);
}
export function validateNativeFile(value: unknown): asserts value is GridSplatFile {
  if (!value || typeof value !== 'object') throw new Error('The file is not a readable GridSplat™ file.');
  const candidate = value as GridSplatFile;
  if (candidate.version !== 1) throw new Error('This GridSplat™ file uses a version this app cannot open yet.');
  if (!Array.isArray(candidate.sheets) || !candidate.sheets.length) throw new Error('This GridSplat™ file does not contain a sheet.');
  const source = candidate.sheets[0];
  if (!source || !Array.isArray(source.cells) || source.cells.length > 2000 || source.cells.some(row => !Array.isArray(row) || row.length > 200 || row.some(cell => typeof cell !== 'string'))) throw new Error('This GridSplat™ file has invalid sheet data.');
  if ((source.rows !== undefined && (!Number.isInteger(source.rows) || source.rows < 1)) || (source.cols !== undefined && (!Number.isInteger(source.cols) || source.cols < 1))) throw new Error('Invalid sheet dimensions.');
}
