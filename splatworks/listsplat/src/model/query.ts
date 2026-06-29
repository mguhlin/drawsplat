import type { ListSplatRecord, ListSplatTable } from './types';

export type SortDirection = 'asc' | 'desc';

export interface FindOptions {
  query: string;
  fieldId: string;
}

export interface ReplaceOptions {
  fieldIds: string[];
  find: string;
  replacement: string;
  recordIds?: string[];
  caseSensitive?: boolean;
}

function cellText(value: unknown): string {
  return value == null ? '' : String(value);
}

export function findRecords(table: ListSplatTable, options: FindOptions): ListSplatRecord[] {
  const query = options.query.trim();
  if (!query) {
    return table.records;
  }

  const normalizedQuery = query.toLowerCase();
  return table.records.filter((record) => {
    const fieldIds = options.fieldId === 'all' ? table.fields.map((field) => field.id) : [options.fieldId];
    return fieldIds.some((fieldId) => cellText(record.values[fieldId]).toLowerCase().includes(normalizedQuery));
  });
}

export function sortRecords(table: ListSplatTable, fieldId: string, direction: SortDirection): ListSplatTable {
  const multiplier = direction === 'asc' ? 1 : -1;
  return {
    ...table,
    records: [...table.records].sort((left, right) => {
      const leftText = cellText(left.values[fieldId]);
      const rightText = cellText(right.values[fieldId]);
      const leftNumber = Number(leftText);
      const rightNumber = Number(rightText);
      if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
        return (leftNumber - rightNumber) * multiplier;
      }
      return leftText.localeCompare(rightText, undefined, { numeric: true, sensitivity: 'base' }) * multiplier;
    }),
  };
}

export function findDuplicateRecords(table: ListSplatTable, fieldId: string): ListSplatRecord[] {
  const counts = new Map<string, number>();
  table.records.forEach((record) => {
    const key = cellText(record.values[fieldId]).trim().toLowerCase();
    if (key) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });
  return table.records.filter((record) => {
    const key = cellText(record.values[fieldId]).trim().toLowerCase();
    return key ? (counts.get(key) ?? 0) > 1 : false;
  });
}

export function findMissingRecords(table: ListSplatTable, fieldId: string): ListSplatRecord[] {
  return table.records.filter((record) => !cellText(record.values[fieldId]).trim());
}

export function replaceValues(table: ListSplatTable, options: ReplaceOptions): { table: ListSplatTable; count: number } {
  if (!options.find) {
    return { table, count: 0 };
  }

  const flags = options.caseSensitive ? 'g' : 'gi';
  const escapedFind = options.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escapedFind, flags);
  const allowedRecordIds = new Set(options.recordIds ?? table.records.map((record) => record.id));
  let count = 0;

  const records = table.records.map((record) => {
    if (!allowedRecordIds.has(record.id)) {
      return record;
    }
    let changed = false;
    const values = { ...record.values };
    options.fieldIds.forEach((fieldId) => {
      const original = cellText(values[fieldId]);
      const next = original.replace(pattern, () => {
        count += 1;
        return options.replacement;
      });
      if (next !== original) {
        changed = true;
        values[fieldId] = next;
      }
    });
    return changed ? { ...record, updatedAt: new Date().toISOString(), values } : record;
  });

  return { table: { ...table, records }, count };
}
