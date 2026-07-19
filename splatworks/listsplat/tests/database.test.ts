import { describe, expect, it } from 'vitest';
import { addField, addRecord, createStarterProject, duplicateRecord, duplicateRecordIds, removeDuplicateRecords, unusedFields, updateCell } from '../src/model/database';

describe('maintenance helpers', () => {
  it('finds and removes duplicate records', () => {
    const table = createStarterProject().schema.tables[0];
    const withDupe = duplicateRecord(table, table.records[0].id);
    expect(duplicateRecordIds(withDupe).length).toBe(1);
    expect(removeDuplicateRecords(withDupe).records.length).toBe(table.records.length);
  });

  it('finds always-empty fields', () => {
    let table = createStarterProject().schema.tables[0];
    table = addField(table, 'Never used', 'text');
    expect(unusedFields(table).some((field) => field.name === 'Never used')).toBe(true);
  });
});

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

  it('supports timestamp and choice field metadata', () => {
    const table = createStarterProject().schema.tables[0];
    const withChoice = addField(table, 'Status', 'choice');
    const withUpdatedAt = addField(withChoice, 'Updated', 'updatedAt');
    const statusField = withUpdatedAt.fields.find((field) => field.name === 'Status');
    const updatedField = withUpdatedAt.fields.find((field) => field.name === 'Updated');

    expect(statusField?.options).toEqual(['Yes', 'No']);
    expect(updatedField?.type).toBe('updatedAt');

    const edited = updateCell(withUpdatedAt, withUpdatedAt.records[0].id, statusField!.id, 'Yes');
    expect(edited.records[0].values[statusField!.id]).toBe('Yes');
    expect(String(edited.records[0].values[updatedField!.id])).toContain('T');
  });
});
