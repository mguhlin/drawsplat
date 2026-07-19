import type {
  FieldType,
  ListSplatCellValue,
  ListSplatField,
  ListSplatFile,
  ListSplatRecord,
  ListSplatTable,
} from './types';

const FIELD_DEFAULTS: Record<FieldType, ListSplatCellValue> = {
  text: '',
  longText: '',
  number: 0,
  currency: 0,
  percent: 0,
  date: '',
  time: '',
  dateTime: '',
  checkbox: false,
  rating: 0,
  choice: '',
  multiSelect: '',
  email: '',
  phone: '',
  image: '',
  file: '',
  audio: '',
  link: '',
  calculation: '',
  autoNumber: '',
  createdAt: '',
  updatedAt: '',
};

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createField(name: string, type: FieldType = 'text'): ListSplatField {
  return {
    id: createId('field'),
    name,
    type,
    description: '',
    required: false,
    hidden: false,
    options: type === 'choice' || type === 'multiSelect' ? ['Yes', 'No'] : undefined,
  };
}

export function createRecord(fields: ListSplatField[], values: Record<string, ListSplatCellValue> = {}): ListSplatRecord {
  const now = new Date().toISOString();
  const normalizedValues = Object.fromEntries(
    fields.map((field, index) => {
      if (field.type === 'createdAt' || field.type === 'updatedAt') {
        return [field.id, values[field.id] ?? now];
      }
      if (field.type === 'autoNumber') {
        return [field.id, values[field.id] ?? index + 1];
      }
      if (values[field.id] === undefined && field.defaultValue != null && field.defaultValue !== '') {
        return [field.id, convertValueForType(field.defaultValue, field.type, field.options).value];
      }
      return [field.id, values[field.id] ?? FIELD_DEFAULTS[field.type]];
    }),
  );

  return {
    id: createId('record'),
    createdAt: now,
    updatedAt: now,
    values: normalizedValues,
  };
}

export function createTable(name: string, fieldNames: string[]): ListSplatTable {
  const fields = fieldNames.map((fieldName) => createField(fieldName));
  return {
    id: createId('table'),
    name,
    fields,
    records: [createRecord(fields)],
  };
}

export function createStarterProject(title = 'Animal Research Database'): ListSplatFile {
  const now = new Date().toISOString();
  const table = createTable('Animals', ['Animal', 'Habitat', 'Diet', 'Interesting Fact']);
  table.records = [
    createRecord(table.fields, {
      [table.fields[0].id]: 'Axolotl',
      [table.fields[1].id]: 'Freshwater lakes',
      [table.fields[2].id]: 'Worms and insects',
      [table.fields[3].id]: 'It can regrow some body parts.',
    }),
    createRecord(table.fields, {
      [table.fields[0].id]: 'Red panda',
      [table.fields[1].id]: 'Mountain forests',
      [table.fields[2].id]: 'Bamboo and fruit',
      [table.fields[3].id]: 'It uses its tail like a blanket.',
    }),
  ];

  return {
    app: 'ListSplatTM',
    version: 1,
    createdAt: now,
    updatedAt: now,
    metadata: {
      title,
      author: '',
      className: '',
    },
    schema: {
      tables: [table],
      relationships: [],
    },
    layouts: [
      {
        id: createId('layout'),
        name: 'Table View',
        tableId: table.id,
        mode: 'table',
        locked: false,
      },
      {
        id: createId('layout'),
        name: 'Record Form',
        tableId: table.id,
        mode: 'form',
        locked: false,
      },
      {
        id: createId('layout'),
        name: 'Research Cards',
        tableId: table.id,
        mode: 'cards',
        locked: false,
      },
    ],
    teacher: {
      studentView: false,
      notes: ['Ask students to add source notes before printing a report.'],
      rubric: [],
    },
  };
}

export function addField(table: ListSplatTable, name: string, type: FieldType = 'text'): ListSplatTable {
  const field = createField(name.trim() || 'New Field', type);
  return {
    ...table,
    fields: [...table.fields, field],
    records: table.records.map((record) => ({
      ...record,
      updatedAt: new Date().toISOString(),
      values: {
        ...record.values,
        [field.id]: FIELD_DEFAULTS[type],
      },
    })),
  };
}

export function nextAutoNumber(table: ListSplatTable, fieldId: string): number {
  const max = table.records.reduce((highest, record) => {
    const value = Number(record.values[fieldId]);
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return max + 1;
}

function autoNumberValues(table: ListSplatTable): Record<string, ListSplatCellValue> {
  const values: Record<string, ListSplatCellValue> = {};
  table.fields
    .filter((field) => field.type === 'autoNumber')
    .forEach((field) => {
      values[field.id] = nextAutoNumber(table, field.id);
    });
  return values;
}

export function addRecord(table: ListSplatTable): ListSplatTable {
  return {
    ...table,
    records: [...table.records, createRecord(table.fields, autoNumberValues(table))],
  };
}

// Convert a single value to a new field type, reporting whether the change lost
// information (so a type change can be previewed before it is applied).
export function convertValueForType(
  value: ListSplatCellValue,
  toType: FieldType,
  options?: string[],
): { value: ListSplatCellValue; lost: boolean } {
  const text = value == null ? '' : String(value);
  if (text.trim() === '') {
    return { value: FIELD_DEFAULTS[toType], lost: false };
  }
  switch (toType) {
    case 'number':
    case 'currency':
    case 'percent':
    case 'rating': {
      const parsed = Number(text.replace(/[$,%\s]/g, ''));
      if (Number.isFinite(parsed)) {
        const clamped = toType === 'rating' ? Math.max(0, Math.min(5, Math.round(parsed))) : parsed;
        return { value: clamped, lost: false };
      }
      return { value: FIELD_DEFAULTS[toType], lost: true };
    }
    case 'checkbox': {
      const lower = text.trim().toLowerCase();
      if (['true', 'yes', '1', 'y', 'checked'].includes(lower)) return { value: true, lost: false };
      if (['false', 'no', '0', 'n'].includes(lower)) return { value: false, lost: false };
      return { value: false, lost: true };
    }
    case 'choice': {
      const match = options?.find((option) => option.toLowerCase() === text.trim().toLowerCase());
      if (match) return { value: match, lost: false };
      return { value: '', lost: Boolean(options && options.length) };
    }
    case 'date': {
      const date = new Date(text);
      if (!Number.isNaN(date.getTime())) return { value: date.toISOString().slice(0, 10), lost: false };
      return { value: '', lost: true };
    }
    case 'text':
    case 'longText':
    case 'link':
      return { value: text, lost: false };
    default:
      return { value: text, lost: false };
  }
}

export function convertFieldValues(table: ListSplatTable, fieldId: string, toType: FieldType, options?: string[]): ListSplatTable {
  return {
    ...table,
    records: table.records.map((record) => ({
      ...record,
      values: { ...record.values, [fieldId]: convertValueForType(record.values[fieldId], toType, options).value },
    })),
  };
}

export function updateField(table: ListSplatTable, fieldId: string, updates: Partial<ListSplatField>): ListSplatTable {
  return {
    ...table,
    fields: table.fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)),
  };
}

export function duplicateRecord(table: ListSplatTable, recordId: string): ListSplatTable {
  const source = table.records.find((record) => record.id === recordId);
  if (!source) {
    return table;
  }
  return {
    ...table,
    records: [...table.records, createRecord(table.fields, { ...source.values, ...autoNumberValues(table) })],
  };
}

export function deleteRecord(table: ListSplatTable, recordId: string): ListSplatTable {
  if (table.records.length <= 1) {
    return table;
  }
  return {
    ...table,
    records: table.records.filter((record) => record.id !== recordId),
  };
}

export function updateCell(
  table: ListSplatTable,
  recordId: string,
  fieldId: string,
  value: ListSplatCellValue,
): ListSplatTable {
  const now = new Date().toISOString();
  return {
    ...table,
    records: table.records.map((record) =>
      record.id === recordId
        ? {
            ...record,
            updatedAt: now,
            values: Object.fromEntries(
              table.fields.map((field) => {
                if (field.id === fieldId) {
                  return [field.id, value];
                }
                if (field.type === 'updatedAt') {
                  return [field.id, now];
                }
                return [field.id, record.values[field.id]];
              }),
            ),
          }
        : record,
    ),
  };
}

export function replaceTable(project: ListSplatFile, table: ListSplatTable): ListSplatFile {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    schema: {
      ...project.schema,
      tables: project.schema.tables.map((current) => (current.id === table.id ? table : current)),
    },
  };
}

export function addTable(project: ListSplatFile, name: string): ListSplatFile {
  const table = createTable(name.trim() || 'New Table', ['Name', 'Notes']);
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    schema: {
      ...project.schema,
      tables: [...project.schema.tables, table],
    },
    layouts: [
      ...project.layouts,
      {
        id: createId('layout'),
        name: `${table.name} Table`,
        tableId: table.id,
        mode: 'table',
        locked: false,
      },
      {
        id: createId('layout'),
        name: `${table.name} Form`,
        tableId: table.id,
        mode: 'form',
        locked: false,
      },
    ],
  };
}

export function renameTable(project: ListSplatFile, tableId: string, name: string): ListSplatFile {
  const clean = name.trim() || 'Table';
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    schema: {
      ...project.schema,
      tables: project.schema.tables.map((table) => (table.id === tableId ? { ...table, name: clean } : table)),
    },
  };
}

export function duplicateTable(project: ListSplatFile, tableId: string): { project: ListSplatFile; newTableId: string } {
  const source = project.schema.tables.find((table) => table.id === tableId);
  if (!source) {
    return { project, newTableId: tableId };
  }
  // Remap field ids so the copy is independent, then rewrite record values to match.
  const fieldMap = new Map(source.fields.map((field) => [field.id, createId('field')]));
  const fields = source.fields.map((field) => ({ ...field, id: fieldMap.get(field.id)! }));
  const records = source.records.map((record) => ({
    id: createId('record'),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    values: Object.fromEntries(Object.entries(record.values).map(([key, value]) => [fieldMap.get(key) ?? key, value])),
  }));
  const newTable: ListSplatTable = { id: createId('table'), name: `${source.name} copy`, fields, records };
  const index = project.schema.tables.findIndex((table) => table.id === tableId);
  const tables = [...project.schema.tables];
  tables.splice(index + 1, 0, newTable);
  return {
    project: {
      ...project,
      updatedAt: new Date().toISOString(),
      schema: { ...project.schema, tables },
      layouts: [
        ...project.layouts,
        { id: createId('layout'), name: `${newTable.name} Table`, tableId: newTable.id, mode: 'table', locked: false },
        { id: createId('layout'), name: `${newTable.name} Form`, tableId: newTable.id, mode: 'form', locked: false },
      ],
    },
    newTableId: newTable.id,
  };
}

export function moveTable(project: ListSplatFile, tableId: string, delta: number): ListSplatFile {
  const tables = [...project.schema.tables];
  const index = tables.findIndex((table) => table.id === tableId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= tables.length) {
    return project;
  }
  [tables[index], tables[target]] = [tables[target], tables[index]];
  return { ...project, updatedAt: new Date().toISOString(), schema: { ...project.schema, tables } };
}

export function deleteTable(project: ListSplatFile, tableId: string): ListSplatFile {
  if (project.schema.tables.length <= 1) {
    return project;
  }
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    schema: {
      ...project.schema,
      tables: project.schema.tables.filter((table) => table.id !== tableId),
      relationships: project.schema.relationships.filter(
        (relationship) => relationship.fromTableId !== tableId && relationship.toTableId !== tableId,
      ),
    },
    layouts: project.layouts.filter((layout) => layout.tableId !== tableId),
    views: (project.views ?? []).filter((view) => view.tableId !== tableId),
  };
}

// Structure-only copy: same schema, no records.
export function structureOnlyProject(project: ListSplatFile): ListSplatFile {
  const now = new Date().toISOString();
  return {
    ...project,
    createdAt: now,
    updatedAt: now,
    metadata: { ...project.metadata, title: `${project.metadata.title} (template)` },
    schema: {
      ...project.schema,
      tables: project.schema.tables.map((table) => ({ ...table, records: [createRecord(table.fields)] })),
    },
    views: [],
  };
}

function recordSignature(table: ListSplatTable, record: ListSplatRecord): string {
  return table.fields
    .filter((field) => !['autoNumber', 'createdAt', 'updatedAt', 'calculation'].includes(field.type))
    .map((field) => String(record.values[field.id] ?? '').trim().toLowerCase())
    .join('');
}

// Records that are exact duplicates of an earlier record (all editable fields equal).
export function duplicateRecordIds(table: ListSplatTable): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  table.records.forEach((record) => {
    const signature = recordSignature(table, record);
    if (seen.has(signature)) duplicates.push(record.id);
    else seen.add(signature);
  });
  return duplicates;
}

export function removeDuplicateRecords(table: ListSplatTable): ListSplatTable {
  const drop = new Set(duplicateRecordIds(table));
  if (!drop.size) return table;
  const kept = table.records.filter((record) => !drop.has(record.id));
  return { ...table, records: kept.length ? kept : [table.records[0]] };
}

// Fields that are empty in every record (candidates for removal).
export function unusedFields(table: ListSplatTable): ListSplatField[] {
  return table.fields.filter(
    (field) =>
      !['autoNumber', 'createdAt', 'updatedAt', 'calculation'].includes(field.type) &&
      table.records.every((record) => String(record.values[field.id] ?? '').trim() === ''),
  );
}

export function brokenRelationships(project: ListSplatFile): ListSplatFile['schema']['relationships'] {
  return project.schema.relationships.filter((relationship) => {
    const fromTable = project.schema.tables.find((table) => table.id === relationship.fromTableId);
    const toTable = project.schema.tables.find((table) => table.id === relationship.toTableId);
    const fromOk = fromTable?.fields.some((field) => field.id === relationship.fromFieldId);
    const toOk = toTable?.fields.some((field) => field.id === relationship.toFieldId);
    return !fromOk || !toOk;
  });
}

export function removeBrokenRelationships(project: ListSplatFile): ListSplatFile {
  const broken = new Set(brokenRelationships(project).map((relationship) => relationship.id));
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    schema: { ...project.schema, relationships: project.schema.relationships.filter((relationship) => !broken.has(relationship.id)) },
  };
}

export function assertListSplatFile(value: unknown): asserts value is ListSplatFile {
  if (!value || typeof value !== 'object') {
    throw new Error('This is not a ListSplatTM project file.');
  }
  const candidate = value as Partial<ListSplatFile>;
  if (candidate.app !== 'ListSplatTM' || candidate.version !== 1 || !candidate.schema?.tables) {
    throw new Error('This file is not a supported .listsplat.json project.');
  }
}
