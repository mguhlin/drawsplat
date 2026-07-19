import type { ListSplatRecord, ListSplatTable } from './types';
import type { ListSplatFile } from './types';
import { relatedRecords } from './relationships';

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

function splitFormulaArgs(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let depth = 0;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];
    if (char === '"' && previous !== '\\') {
      inQuote = !inQuote;
      current += char;
      continue;
    }
    if (!inQuote && char === '(') depth += 1;
    if (!inQuote && char === ')') depth -= 1;
    if (char === ',' && !inQuote && depth === 0) {
      args.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim() || input.endsWith(',')) {
    args.push(current.trim());
  }

  return args;
}

function literalValue(token: string): string | undefined {
  const trimmed = token.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return undefined;
}

function fieldValue(table: ListSplatTable, record: ListSplatRecord, fieldName: string): string {
  const requestedName = fieldName.trim().toLowerCase();
  const field = table.fields.find((item) => item.name.toLowerCase() === requestedName);
  return field ? String(record.values[field.id] ?? '') : '';
}

function tokenValue(table: ListSplatTable, record: ListSplatRecord, token: string): string {
  const trimmed = token.trim();
  // Recursively evaluate a nested function call, e.g. IF(CONTAINS(Diet,"x"), ...).
  if (/^[A-Z_]+\(.*\)$/i.test(trimmed)) {
    return evaluateSimpleFormula(trimmed, table, record);
  }
  return literalValue(token) ?? fieldValue(table, record, token);
}

function tokenNumber(table: ListSplatTable, record: ListSplatRecord, token: string): number {
  const value = Number(tokenValue(table, record, token));
  return Number.isFinite(value) ? value : 0;
}

function tableNumbers(table: ListSplatTable, fieldName: string): number[] {
  const requestedName = fieldName.trim().toLowerCase();
  const field = table.fields.find((item) => item.name.toLowerCase() === requestedName);
  return field ? numericValues(table, field.id) : [];
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Formula error: not a number';
  }
  return String(Number(value.toFixed(8)));
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function relationshipMatches(project: ListSplatFile | undefined, table: ListSplatTable, record: ListSplatRecord, relationshipName: string): ListSplatRecord[] {
  if (!project) {
    return [];
  }
  const requestedName = relationshipName.trim().toLowerCase();
  const relationship = project.schema.relationships.find(
    (item) => item.fromTableId === table.id && item.name.toLowerCase() === requestedName,
  );
  const targetTable = relationship ? project.schema.tables.find((item) => item.id === relationship.toTableId) : undefined;
  return relationship && targetTable ? relatedRecords(relationship, table, record, targetTable) : [];
}

function relationshipFieldValue(
  project: ListSplatFile | undefined,
  table: ListSplatTable,
  record: ListSplatRecord,
  relationshipName: string,
  fieldName: string,
): string {
  if (!project) {
    return '';
  }
  const relationship = project.schema.relationships.find(
    (item) => item.fromTableId === table.id && item.name.toLowerCase() === relationshipName.trim().toLowerCase(),
  );
  const targetTable = relationship ? project.schema.tables.find((item) => item.id === relationship.toTableId) : undefined;
  const targetRecord = relationshipMatches(project, table, record, relationshipName)[0];
  const targetField = targetTable?.fields.find((field) => field.name.toLowerCase() === fieldName.trim().toLowerCase());
  return targetRecord && targetField ? String(targetRecord.values[targetField.id] ?? '') : '';
}

export function evaluateSimpleFormula(
  formula: string,
  table: ListSplatTable,
  record: ListSplatRecord,
  project?: ListSplatFile,
): string {
  const trimmed = formula.trim();
  if (!trimmed) {
    return '';
  }

  const formulaMatch = trimmed.match(/^([A-Z_]+)\((.*)\)$/i);
  if (!formulaMatch) {
    return 'Formula error: use a function like FIELD(Name)';
  }

  const functionName = formulaMatch[1].toUpperCase();
  const args = splitFormulaArgs(formulaMatch[2]);
  const first = args[0] ?? '';

  if (functionName === 'FIELD') {
    return fieldValue(table, record, first);
  }

  if (functionName === 'JOIN') {
    return args.map((arg) => tokenValue(table, record, arg)).join('');
  }

  if (functionName === 'UPPER') {
    return tokenValue(table, record, first).toUpperCase();
  }

  if (functionName === 'LOWER') {
    return tokenValue(table, record, first).toLowerCase();
  }

  if (functionName === 'TITLECASE') {
    return titleCase(tokenValue(table, record, first));
  }

  if (functionName === 'TRIM') {
    return tokenValue(table, record, first).trim();
  }

  if (functionName === 'LENGTH') {
    return String(tokenValue(table, record, first).length);
  }

  if (functionName === 'CONTAINS') {
    return tokenValue(table, record, first).toLowerCase().includes(tokenValue(table, record, args[1] ?? '').toLowerCase())
      ? 'Yes'
      : 'No';
  }

  if (functionName === 'IF_EMPTY') {
    return tokenValue(table, record, first).trim() ? tokenValue(table, record, first) : tokenValue(table, record, args[1] ?? '');
  }

  if (functionName === 'LOOKUP') {
    return relationshipFieldValue(project, table, record, literalValue(first) ?? first, literalValue(args[1] ?? '') ?? args[1] ?? '');
  }

  if (functionName === 'COUNT_RELATED') {
    return String(relationshipMatches(project, table, record, literalValue(first) ?? first).length);
  }

  if (functionName === 'ADD') {
    return formatNumber(args.reduce((total, arg) => total + tokenNumber(table, record, arg), 0));
  }

  if (functionName === 'SUBTRACT') {
    return formatNumber(args.slice(1).reduce((total, arg) => total - tokenNumber(table, record, arg), tokenNumber(table, record, first)));
  }

  if (functionName === 'MULTIPLY') {
    return formatNumber(args.reduce((total, arg) => total * tokenNumber(table, record, arg), 1));
  }

  if (functionName === 'DIVIDE') {
    const divisor = tokenNumber(table, record, args[1] ?? '');
    return divisor === 0 ? 'Formula error: divide by zero' : formatNumber(tokenNumber(table, record, first) / divisor);
  }

  if (functionName === 'ROUND') {
    const places = Math.max(0, Math.min(6, Math.round(tokenNumber(table, record, args[1] ?? '"0"'))));
    return String(Number(tokenNumber(table, record, first).toFixed(places)));
  }

  if (['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT'].includes(functionName)) {
    const values = tableNumbers(table, first);
    if (functionName === 'SUM') return formatNumber(values.reduce((total, value) => total + value, 0));
    if (functionName === 'AVERAGE') return formatNumber(values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0);
    if (functionName === 'MIN') return formatNumber(values.length ? Math.min(...values) : 0);
    if (functionName === 'MAX') return formatNumber(values.length ? Math.max(...values) : 0);
    return String(values.length);
  }

  if (functionName === 'COUNT_UNIQUE') {
    const requested = first.trim().toLowerCase();
    const field = table.fields.find((item) => item.name.toLowerCase() === requested);
    if (!field) return '0';
    const seen = new Set(table.records.map((r) => String(r.values[field.id] ?? '').trim().toLowerCase()).filter(Boolean));
    return String(seen.size);
  }

  if (functionName === 'PERCENT') {
    const whole = tokenNumber(table, record, args[1] ?? '');
    return whole === 0 ? '0' : formatNumber((tokenNumber(table, record, first) / whole) * 100);
  }

  // Text helpers
  if (functionName === 'LEFT') return tokenValue(table, record, first).slice(0, Math.max(0, tokenNumber(table, record, args[1] ?? '"0"')));
  if (functionName === 'RIGHT') {
    const n = Math.max(0, tokenNumber(table, record, args[1] ?? '"0"'));
    const text = tokenValue(table, record, first);
    return n === 0 ? '' : text.slice(-n);
  }
  if (functionName === 'MID') {
    const start = Math.max(0, tokenNumber(table, record, args[1] ?? '"1"') - 1);
    const len = Math.max(0, tokenNumber(table, record, args[2] ?? '"0"'));
    return tokenValue(table, record, first).slice(start, start + len);
  }
  if (functionName === 'SUBSTITUTE') {
    return tokenValue(table, record, first).split(tokenValue(table, record, args[1] ?? '')).join(tokenValue(table, record, args[2] ?? ''));
  }

  // Logic helpers (truthy = non-empty and not no/false/0)
  const truthy = (token: string): boolean => {
    const value = tokenValue(table, record, token).trim().toLowerCase();
    return value !== '' && !['no', 'false', '0'].includes(value);
  };
  if (functionName === 'IS_EMPTY') return tokenValue(table, record, first).trim() === '' ? 'Yes' : 'No';
  if (functionName === 'NOT') return truthy(first) ? 'No' : 'Yes';
  if (functionName === 'AND') return args.every(truthy) ? 'Yes' : 'No';
  if (functionName === 'OR') return args.some(truthy) ? 'Yes' : 'No';
  if (functionName === 'IF') return truthy(first) ? tokenValue(table, record, args[1] ?? '') : tokenValue(table, record, args[2] ?? '');

  // Date helpers
  const parseDate = (token: string): Date | null => {
    const raw = tokenValue(table, record, token).trim();
    if (!raw) return null;
    const date = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  if (functionName === 'TODAY') return new Date().toISOString().slice(0, 10);
  if (functionName === 'YEAR' || functionName === 'MONTH' || functionName === 'DAY') {
    const date = parseDate(first);
    if (!date) return '';
    if (functionName === 'YEAR') return String(date.getFullYear());
    if (functionName === 'MONTH') return String(date.getMonth() + 1);
    return String(date.getDate());
  }
  if (functionName === 'DAYS_BETWEEN' || functionName === 'YEARS_BETWEEN') {
    const start = parseDate(first);
    const end = args[1] ? parseDate(args[1]) : new Date();
    if (!start || !end) return '';
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    return functionName === 'DAYS_BETWEEN' ? String(days) : String(Math.floor(days / 365.25));
  }

  return `Formula error: ${functionName} is not supported`;
}
