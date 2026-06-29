import { describe, expect, it } from 'vitest';
import { addField, addRecord, createStarterProject, updateCell } from '../src/model/database';

describe('database model', () => {
  it('creates a starter project with a table, fields, records, and layouts', () => {
    const project = createStarterProject();
    expect(project.app).toBe('ListSplatTM');
    expect(project.schema.tables[0].fields.length).toBeGreaterThan(0);
    expect(project.schema.tables[0].records.length).toBeGreaterThan(0);
    expect(project.layouts.length).toBeGreaterThan(0);
  });

  it('adds fields and records without dropping existing values', () => {
    const table = createStarterProject().schema.tables[0];
    const firstField = table.fields[0];
    const edited = updateCell(table, table.records[0].id, firstField.id, 'Test animal');
    const withField = addField(edited, 'Source');
    const withRecord = addRecord(withField);

    expect(withRecord.fields.at(-1)?.name).toBe('Source');
    expect(withRecord.records[0].values[firstField.id]).toBe('Test animal');
    expect(withRecord.records).toHaveLength(edited.records.length + 1);
  });
});
