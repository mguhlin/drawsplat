export {displayCellNumber} from './numberFormat';
import { HyperFormula } from 'hyperformula';
import { createCell, normalizeSelection, getColumnName } from './gridModel';
import { recalculateSheet } from '../formulas/engine';
import type { SelectionRange, SheetData } from './types';

export function checkSize(rows: number, cols: number) {
  if (rows < 1 || cols < 1 || rows > 2000 || cols > 200 || rows * cols > 100000) {
    throw new Error('Use 1–2,000 rows, 1–200 columns, and no more than 100,000 cells.');
  }
}
export function rangeReference(selection: SelectionRange): string {
  const r = normalizeSelection(selection);
  const first = `${getColumnName(r.start.col)}${r.start.row + 1}`;
  const last = `${getColumnName(r.end.col)}${r.end.row + 1}`;
  return first === last ? first : `${first}:${last}`;
}
export function parseRange(text: string, rows: number, cols: number): SelectionRange {
  const column = (s: string) => [...s.toUpperCase()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  const value = text.trim().replace(/\$/g, '').toUpperCase();
  let start, end;
  const cells = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(value);
  const columns = /^([A-Z]+):([A-Z]+)$/.exec(value);
  const rowRange = /^(\d+):(\d+)$/.exec(value);
  if (cells) {
    start = { row: Number(cells[2]) - 1, col: column(cells[1]) };
    end = { row: Number(cells[4] || cells[2]) - 1, col: column(cells[3] || cells[1]) };
  } else if (columns) {
    start = { row: 0, col: column(columns[1]) }; end = { row: rows - 1, col: column(columns[2]) };
  } else if (rowRange) {
    start = { row: Number(rowRange[1]) - 1, col: 0 }; end = { row: Number(rowRange[2]) - 1, col: cols - 1 };
  } else throw new Error('Enter a cell or range, such as A1, A1:D10, A:C, or 2:5.');
  const range = normalizeSelection({ start, end });
  if (range.start.row < 0 || range.start.col < 0 || range.end.row >= rows || range.end.col >= cols) throw new Error('That range is outside this sheet.');
  return range;
}

function engineFor(sheet: SheetData) {
  return HyperFormula.buildFromArray(sheet.map(row => row.map(cell => cell.rawValue)), { licenseKey: 'gpl-v3' });
}
function fromEngine(engine: HyperFormula, metadata: SheetData): SheetData {
  const values = engine.getSheetSerialized(0);
  return recalculateSheet(metadata.map((row, r) => row.map((cell, c) => ({ ...cell, ...createCell(String(values[r]?.[c] ?? ''), cell.format) }))));
}
export function changeStructure(sheet: SheetData, axis: 'row' | 'col', index: number, count: number, remove = false): SheetData {
  const rows = sheet.length, cols = sheet[0].length;
  if (count < 1 || !Number.isInteger(count) || index < 0 || index > (axis === 'row' ? rows : cols) || (remove && index + count > (axis === 'row' ? rows : cols))) throw new Error('Choose a valid row or column range.');
  checkSize(rows + (axis === 'row' ? (remove ? -count : count) : 0), cols + (axis === 'col' ? (remove ? -count : count) : 0));
  if (sheet.some(row => row.some(cell => cell.merge))) throw new Error('Unmerge cells before inserting or deleting rows or columns.');
  const metadata = sheet.map(row => row.map(cell => ({...cell})));
  const engine = engineFor(sheet);
  try {
    if (axis === 'row') {
      if (remove) { engine.removeRows(0, [index, count]); metadata.splice(index, count); }
      else { engine.addRows(0, [index, count]); metadata.splice(index, 0, ...Array.from({length:count}, () => Array.from({length:cols}, () => createCell('')))); }
    } else {
      if (remove) engine.removeColumns(0, [index, count]); else engine.addColumns(0, [index, count]);
      metadata.forEach(row => row.splice(index, remove ? count : 0, ...(remove ? [] : Array.from({length:count}, () => createCell('')))));
    }
    return fromEngine(engine, metadata);
  } finally { engine.destroy(); }
}
export function fillRange(sheet: SheetData, selection: SelectionRange, direction: 'down' | 'right', series = false): SheetData {
  const range = normalizeSelection(selection);
  if (sheet.some(row => row.some(cell => cell.merge))) throw new Error('Unmerge cells before using Fill.');
  const metadata = sheet.map(row => row.map(cell => ({...cell})));
  const engine = engineFor(sheet);
  try {
    for (let r = range.start.row; r <= range.end.row; r++) {
      for (let c = range.start.col; c <= range.end.col; c++) {
        const source = direction === 'down' ? {row:range.start.row,col:c} : {row:r,col:range.start.col};
        const offset = direction === 'down' ? r - source.row : c - source.col;
        if (!offset) continue;
        const first = sheet[source.row][source.col];
        const second = direction === 'down' ? sheet[source.row + 1]?.[source.col] : sheet[source.row]?.[source.col + 1];
        if (series && first.type === 'number') {
          const step = second?.type === 'number' ? Number(second.rawValue) - Number(first.rawValue) : 1;
          engine.setCellContents({sheet:0,row:r,col:c}, String(Number(first.rawValue) + offset * step));
        } else {
          engine.copy({start:{sheet:0,...source},end:{sheet:0,...source}});
          engine.paste({sheet:0,row:r,col:c});
        }
        metadata[r][c] = createCell('', first.format);
      }
    }
    return fromEngine(engine, metadata);
  } finally { engine.destroy(); }
}
export function replaceInRange(sheet: SheetData, selection: SelectionRange, search: string, replacement: string, matchCase = false): SheetData {
  if (!search) throw new Error('Enter text to find.');
  const range = normalizeSelection(selection), escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), pattern = new RegExp(escaped, matchCase ? 'g' : 'gi');
  return recalculateSheet(sheet.map((row,r) => row.map((cell,c) => r >= range.start.row && r <= range.end.row && c >= range.start.col && c <= range.end.col && cell.type !== 'formula' ? {...cell,...createCell(cell.rawValue.replace(pattern, () => replacement), cell.format)} : cell)));
}
