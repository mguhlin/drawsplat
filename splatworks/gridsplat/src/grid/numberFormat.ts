import type {CellFormat} from './types';

export function displayCellNumber(value: string, format?: CellFormat): string {
  const kind = format?.numberFormat || 'plain';
  if (!value.trim() || kind === 'plain' || !Number.isFinite(Number(value))) return value;
  const n = Number(value), digits = Math.max(0, Math.min(10, format?.decimalPlaces ?? (kind === 'whole' ? 0 : 2)));
  if (kind === 'date') {
    const date = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0,10) : value;
  }
  const options: Intl.NumberFormatOptions = { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: kind !== 'decimal' };
  if (kind === 'currency') { options.style = 'currency'; options.currency = 'USD'; }
  if (kind === 'percent') options.style = 'percent';
  if (kind === 'scientific') options.notation = 'scientific';
  return n.toLocaleString(undefined, options);
}
