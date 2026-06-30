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

function splitFormulaArgs(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];
    if (char === '"' && previous !== '\\') {
      inQuote = !inQuote;
      current += char;
      continue;
    }
    if (char === ',' && !inQuote) {
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

export function evaluateSimpleFormula(formula: string, table: ListSplatTable, record: ListSplatRecord): string {
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

  return `Formula error: ${functionName} is not supported`;
}
