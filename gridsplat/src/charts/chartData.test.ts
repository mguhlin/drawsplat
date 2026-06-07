import { describe, expect, it } from 'vitest';

import { createSheet, updateCell } from '../grid/gridModel';
import { buildChartData, buildFirstDataRangeChart } from './chartData';

describe('chart data helpers', () => {
  it('builds label/value chart points from a selected two-column range', () => {
    let sheet = createSheet(20, 20);

    sheet = updateCell(sheet, { row: 0, col: 0 }, 'Apples');
    sheet = updateCell(sheet, { row: 0, col: 1 }, '4');
    sheet = updateCell(sheet, { row: 1, col: 0 }, 'Bananas');
    sheet = updateCell(sheet, { row: 1, col: 1 }, '6');

    const chart = buildChartData(
      sheet,
      {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 },
      },
      'bar',
      'Fruit Count',
    );

    expect(chart.points).toEqual([
      { label: 'Apples', value: 4 },
      { label: 'Bananas', value: 6 },
    ]);
    expect(chart.title).toBe('Fruit Count');
  });

  it('ignores rows without numeric values', () => {
    let sheet = createSheet(20, 20);

    sheet = updateCell(sheet, { row: 0, col: 0 }, 'Name');
    sheet = updateCell(sheet, { row: 0, col: 1 }, 'Count');

    const chart = buildChartData(
      sheet,
      {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 1 },
      },
      'bar',
    );

    expect(chart.points).toHaveLength(0);
  });

  it('can infer the first label/value data range after a header row', () => {
    let sheet = createSheet(20, 20);

    sheet = updateCell(sheet, { row: 0, col: 0 }, 'Fruit');
    sheet = updateCell(sheet, { row: 0, col: 1 }, 'Count');
    sheet = updateCell(sheet, { row: 1, col: 0 }, 'Apples');
    sheet = updateCell(sheet, { row: 1, col: 1 }, '4');

    expect(buildFirstDataRangeChart(sheet, 'bar').points).toEqual([
      { label: 'Apples', value: 4 },
    ]);
  });
});
