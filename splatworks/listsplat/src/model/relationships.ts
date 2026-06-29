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
