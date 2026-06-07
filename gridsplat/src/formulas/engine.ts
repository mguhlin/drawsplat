import { HyperFormula } from 'hyperformula';

import type { SheetData } from '../grid/types';

export interface FriendlyFunction {
  name: string;
  description: string;
}

export const friendlyFunctions: FriendlyFunction[] = [
  {
    name: 'SUM',
    description: 'Adds numbers together.',
  },
  {
    name: 'AVERAGE',
    description: 'Finds the middle or typical value.',
  },
  {
    name: 'MIN',
    description: 'Finds the smallest number.',
  },
  {
    name: 'MAX',
    description: 'Finds the biggest number.',
  },
  {
    name: 'COUNT',
    description: 'Counts how many number cells there are.',
  },
  {
    name: 'ROUND',
    description: 'Rounds a number to fewer decimal places.',
  },
  {
    name: 'IF',
    description:
      'Chooses one answer when something is true and another when it is false.',
  },
];

const friendlyErrorMessages: Record<string, string> = {
  CYCLE: 'This formula points back to itself. Try using a different cell.',
  DIV_BY_ZERO: "You can't divide by zero. Check your numbers.",
  LIC: 'This formula needs a feature GridSplat™ cannot use yet.',
  NAME: "GridSplat™ doesn't know that formula name yet.",
  NA: 'A value this formula needs is not available.',
  NUM: 'This formula made a number that is too large or too small.',
  REF: 'This formula points to a cell that does not exist.',
  VALUE: 'This formula needs a different kind of value.',
};

interface DetailedErrorLike {
  type?: string;
  value?: string;
}

function isDetailedError(value: unknown): value is DetailedErrorLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('type' in value || 'value' in value)
  );
}

export function getFriendlyErrorMessage(errorType: string): string {
  return (
    friendlyErrorMessages[errorType] ??
    'This formula needs a quick check before it can work.'
  );
}

function toEngineValue(rawValue: string): string | number | null {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith('=')) {
    return rawValue;
  }

  const numberValue = Number(trimmedValue);

  if (!Number.isNaN(numberValue) && Number.isFinite(numberValue)) {
    return numberValue;
  }

  return rawValue;
}

export function recalculateSheet(sheet: SheetData): SheetData {
  const engineData = sheet.map((row) =>
    row.map((cell) => toEngineValue(cell.rawValue)),
  );
  const engine = HyperFormula.buildFromArray(engineData, {
    licenseKey: 'gpl-v3',
  });

  return sheet.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (cell.type !== 'formula') {
        return cell;
      }

      const computedValue = engine.getCellValue({
        sheet: 0,
        row: rowIndex,
        col: colIndex,
      });

      if (isDetailedError(computedValue)) {
        return {
          ...cell,
          displayValue: computedValue.type
            ? getFriendlyErrorMessage(computedValue.type)
            : 'This formula needs a quick check before it can work.',
          errorType: computedValue.type,
        };
      }

      return {
        ...cell,
        displayValue: computedValue === null ? '' : String(computedValue),
        errorType: undefined,
      };
    }),
  );
}
