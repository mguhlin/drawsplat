import { describe, expect, it } from 'vitest';

import { updateCell, createSheet } from '../grid/gridModel';
import { exportCsv, importCsv } from './csv';
import { exportNativeJson, importNativeJson } from './json';
import {
  exportMarkdown,
  importMarkdown,
  markdownToMatrix,
  matrixToMarkdown,
} from './markdown';

function sampleSheet() {
  let sheet = createSheet(20, 20);

  sheet = updateCell(sheet, { row: 0, col: 0 }, 'Fruit');
  sheet = updateCell(sheet, { row: 0, col: 1 }, 'Count');
  sheet = updateCell(sheet, { row: 1, col: 0 }, 'Apples');
  sheet = updateCell(sheet, { row: 1, col: 1 }, '4');
  sheet = updateCell(sheet, { row: 2, col: 0 }, 'Total');
  sheet = updateCell(sheet, { row: 2, col: 1 }, '=SUM(B2:B2)');

  return sheet;
}

describe('import/export adapters', () => {
  it('round-trips native JSON files', () => {
    const imported = importNativeJson(exportNativeJson(sampleSheet()));

    expect(imported[1][0].displayValue).toBe('Apples');
    expect(imported[2][1].displayValue).toBe('4');
  });

  it('round-trips CSV files', () => {
    const imported = importCsv(exportCsv(sampleSheet()));

    expect(imported[0][0].displayValue).toBe('Fruit');
    expect(imported[1][1].displayValue).toBe('4');
  });

  it('round-trips Markdown tables', () => {
    const imported = importMarkdown(exportMarkdown(sampleSheet()));

    expect(imported[0][0].displayValue).toBe('Fruit');
    expect(imported[1][0].displayValue).toBe('Apples');
  });

  it('parses and serializes Markdown table text', () => {
    const matrix = markdownToMatrix(
      '| Name | Count |\n| --- | --- |\n| Pears | 5 |',
    );

    expect(matrix).toEqual([
      ['Name', 'Count'],
      ['Pears', '5'],
    ]);
    expect(matrixToMarkdown(matrix)).toContain('| Pears | 5 |');
  });

  it('rejects invalid native JSON files with a friendly reason', () => {
    expect(() => importNativeJson('{"version":99,"sheets":[]}')).toThrow(
      'version this app cannot open',
    );
  });
});
