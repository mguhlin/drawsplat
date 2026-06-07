import { createCell } from '../grid/gridModel';
import type { SheetData } from '../grid/types';
import { recalculateSheet } from '../formulas/engine';

export type SheetMatrix = string[][];

export function sheetToMatrix(sheet: SheetData): SheetMatrix {
  return trimMatrix(sheet.map((row) => row.map((cell) => cell.rawValue)));
}

export function matrixToSheet(
  matrix: SheetMatrix,
  rows = 20,
  cols = 20,
): SheetData {
  return recalculateSheet(
    Array.from({ length: rows }, (_, rowIndex) =>
      Array.from({ length: cols }, (_, colIndex) =>
        createCell(matrix[rowIndex]?.[colIndex] ?? ''),
      ),
    ),
  );
}

export function trimMatrix(matrix: SheetMatrix): SheetMatrix {
  let lastRow = matrix.length - 1;
  let lastCol = 0;

  while (
    lastRow >= 0 &&
    matrix[lastRow].every((value) => value.trim().length === 0)
  ) {
    lastRow -= 1;
  }

  for (let row = 0; row <= lastRow; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col].trim().length > 0) {
        lastCol = Math.max(lastCol, col);
      }
    }
  }

  if (lastRow < 0) {
    return [];
  }

  return matrix.slice(0, lastRow + 1).map((row) => row.slice(0, lastCol + 1));
}
