import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseCsv, tableFromCsv, tableToCsv } from '../src/io/csv';

describe('CSV utilities', () => {
  it('parses quoted cells and commas', () => {
    expect(parseCsv('Name,Note\nAda,"likes math, code"')).toEqual([
      ['Name', 'Note'],
      ['Ada', 'likes math, code'],
    ]);
  });

  it('detects tab and semicolon delimiters', () => {
    expect(detectDelimiter('Name\tRole\tCity')).toBe('\t');
    expect(detectDelimiter('Name;Role;City')).toBe(';');
    expect(detectDelimiter('Name,Role,City')).toBe(',');
  });

  it('parses tab and semicolon separated files', () => {
    expect(parseCsv('Name\tRole\nAda\tMathematician')).toEqual([
      ['Name', 'Role'],
      ['Ada', 'Mathematician'],
    ]);
    expect(tableFromCsv('People', 'Name;Role\nAda;Mathematician').records).toHaveLength(1);
  });

  it('round-trips a table with headers and records', () => {
    const table = tableFromCsv('People', 'Name,Role\nAda,Mathematician\nGrace,Programmer');
    expect(table.fields.map((field) => field.name)).toEqual(['Name', 'Role']);
    expect(table.records).toHaveLength(2);
    expect(tableToCsv(table)).toContain('Ada,Mathematician');
  });
});
