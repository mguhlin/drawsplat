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
  checkbox: false,
  choice: '',
  image: '',
  link: '',
  calculation: '',
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
    options: type === 'choice' ? ['Yes', 'No'] : undefined,
  };
}

export function createRecord(fields: ListSplatField[], values: Record<string, ListSplatCellValue> = {}): ListSplatRecord {
  const now = new Date().toISOString();
  const normalizedValues = Object.fromEntries(
    fields.map((field) => [field.id, values[field.id] ?? FIELD_DEFAULTS[field.type]]),
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

export function addRecord(table: ListSplatTable): ListSplatTable {
  return {
    ...table,
    records: [...table.records, createRecord(table.fields)],
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
    records: [...table.records, createRecord(table.fields, source.values)],
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
  return {
    ...table,
    records: table.records.map((record) =>
      record.id === recordId
        ? {
            ...record,
            updatedAt: new Date().toISOString(),
            values: {
              ...record.values,
              [fieldId]: value,
            },
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

export function assertListSplatFile(value: unknown): asserts value is ListSplatFile {
  if (!value || typeof value !== 'object') {
    throw new Error('This is not a ListSplatTM project file.');
  }
  const candidate = value as Partial<ListSplatFile>;
  if (candidate.app !== 'ListSplatTM' || candidate.version !== 1 || !candidate.schema?.tables) {
    throw new Error('This file is not a supported .listsplat.json project.');
  }
}
