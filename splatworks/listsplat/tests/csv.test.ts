import { describe, expect, it } from 'vitest';
import { parseCsv, tableFromCsv, tableToCsv } from '../src/io/csv';

describe('CSV utilities', () => {
  it('parses quoted cells and commas', () => {
    expect(parseCsv('Name,Note\nAda,"likes math, code"')).toEqual([
      ['Name', 'Note'],
      ['Ada', 'likes math, code'],
    ]);
  });

  it('round-trips a table with headers and records', () => {
    const table = tableFromCsv('People', 'Name,Role\nAda,Mathematician\nGrace,Programmer');
    expect(table.fields.map((field) => field.name)).toEqual(['Name', 'Role']);
    expect(table.records).toHaveLength(2);
    expect(tableToCsv(table)).toContain('Ada,Mathematician');
  });
});
