import { describe, expect, it } from 'vitest';
import { convertValueForType, createStarterProject, nextAutoNumber, updateCell } from '../src/model/database';
import { summarizeTable } from '../src/model/formulas';
import { filterAdvanced, findDuplicateRecords, findMissingRecords, findRecords, previewReplaceValues, replaceValues, sortRecords, sortRecordsByKeys } from '../src/model/query';

describe('query tools', () => {
  it('finds records across all fields and within one field', () => {
    const table = createStarterProject().schema.tables[0];
    expect(findRecords(table, { query: 'forest', fieldId: 'all' })).toHaveLength(1);
    expect(findRecords(table, { query: 'forest', fieldId: table.fields[0].id })).toHaveLength(0);
  });

  it('sorts by multiple keys with empty cells last', () => {
    const table = createStarterProject().schema.tables[0];
    const habitat = table.fields[1].id;
    const animal = table.fields[0].id;
    const sorted = sortRecordsByKeys(table.records, [
      { fieldId: habitat, direction: 'asc' },
      { fieldId: animal, direction: 'asc' },
    ]);
    expect(sorted[0].values[habitat]).toBe('Freshwater lakes');
  });

  it('filters with advanced find using all/any', () => {
    const table = createStarterProject().schema.tables[0];
    const diet = table.fields[2].id;
    const all = filterAdvanced(table.records, { match: 'all', rules: [{ fieldId: diet, operator: 'contains', value: 'bamboo' }] });
    expect(all).toHaveLength(1);
    const any = filterAdvanced(table.records, {
      match: 'any',
      rules: [
        { fieldId: diet, operator: 'contains', value: 'bamboo' },
        { fieldId: diet, operator: 'contains', value: 'worms' },
      ],
    });
    expect(any).toHaveLength(2);
    const empty = filterAdvanced(table.records, { match: 'all', rules: [{ fieldId: diet, operator: 'isEmpty', value: '' }] });
    expect(empty).toHaveLength(0);
  });

  it('converts values to a new type and increments auto numbers', () => {
    expect(convertValueForType('12', 'number').value).toBe(12);
    expect(convertValueForType('$1,200', 'currency').value).toBe(1200);
    expect(convertValueForType('yes', 'checkbox').value).toBe(true);
    expect(convertValueForType('banana', 'number').lost).toBe(true);
    const table = createStarterProject().schema.tables[0];
    const auto = { ...table, fields: [...table.fields], records: table.records };
    // no auto-number field in starter, so nextAutoNumber falls back to 1
    expect(nextAutoNumber(auto, 'missing')).toBe(1);
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

  it('previews replace changes without changing the table', () => {
    const table = createStarterProject().schema.tables[0];
    const preview = previewReplaceValues(table, {
      fieldIds: [table.fields[1].id],
      find: 'lakes',
      replacement: 'ponds',
    });
    expect(preview).toHaveLength(1);
    expect(preview[0].before).toBe('Freshwater lakes');
    expect(table.records[0].values[table.fields[1].id]).toBe('Freshwater lakes');
  });

  it('supports whole-word replace', () => {
    const table = createStarterProject().schema.tables[0];
    const habitatField = table.fields[1];
    const edited = updateCell(table, table.records[0].id, habitatField.id, 'lake lakes laketown');
    const result = replaceValues(edited, {
      fieldIds: [habitatField.id],
      find: 'lake',
      replacement: 'pond',
      wholeWord: true,
    });
    expect(result.table.records[0].values[habitatField.id]).toBe('pond lakes laketown');
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
