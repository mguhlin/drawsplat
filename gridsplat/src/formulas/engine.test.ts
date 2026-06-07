import { describe, expect, it } from 'vitest';

import { createCell } from '../grid/gridModel';
import {
  friendlyFunctions,
  getFriendlyErrorMessage,
  recalculateSheet,
} from './engine';

describe('formula engine adapter', () => {
  it('exposes a curated child-friendly function list', () => {
    expect(friendlyFunctions.map((item) => item.name)).toEqual([
      'SUM',
      'AVERAGE',
      'MIN',
      'MAX',
      'COUNT',
      'ROUND',
      'IF',
    ]);
  });

  it('maps formula errors to friendly messages', () => {
    expect(getFriendlyErrorMessage('DIV_BY_ZERO')).toBe(
      "You can't divide by zero. Check your numbers.",
    );
    expect(getFriendlyErrorMessage('UNKNOWN')).toBe(
      'This formula needs a quick check before it can work.',
    );
  });

  it('calculates curated formulas and updates display values', () => {
    const sheet = recalculateSheet([
      [createCell('4'), createCell('8'), createCell('=SUM(A1:B1)')],
      [createCell('2'), createCell('6'), createCell('=AVERAGE(A2:B2)')],
      [
        createCell(''),
        createCell(''),
        createCell('=IF(A1>B1, "big", "small")'),
      ],
    ]);

    expect(sheet[0][2].displayValue).toBe('12');
    expect(sheet[1][2].displayValue).toBe('4');
    expect(sheet[2][2].displayValue).toBe('small');
  });

  it('uses friendly display text for formula errors', () => {
    const sheet = recalculateSheet([[createCell('=1/0')]]);

    expect(sheet[0][0].errorType).toBe('DIV_BY_ZERO');
    expect(sheet[0][0].displayValue).toBe(
      "You can't divide by zero. Check your numbers.",
    );
  });
});
