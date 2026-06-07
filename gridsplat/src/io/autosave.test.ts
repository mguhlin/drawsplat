import { describe, expect, it } from 'vitest';

import { createSheet, updateCell } from '../grid/gridModel';
import { loadAutosave, saveAutosave } from './autosave';

function createStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe('autosave', () => {
  it('saves and reloads sheet data from browser storage', () => {
    const storage = createStorage();
    let sheet = createSheet(20, 20);

    sheet = updateCell(sheet, { row: 0, col: 0 }, 'Saved');
    saveAutosave(sheet, storage);

    expect(loadAutosave(storage)?.[0][0].displayValue).toBe('Saved');
  });
});
