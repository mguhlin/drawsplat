import type { SheetData } from '../grid/types';
import { matrixToSheet, sheetToMatrix, type SheetMatrix } from './matrix';

export const GRID_SPLAT_FILE_VERSION = 1;

export interface GridSplatFile {
  version: typeof GRID_SPLAT_FILE_VERSION;
  metadata: {
    createdAt: string;
    title: string;
  };
  sheets: [
    {
      id: string;
      name: string;
      cells: SheetMatrix;
    },
  ];
  charts: unknown[];
  pictureGraphs: unknown[];
}

export function createNativeFile(sheet: SheetData): GridSplatFile {
  return {
    version: GRID_SPLAT_FILE_VERSION,
    metadata: {
      createdAt: new Date().toISOString(),
      title: 'GridSplat™',
    },
    sheets: [
      {
        id: 'sheet-1',
        name: 'Sheet 1',
        cells: sheetToMatrix(sheet),
      },
    ],
    charts: [],
    pictureGraphs: [],
  };
}

export function sheetFromNativeFile(file: GridSplatFile): SheetData {
  validateNativeFile(file);

  return matrixToSheet(file.sheets[0].cells);
}

export function validateNativeFile(
  value: unknown,
): asserts value is GridSplatFile {
  if (!value || typeof value !== 'object') {
    throw new Error('The file is not a readable GridSplat™ file.');
  }

  const candidate = value as {
    sheets?: unknown;
    version?: unknown;
  };

  if (candidate.version !== GRID_SPLAT_FILE_VERSION) {
    throw new Error(
      'This GridSplat™ file uses a version this app cannot open yet.',
    );
  }

  if (!Array.isArray(candidate.sheets) || candidate.sheets.length === 0) {
    throw new Error('This GridSplat™ file does not contain a sheet.');
  }

  const firstSheet = candidate.sheets[0] as { cells?: unknown } | undefined;

  if (!firstSheet || !Array.isArray(firstSheet.cells)) {
    throw new Error(
      'This GridSplat™ file has sheet data GridSplat™ cannot read.',
    );
  }
}
