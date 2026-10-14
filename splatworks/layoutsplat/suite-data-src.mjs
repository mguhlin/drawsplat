// Reuse the suite's actual calculation and number-format engines for mail merge.
import { recalculateSheet } from '../gridsplat/src/formulas/engine.ts';
import { displayCellNumber } from '../gridsplat/src/grid/numberFormat.ts';
import { evaluateSimpleFormula } from '../listsplat/src/model/formulas.ts';
const valueText = value => {
  if (value == null) return '';
  if (!['string','number','boolean'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)) throw Error('Invalid recipient value.');
  const text = String(value); if (text.length > 100000) throw Error('A recipient value exceeds 100,000 characters.'); return text;
};
export function nativeMergeSources(data) {
  if (data?.version !== 1) throw Error('Choose a supported version 1 GridSplat or ListSplat project.');
  if (Array.isArray(data.sheets) && data.sheets.length && data.sheets.length <= 100) {
    return data.sheets.map((source, index) => ({ name: valueText(source.name || `Sheet ${index + 1}`), rows() {
      if (!Array.isArray(source.cells) || source.cells.length > 2000 || source.cells.some(row => !Array.isArray(row) || row.length > 100 || row.some(cell => typeof cell !== 'string' || cell.length > 100000))) throw Error('Use a GridSplat sheet with at most 2,000 rows and 100 columns.');
      const width = Math.max(0, ...source.cells.map(row => row.length)); if (width * source.cells.length > 100000) throw Error('Use at most 100,000 cells.');
      const sheet = recalculateSheet(source.cells.map(row => Array.from({ length: width }, (_, col) => { const rawValue = row[col] || ''; return { rawValue, displayValue: rawValue, type: rawValue.trim().startsWith('=') ? 'formula' : 'text' }; })));
      if (source.formats && (!Array.isArray(source.formats) || source.formats.length > 100000)) throw Error('Invalid GridSplat formats.');
      for (const entry of source.formats || []) if (Number.isInteger(entry.row) && Number.isInteger(entry.col) && sheet[entry.row]?.[entry.col]) {
        const format = entry.format || {};
        sheet[entry.row][entry.col].format = { numberFormat: ['plain','whole','decimal','currency','percent','thousands','scientific','date'].includes(format.numberFormat) ? format.numberFormat : 'plain', decimalPlaces: Number.isFinite(format.decimalPlaces) ? Math.max(0, Math.min(10, format.decimalPlaces)) : undefined };
      }
      const rows = sheet.map(row => row.map(cell => {
        if (cell.errorType) throw Error(`Fix the GridSplat formula error (${cell.errorType}) before merging.`);
        return displayCellNumber(cell.displayValue, cell.format);
      }));
      while (rows.length && rows.at(-1).every(value => value === '')) rows.pop();
      return rows;
    } }));
  }
  if (data.app === 'ListSplatTM' && Array.isArray(data.schema?.tables) && data.schema.tables.length && data.schema.tables.length <= 100) {
    return data.schema.tables.map(table => ({ name: valueText(table.name), rows() {
      if (!Array.isArray(table.fields) || !table.fields.length || table.fields.length > 100 || !Array.isArray(table.records) || table.records.length > 10000) throw Error('Use a table with 1–100 fields and at most 10,000 records.');
      const fields = table.fields.filter(field => !field.hidden);
      return [fields.map(field => valueText(field.name)), ...table.records.filter(record => !record.archived).map(record => fields.map(field => {
        if (field.type !== 'calculation') return valueText(record.values?.[field.id]);
        if (typeof field.formula !== 'string' || field.formula.length > 5000) throw Error('Invalid ListSplat calculation.');
        const value = evaluateSimpleFormula(field.formula, table, record, data);
        if (/^Formula error:/i.test(value)) throw Error('Fix the ListSplat calculation before merging.');
        return value;
      }))];
    } }));
  }
  throw Error('Choose a GridSplat workbook or ListSplat database project.');
}
