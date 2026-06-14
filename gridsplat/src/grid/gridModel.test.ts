import { describe, expect, it } from 'vitest';
import {
  createCell,
  createSheet,
  applyCellFormat,
  clearCells,
  getColumnName,
  parsePastedText,
  pasteCells,
  serializeSelection,
  updateCell,
} from './gridModel';

describe('gridModel', () => {
  it('classifies blank, number, text, and formula cells', () => {
    expect(createCell('').type).toBe('blank');
    expect(createCell('42').type).toBe('number');
    expect(createCell('Apples').type).toBe('text');
    expect(createCell('=SUM(A1:A2)').type).toBe('formula');
  });

  it('parses tab-delimited pasted text', () => {
    expect(parsePastedText('1\t2\n3\t4\n')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('parses comma-delimited pasted text with quoted values', () => {
    expect(parsePastedText('Name,Note\nApples,"Red, sweet"')).toEqual([
      ['Name', 'Note'],
      ['Apples', 'Red, sweet'],
    ]);
  });

  it('updates, pastes, and serializes selected cells', () => {
    let sheet = createSheet(4, 4);

    sheet = updateCell(sheet, { row: 0, col: 0 }, 'A');
    sheet = pasteCells(sheet, { row: 1, col: 1 }, [
      ['B', 'C'],
      ['D', 'E'],
    ]);

    expect(sheet[0][0].displayValue).toBe('A');
    expect(sheet[2][2].displayValue).toBe('E');
    expect(
      serializeSelection(sheet, {
        start: { row: 1, col: 1 },
        end: { row: 2, col: 2 },
      }),
    ).toBe('B\tC\nD\tE');
  });

  it('clears selected cells and recalculates formulas', () => {
    let sheet = createSheet(4, 4);

    sheet = updateCell(sheet, { row: 0, col: 0 }, '5');
    sheet = updateCell(sheet, { row: 1, col: 0 }, '6');
    sheet = updateCell(sheet, { row: 0, col: 1 }, '=SUM(A1:A2)');
    sheet = clearCells(sheet, {
      start: { row: 0, col: 0 },
      end: { row: 0, col: 0 },
    });

    expect(sheet[0][0].displayValue).toBe('');
    expect(sheet[0][1].displayValue).toBe('6');
  });

  it('applies formatting across a selected range and preserves it through edits', () => {
    let sheet = createSheet(4, 4);

    sheet = applyCellFormat(
      sheet,
      {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 1 },
      },
      { align: 'center', bold: true, backgroundColor: '#fff2cc' },
    );
    sheet = updateCell(sheet, { row: 0, col: 0 }, 'Name');
    sheet = pasteCells(sheet, { row: 0, col: 1 }, [['Count']]);
    sheet = clearCells(sheet, {
      start: { row: 0, col: 1 },
      end: { row: 0, col: 1 },
    });

    expect(sheet[0][0].format).toMatchObject({
      align: 'center',
      bold: true,
      backgroundColor: '#fff2cc',
    });
    expect(sheet[0][1].displayValue).toBe('');
    expect(sheet[0][1].format).toMatchObject({
      align: 'center',
      bold: true,
      backgroundColor: '#fff2cc',
    });
  });

  it('names spreadsheet columns', () => {
    expect(getColumnName(0)).toBe('A');
    expect(getColumnName(25)).toBe('Z');
    expect(getColumnName(26)).toBe('AA');
  });

  it('recalculates formulas after referenced cells change', () => {
    let sheet = createSheet(4, 4);

    sheet = updateCell(sheet, { row: 0, col: 0 }, '5');
    sheet = updateCell(sheet, { row: 1, col: 0 }, '6');
    sheet = updateCell(sheet, { row: 0, col: 1 }, '=SUM(A1:A2)');

    expect(sheet[0][1].displayValue).toBe('11');

    sheet = updateCell(sheet, { row: 0, col: 0 }, '7');

    expect(sheet[0][1].displayValue).toBe('13');
  });
});
