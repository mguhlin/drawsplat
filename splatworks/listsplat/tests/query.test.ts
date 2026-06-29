import { describe, expect, it } from 'vitest';
import { createStarterProject, updateCell } from '../src/model/database';
import { summarizeTable } from '../src/model/formulas';
import { findDuplicateRecords, findMissingRecords, findRecords, replaceValues, sortRecords } from '../src/model/query';

describe('query tools', () => {
  it('finds records across all fields and within one field', () => {
    const table = createStarterProject().schema.tables[0];
    expect(findRecords(table, { query: 'forest', fieldId: 'all' })).toHaveLength(1);
    expect(findRecords(table, { query: 'forest', fieldId: table.fields[0].id })).toHaveLength(0);
  });

  it('sorts text fields', () => {
    const table = createStarterProject().schema.tables[0];
    const sorted = sortRecords(table, table.fields[0].id, 'desc');
    expect(sorted.records[0].values[table.fields[0].id]).toBe('Red panda');
  });

  it('finds missing and duplicate values', () => {
    const project = createStarterProject();
    const table = project.schema.tables[0];
    const animalField = table.fields[0];
    const blanked = updateCell(table, table.records[0].id, animalField.id, '');
    const duplicated = updateCell(blanked, blanked.records[1].id, animalField.id, '');
    expect(findMissingRecords(duplicated, animalField.id)).toHaveLength(2);
    expect(findDuplicateRecords(duplicated, animalField.id)).toHaveLength(0);
  });

  it('replaces values in selected fields', () => {
    const table = createStarterProject().schema.tables[0];
    const result = replaceValues(table, {
      fieldIds: [table.fields[1].id],
      find: 'lakes',
      replacement: 'ponds',
    });
    expect(result.count).toBe(1);
    expect(result.table.records[0].values[table.fields[1].id]).toBe('Freshwater ponds');
  });
});

describe('summaries', () => {
  it('summarizes numeric fields', () => {
    const table = createStarterProject().schema.tables[0];
    const numberField = { ...table.fields[0], type: 'number' as const };
    const numericTable = {
      ...table,
      fields: [numberField, ...table.fields.slice(1)],
      records: table.records.map((record, index) => ({
        ...record,
        values: { ...record.values, [numberField.id]: index + 2 },
      })),
    };
    const [summary] = summarizeTable(numericTable);
    expect(summary.sum).toBe(5);
    expect(summary.average).toBe(2.5);
  });
});
