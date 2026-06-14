import ExcelJS from 'exceljs';

import type { SheetData } from '../grid/types';
import { matrixToSheet, sheetToMatrix, type SheetMatrix } from './matrix';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function cellValueToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'object' && 'formula' in value) {
    const formula = value.formula;

    return typeof formula === 'string' ? `=${formula}` : '';
  }

  if (typeof value === 'object' && 'richText' in value) {
    return value.richText?.map((item) => item.text).join('') ?? '';
  }

  if (typeof value === 'object' && 'text' in value) {
    return String(value.text ?? '');
  }

  if (typeof value === 'object' && 'result' in value) {
    return cellValueToText(value.result as ExcelJS.CellValue);
  }

  return String(value);
}

function toArrayBuffer(buffer: ExcelJS.Buffer): ArrayBuffer {
  if (buffer instanceof ArrayBuffer) {
    return buffer;
  }

  const view = new Uint8Array(buffer as ArrayBufferLike);
  const copy = new Uint8Array(view.byteLength);

  copy.set(view);

  return copy.buffer;
}

export async function exportExcel(sheet: SheetData): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');
  const matrix = sheetToMatrix(sheet);

  matrix.forEach((row) => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();

  return toArrayBuffer(buffer);
}

export async function importExcel(buffer: ArrayBuffer): Promise<SheetData> {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('This Excel file does not contain a worksheet.');
  }

  const matrix: SheetMatrix = [];

  worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
    const values: string[] = [];

    row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
      values[colIndex - 1] = cellValueToText(cell.value);
    });

    matrix[rowIndex - 1] = values;
  });

  return matrixToSheet(matrix);
}

export function excelMimeType(): string {
  return EXCEL_MIME;
}
