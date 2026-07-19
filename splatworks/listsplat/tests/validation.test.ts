import { describe, expect, it } from 'vitest';
import { createStarterProject } from '../src/model/database';
import { validateCell } from '../src/model/validation';
import type { ListSplatField } from '../src/model/types';

const numberField: ListSplatField = { id: 'f1', name: 'Age', type: 'number', description: '', required: false, hidden: false, min: 0, max: 120 };

describe('validation', () => {
  it('flags out-of-range numbers and required blanks', () => {
    expect(validateCell(numberField, 40)).toBe('');
    expect(validateCell(numberField, 200)).toMatch(/at most/);
    expect(validateCell(numberField, -1)).toMatch(/at least/);
    expect(validateCell({ ...numberField, required: true }, '')).toMatch(/required/);
  });

  it('checks patterns', () => {
    const email: ListSplatField = { id: 'f2', name: 'Email', type: 'text', description: '', required: false, hidden: false, pattern: 'email' };
    expect(validateCell(email, 'a@b.com')).toBe('');
    expect(validateCell(email, 'nope')).toMatch(/valid email/);
  });

  it('detects non-unique values', () => {
    const table = createStarterProject().schema.tables[0];
    const field = { ...table.fields[0], unique: true };
    const withField = { ...table, fields: table.fields.map((f) => (f.id === field.id ? field : f)) };
    // "Axolotl" is in record 0; validating record 1 with the same value should fail
    expect(validateCell(field, 'Axolotl', withField, table.records[1].id)).toMatch(/already used/);
    expect(validateCell(field, 'Unique name', withField, table.records[1].id)).toBe('');
  });
});
