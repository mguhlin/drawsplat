import { createId } from './database';
import type { ListSplatFile, ListSplatRecord, ListSplatRelationship, ListSplatTable } from './types';

function textValue(value: unknown): string {
  return value == null ? '' : String(value).trim().toLowerCase();
}

export function createRelationship(
  name: string,
  fromTableId: string,
  fromFieldId: string,
  toTableId: string,
  toFieldId: string,
): ListSplatRelationship {
  return {
    id: createId('relationship'),
    name: name.trim() || 'New Relationship',
    fromTableId,
    fromFieldId,
    toTableId,
    toFieldId,
  };
}

export function addRelationship(project: ListSplatFile, relationship: ListSplatRelationship): ListSplatFile {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    schema: {
      ...project.schema,
      relationships: [...project.schema.relationships, relationship],
    },
  };
}

export function relatedRecords(
  relationship: ListSplatRelationship,
  sourceTable: ListSplatTable,
  sourceRecord: ListSplatRecord,
  targetTable: ListSplatTable,
): ListSplatRecord[] {
  const sourceValue = textValue(sourceRecord.values[relationship.fromFieldId]);
  if (!sourceValue || sourceTable.id !== relationship.fromTableId || targetTable.id !== relationship.toTableId) {
    return [];
  }
  return targetTable.records.filter((record) => textValue(record.values[relationship.toFieldId]) === sourceValue);
}

export function relationshipLabel(project: ListSplatFile, relationship: ListSplatRelationship): string {
  const fromTable = project.schema.tables.find((table) => table.id === relationship.fromTableId);
  const toTable = project.schema.tables.find((table) => table.id === relationship.toTableId);
  const fromField = fromTable?.fields.find((field) => field.id === relationship.fromFieldId);
  const toField = toTable?.fields.find((field) => field.id === relationship.toFieldId);
  return `${fromTable?.name ?? 'Table'}:${fromField?.name ?? 'Field'} -> ${toTable?.name ?? 'Table'}:${toField?.name ?? 'Field'}`;
}


export function keyValue(value: unknown): string {
  return value == null ? '' : String(value).trim().toLowerCase();
}

export const KEY_TYPES = ['text', 'number', 'autoNumber'];

export function relationalIssues(project: ListSplatFile): string[] {
  const issues: string[] = [];
  for (const table of project.schema.tables) {
    const keys = table.fields.filter(field => field.primaryKey);
    if (keys.length > 1) issues.push(`${table.name}: choose only one primary key.`);
    for (const field of keys) {
      if (!KEY_TYPES.includes(field.type)) issues.push(`${table.name}.${field.name}: primary keys must use text, number, or automatic number.`);
      const seen = new Set<string>();
      for (const record of table.records) {
        const value = keyValue(record.values[field.id]);
        if (!value) issues.push(`${table.name}.${field.name}: primary keys cannot be empty (record ${record.id}).`);
        else if (seen.has(value)) issues.push(`${table.name}.${field.name}: duplicate primary key “${value}”.`);
        seen.add(value);
      }
    }
  }
  const targets = new Set<string>();
  for (const relationship of project.schema.relationships.filter(item => item.enforceKeys)) {
    const parent = project.schema.tables.find(table => table.id === relationship.fromTableId);
    const child = project.schema.tables.find(table => table.id === relationship.toTableId);
    const pk = parent?.fields.find(field => field.id === relationship.fromFieldId);
    const fk = child?.fields.find(field => field.id === relationship.toFieldId);
    if (!parent || !child || !pk || !fk) { issues.push(`${relationship.name}: a linked table or field is missing.`); continue; }
    if (!pk.primaryKey) issues.push(`${relationship.name}: the parent field must be a primary key.`);
    if (parent.id === child.id) issues.push(`${relationship.name}: choose two different tables.`);
    if (!KEY_TYPES.includes(fk.type) || fk.type === 'autoNumber' || (pk.type === 'text') !== (fk.type === 'text')) issues.push(`${relationship.name}: key types must match; use text with text, or number with number/automatic number.`);
    const target = `${child.id}:${fk.id}`;
    if (targets.has(target)) issues.push(`${relationship.name}: this foreign key already has a parent.`);
    targets.add(target);
    const values = new Set(parent.records.map(record => keyValue(record.values[pk.id])).filter(Boolean));
    const seen = new Set<string>();
    for (const record of child.records) {
      const value = keyValue(record.values[fk.id]);
      if (!value) { if (fk.required || fk.primaryKey) issues.push(`${relationship.name}: a parent record is required (record ${record.id}).`); continue; }
      if (!values.has(value)) issues.push(`${relationship.name}: foreign key “${value}” has no parent record.`);
      if ((relationship.cardinality === 'one-to-one' || fk.primaryKey) && seen.has(value)) issues.push(`${relationship.name}: one-to-one keys cannot repeat “${value}”.`);
      seen.add(value);
    }
  }
  return issues;
}

// Existing imported problems remain visible and repairable; new violations are rejected.
export function newRelationalIssue(before: ListSplatFile, after: ListSplatFile): string {
  const existing = new Set(relationalIssues(before));
  return relationalIssues(after).find(issue => !existing.has(issue)) ?? '';
}
