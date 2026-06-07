import Papa from 'papaparse';

import type { SheetData } from '../grid/types';
import { matrixToSheet, sheetToMatrix } from './matrix';

export function exportCsv(sheet: SheetData): string {
  return Papa.unparse(sheetToMatrix(sheet));
}

export function importCsv(text: string): SheetData {
  const result = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: false,
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  return matrixToSheet(result.data);
}
