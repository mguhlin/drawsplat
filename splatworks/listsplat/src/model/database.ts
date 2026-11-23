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
      if (field.primaryKey && values[field.id] === undefined && field.type === 'text') return [field.id, createId('key')];
      if (field.type === 'createdAt' || field.type === 'updatedAt') {
        return [field.id, values[field.id] ?? now];
      }
      if ((field.type === 'autoNumber' || (field.primaryKey && field.type === 'number'))) {
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
  const animals = [
    ['Axolotl', 'Freshwater lakes', 'Worms and insects', 'Has feathery external gills'],
    ['Red panda', 'Mountain forests', 'Bamboo and fruit', 'Uses a long tail for balance'],
    ['River otter', 'Rivers and wetlands', 'Fish and invertebrates', 'Moves easily between water and land'],
    ['Barn owl', 'Grasslands and farmland', 'Small animals', 'Has a heart-shaped face'],
    ['Monarch butterfly', 'Meadows and gardens', 'Nectar', 'Begins life as a caterpillar'],
    ['Green sea turtle', 'Coastal ocean', 'Seagrass and algae', 'Breathes air at the surface'],
    ['Honeybee', 'Meadows and gardens', 'Nectar and pollen', 'Visits flowers while gathering food'],
    ['Beaver', 'Rivers and ponds', 'Bark and aquatic plants', 'Builds with branches'],
    ['Giraffe', 'Savanna', 'Leaves', 'Has a long neck'],
    ['Bottlenose dolphin', 'Coastal ocean', 'Fish and squid', 'Breathes through a blowhole'],
    ['Tree frog', 'Forests and wetlands', 'Insects', 'Can rest on leaves and branches'],
    ['Desert tortoise', 'Desert', 'Grasses and wildflowers', 'Shelters in burrows'],
  ];
  table.records = animals.map(values => createRecord(table.fields, Object.fromEntries(table.fields.map((field, index) => [field.id, values[index]]))));

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
    .filter((field) => (field.type === 'autoNumber' || (field.primaryKey && field.type === 'number')))
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
    records: [...table.records, createRecord(table.fields, { ...source.values, ...Object.fromEntries(table.fields.filter(field => field.primaryKey && field.type === 'text').map(field => [field.id, createId('key')])), ...autoNumberValues(table) })],
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
  // Validate the entire candidate before it can replace the workspace or its
  // autosave. Unknown properties are retained for version-1 compatibility.
  function check(condition: unknown, section: string): asserts condition {
    if (!condition) throw new Error(`This ListSplat project has invalid ${section}. Your open work has not changed.`);
  }
  function object(input: unknown, section: string): Record<string, unknown> {
    check(input && typeof input === 'object' && !Array.isArray(input), section);
    return input as Record<string, unknown>;
  }
  function strings(input: unknown): input is string[] {
    return Array.isArray(input) && input.every(item => typeof item === 'string');
  }
  function entries(input: unknown, section: string): Record<string, unknown>[] {
    check(Array.isArray(input), section);
    return input.map(item => object(item, section));
  }
  function identified(input: unknown, section: string): Record<string, unknown>[] {
    const items = entries(input, section), ids = new Set<string>();
    for (const item of items) {
      check(typeof item.id === 'string' && item.id.trim() && !ids.has(item.id), `${section} identifiers`);
      ids.add(item.id);
    }
    return items;
  }
  function properties(input: Record<string, unknown>, names: string[], type: 'string' | 'boolean' | 'number', section: string): void {
    for (const key of names) if (input[key] !== undefined) {
      check(typeof input[key] === type && (type !== 'number' || Number.isFinite(input[key])), section);
    }
  }
  function values(input: unknown): void {
    const cells = object(input, 'record values');
    check(Object.values(cells).every(cell => cell === null || typeof cell === 'string' || typeof cell === 'boolean' || (typeof cell === 'number' && Number.isFinite(cell))), 'record values');
  }
  const candidate = object(value, 'project structure');
  check(candidate.app === 'ListSplatTM' && candidate.version === 1, 'project format or version');
  check(typeof candidate.createdAt === 'string' && typeof candidate.updatedAt === 'string', 'project dates');
  const metadata = object(candidate.metadata, 'project metadata');
  check(['title', 'author', 'className'].every(key => typeof metadata[key] === 'string'), 'project metadata');
  const schema = object(candidate.schema, 'table schema');
  const tables = identified(schema.tables, 'tables');
  check(tables.length > 0, 'tables');
  for (const table of tables) {
    check(typeof table.name === 'string', 'table names');
    for (const field of identified(table.fields, 'fields')) {
      check(typeof field.name === 'string' && typeof field.type === 'string' && Object.hasOwn(FIELD_DEFAULTS, field.type), 'field names or types');
      properties(field, ['description', 'formula', 'defaultValue', 'customPattern', 'customMessage'], 'string', 'field settings');
      properties(field, ['required', 'hidden', 'unique', 'primaryKey', 'readonly'], 'boolean', 'field settings');
      properties(field, ['min', 'max', 'maxLength'], 'number', 'field limits');
      if (field.options !== undefined) check(strings(field.options), 'field options');
      if (field.pattern !== undefined) check(['none', 'email', 'url', 'phone', 'custom'].includes(String(field.pattern)), 'field patterns');
    }
    for (const record of identified(table.records, 'records')) {
      check(typeof record.createdAt === 'string' && typeof record.updatedAt === 'string', 'record dates');
      values(record.values);
      properties(record, ['archived'], 'boolean', 'record settings');
      if (record.comments !== undefined) for (const comment of identified(record.comments, 'comments')) {
        check(['author', 'text', 'at'].every(key => typeof comment[key] === 'string'), 'comments');
        properties(comment, ['teacherOnly'], 'boolean', 'comments');
      }
      if (record.history !== undefined) for (const version of entries(record.history, 'record history')) {
        check(typeof version.at === 'string', 'record history');values(version.values);
      }
      if (record.rubricScores !== undefined) check(Object.values(object(record.rubricScores, 'rubric scores')).every(score => typeof score === 'number' && Number.isFinite(score)), 'rubric scores');
    }
  }
  // Broken references and existing key violations remain repairable in the app;
  // malformed data structures cannot safely be opened.
  for (const relationship of identified(schema.relationships, 'relationships')) {
    check(['name', 'fromTableId', 'fromFieldId', 'toTableId', 'toFieldId'].every(key => typeof relationship[key] === 'string'), 'relationships');
    properties(relationship, ['enforceKeys'], 'boolean', 'relationships');
    if (relationship.cardinality !== undefined) check(['one-to-many', 'one-to-one'].includes(String(relationship.cardinality)), 'relationship cardinality');
  }
  const modes = ['table', 'form', 'cards', 'gallery', 'list', 'kanban', 'calendar', 'labels', 'report'];
  for (const layout of identified(candidate.layouts, 'layouts')) {
    check(typeof layout.name === 'string' && typeof layout.tableId === 'string' && modes.includes(String(layout.mode)), 'layouts');
    properties(layout, ['locked'], 'boolean', 'layouts');
    for (const key of ['fieldOrder', 'hiddenFieldIds']) if (layout[key] !== undefined) check(strings(layout[key]), 'layout fields');
    if (layout.columnWidths !== undefined) check(Object.values(object(layout.columnWidths, 'column widths')).every(width => typeof width === 'number' && Number.isFinite(width)), 'column widths');
  }
  if (candidate.views !== undefined) for (const view of identified(candidate.views, 'saved views')) {
    check(['name', 'tableId', 'search', 'searchFieldId'].every(key => typeof view[key] === 'string') && modes.includes(String(view.mode)), 'saved views');
    for (const key of entries(view.sortKeys, 'saved sorting')) check(typeof key.fieldId === 'string' && ['asc', 'desc'].includes(String(key.direction)), 'saved sorting');
    if (view.find !== null) {
      const query = object(view.find, 'saved search');
      check(['all', 'any'].includes(String(query.match)), 'saved search');
      for (const rule of entries(query.rules, 'saved search rules')) {
        check(typeof rule.fieldId === 'string' && typeof rule.value === 'string' && ['contains', 'equals', 'startsWith', 'endsWith', 'greaterThan', 'lessThan', 'between', 'isEmpty', 'isNotEmpty'].includes(String(rule.operator)), 'saved search rules');
        properties(rule, ['value2'], 'string', 'saved search rules');
      }
    }
  }
  if (candidate.rubricCriteria !== undefined) for (const criterion of identified(candidate.rubricCriteria, 'rubric criteria')) check(typeof criterion.label === 'string' && typeof criterion.max === 'number' && Number.isFinite(criterion.max), 'rubric criteria');
  const teacher = object(candidate.teacher, 'teacher settings');
  check(typeof teacher.studentView === 'boolean' && strings(teacher.notes) && strings(teacher.rubric), 'teacher settings');
}
