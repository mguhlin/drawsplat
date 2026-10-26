import {describe, expect, it} from 'vitest';
import {listSplatTemplates, cloneTemplateProject} from '../src/templates/templates';
import {createStarterProject} from '../src/model/database';
import {relationalIssues} from '../src/model/relationships';

describe('classroom examples', () => {
  it('provides 15 distinct starters and at least 12 records in every table', () => {
    expect(listSplatTemplates).toHaveLength(15);
    expect(new Set(listSplatTemplates.map(template => template.id)).size).toBe(15);
    for (const template of listSplatTemplates) {
      expect(template.reflectionQuestions.length).toBeGreaterThanOrEqual(2);
      for (const table of [template.table, ...(template.relatedTables ?? [])]) {
        expect(table.records.length).toBeGreaterThanOrEqual(12);
        expect(new Set(table.records.map(record => JSON.stringify(record.values))).size).toBe(table.records.length);
        for (const record of table.records) expect(Object.keys(record.values).sort()).toEqual(table.fields.map(field => field.id).sort());
      }
    }
    expect(createStarterProject().schema.tables[0].records).toHaveLength(12);
  });
  it('loads linked examples with valid keys and no shared identities or mutations', () => {
    for (const template of listSplatTemplates) {
      const original = JSON.stringify(template);
      const first = cloneTemplateProject(template), second = cloneTemplateProject(template);
      const combined = createStarterProject();
      combined.schema = {tables: [...first.tables, ...second.tables], relationships: [...first.relationships, ...second.relationships]};
      expect(relationalIssues(combined)).toEqual([]);
      const ids = combined.schema.tables.flatMap(table => [table.id, ...table.fields.map(field => field.id), ...table.records.map(record => record.id)]);
      expect(new Set(ids).size).toBe(ids.length);
      first.tables[0].records[0].values[first.tables[0].fields[0].id] = 'Edited';
      expect(JSON.stringify(template)).toBe(original);
    }
    expect(listSplatTemplates.filter(template => template.relationships?.length)).toHaveLength(2);
  });
});
