import {describe, expect, it} from 'vitest';
import {parseMarkdownTables, splitMarkdownRow, tableFromMarkdownRows} from '../src/io/markdown';

describe('Markdown table import', () => {
  it('finds multiple tables in prose with alignment and optional outer pipes', () => {
    const tables = parseMarkdownTables('# Notes\r\n\r\n| Name | Age |\r\n| :--- | ---: |\r\n| Alex | 12 |\r\n\r\nSome notes\r\n\r\nTitle | Pages\r\n--- | ---\r\nBook | 100');
    expect(tables).toEqual([[['Name', 'Age'], ['Alex', '12']], [['Title', 'Pages'], ['Book', '100']]]);
  });
  it('preserves escaped pipes, code pipes, commas, quotes and Unicode', () => {
    expect(splitMarkdownRow('| a\\|b | `x|y` | José, "hi" |')).toEqual(['a|b', '`x|y`', 'José, "hi"']);
    expect(splitMarkdownRow('| ``a`|b`` | end |')).toEqual(['``a`|b``', 'end']);
  });
  it('pads missing cells, truncates extras and preserves empty cells', () => {
    expect(parseMarkdownTables('| A | B |\n| --- | --- |\n| one |\n| | two |\n| x | y | extra |')[0]).toEqual([['A','B'],['one',''],['','two'],['x','y']]);
  });
  it('rejects prose, malformed separators and mismatched headers', () => {
    for (const text of ['hello', 'A | B\n-- | --\nx | y', 'A | B\n---\nx | y']) expect(parseMarkdownTables(text)).toEqual([]);
  });
  it('imports header-only tables, blank headers and HTML as plain text', () => {
    const rows = parseMarkdownTables('| | Name |\n| --- | --- |')[0];
    const table = tableFromMarkdownRows('Example', rows);
    expect(table.fields.map(field => field.name)).toEqual(['Field 1','Name']);
    expect(table.records).toEqual([]);
    const html = tableFromMarkdownRows('HTML', [['Text'], ['<script>alert(1)</script>']]);
    expect(html.records[0].values[html.fields[0].id]).toBe('<script>alert(1)</script>');
  });
});
