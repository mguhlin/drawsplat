import type { SheetData } from '../grid/types';
import { createNativeFile, sheetFromNativeFile } from './format';

export function exportNativeJson(sheet: SheetData): string {
  return JSON.stringify(createNativeFile(sheet), null, 2);
}

export function importNativeJson(text: string): SheetData {
  return sheetFromNativeFile(JSON.parse(text));
}
