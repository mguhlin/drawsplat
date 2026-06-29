import type { ListSplatRecord, ListSplatTable } from './types';

export interface TableSummary {
  fieldId: string;
  fieldName: string;
  count: number;
  sum: number;
  average: number;
  minimum: number;
  maximum: number;
}

function numericValues(table: ListSplatTable, fieldId: string): number[] {
  return table.records
    .map((record) => Number(record.values[fieldId]))
    .filter((value) => Number.isFinite(value));
}

export function summarizeTable(table: ListSplatTable): TableSummary[] {
  return table.fields
    .filter((field) => ['number', 'currency', 'percent'].includes(field.type))
    .map((field) => {
      const values = numericValues(table, field.id);
      const sum = values.reduce((total, value) => total + value, 0);
      return {
        fieldId: field.id,
        fieldName: field.name,
        count: values.length,
        sum,
        average: values.length ? sum / values.length : 0,
        minimum: values.length ? Math.min(...values) : 0,
        maximum: values.length ? Math.max(...values) : 0,
      };
    });
}

export function evaluateSimpleFormula(formula: string, table: ListSplatTable, record: ListSplatRecord): string {
  const trimmed = formula.trim();
  const fieldMatch = trimmed.match(/^FIELD\(([^)]+)\)$/i);
  if (fieldMatch) {
    const requestedName = fieldMatch[1].trim().toLowerCase();
    const field = table.fields.find((item) => item.name.toLowerCase() === requestedName);
    return field ? String(record.values[field.id] ?? '') : '';
  }

  const joinMatch = trimmed.match(/^JOIN\((.+)\)$/i);
  if (joinMatch) {
    return joinMatch[1]
      .split(',')
      .map((part) => {
        const token = part.trim();
        if (token.startsWith('"') && token.endsWith('"')) {
          return token.slice(1, -1);
        }
        const field = table.fields.find((item) => item.name.toLowerCase() === token.toLowerCase());
        return field ? String(record.values[field.id] ?? '') : token;
      })
      .join('');
  }

  return '';
}
