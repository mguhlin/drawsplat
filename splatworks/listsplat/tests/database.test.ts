import { describe, expect, it } from 'vitest';
import { addField, addRecord, assertListSplatFile, createStarterProject, duplicateRecord, duplicateRecordIds, removeDuplicateRecords, unusedFields, updateCell } from '../src/model/database';
import { cloneTemplateProject, listSplatTemplates } from '../src/templates/templates';

describe('project file integrity', () => {
  it('accepts every classroom template without changing its saved data', () => {
    for (const template of listSplatTemplates) {
      const project = createStarterProject(), cloned = cloneTemplateProject(template);
      project.schema = { tables: cloned.tables, relationships: cloned.relationships };
      const before = JSON.stringify(project);
      expect(() => assertListSplatFile(project)).not.toThrow();
      expect(JSON.stringify(project)).toBe(before);
    }
  });

  it('retains optional annotations, saved views and unknown version-1 data', () => {
    const project = createStarterProject(), table = project.schema.tables[0], record = table.records[0];
    record.comments = [{ id: 'comment', author: 'Teacher', text: 'Review', at: record.createdAt }];
    record.history = [{ at: record.createdAt, values: { ...record.values } }];
    project.views = [{ id: 'view', name: 'Animals', tableId: table.id, mode: 'cards', search: '', searchFieldId: 'all', sortKeys: [], find: null }];
    const saved = { ...project, futureExtension: { keep: 'original content' } };
    const before = JSON.stringify(saved);
    assertListSplatFile(saved);
    expect(JSON.stringify(saved)).toBe(before);
    // Missing references are repairable, distinct from malformed structures.
    project.schema.relationships = [{ id: 'repair', name: 'Missing table', fromTableId: 'missing', toTableId: table.id, fromFieldId: 'missing', toFieldId: table.fields[0].id }];
    expect(() => assertListSplatFile(project)).not.toThrow();
  });

  it.each(['metadata', 'field-type', 'options', 'values', 'comments', 'history', 'duplicate-id', 'views', 'teacher'])('rejects damaged %s before the project is used', damage => {
    const project: any = createStarterProject(), table = project.schema.tables[0];
    if (damage === 'metadata') project.metadata = null;
    if (damage === 'field-type') table.fields[0].type = 'unsupported';
    if (damage === 'options') table.fields[0].options = {};
    if (damage === 'values') table.records[0].values = { nested: {} };
    if (damage === 'comments') table.records[0].comments = [null];
    if (damage === 'history') table.records[0].history = [{ at: '', values: [] }];
    if (damage === 'duplicate-id') table.records[1].id = table.records[0].id;
    if (damage === 'views') project.views = [{}];
    if (damage === 'teacher') project.teacher.notes = {};
    expect(() => assertListSplatFile(project)).toThrow(/ListSplat project/);
  });
});

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
