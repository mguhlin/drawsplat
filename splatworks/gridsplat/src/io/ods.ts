import JSZip from 'jszip';
import { recalculateSheet } from '../formulas/engine';
import type { CellFormat, SheetData } from '../grid/types';
import { matrixToSheet } from './matrix';

const OFFICE = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';
const TABLE = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
const TEXT = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
const STYLE = 'urn:oasis:names:tc:opendocument:xmlns:style:1.0';
const FO = 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0';
const NUMBER = 'urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0';
const MIME = 'application/vnd.oasis.opendocument.spreadsheet';
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));

// Transform references/separators only outside quoted formula strings.
function formulaParts(value: string, transform: (part: string) => string) {
  return (value.match(/"(?:[^"]|"")*"|[^"]+/g) || []).map(part => part.startsWith('"') ? part : transform(part)).join('');
}
export function toOpenFormula(value: string) {
  return 'of:=' + formulaParts(value.slice(1), part => {
    if (part.includes('!')) throw new Error('ODS export supports references within the current sheet only.');
    return part.replace(/(?<![\w.])(\$?[A-Z]{1,3}\$?\d+)(?::(\$?[A-Z]{1,3}\$?\d+))?(?![\w(])/gi,
      (_, start, end) => end ? `[.${start}:.${end}]` : `[.${start}]`).replace(/,/g, ';');
  });
}
export function fromOpenFormula(value: string, sheetName: string) {
  const expression = value.replace(/^[^:]*:=/, '').replace(/^=/, '');
  return '=' + formulaParts(expression, part => part.replace(/\[([^\]]+)\]/g, (_, ref: string) => {
    const addresses = ref.split(':').map(address => {
      const local = /^\.?(\$?[A-Z]+\$?\d+)$/i.exec(address);
      if (local) return local[1];
      const named = /^\$?(?:'([^']+)'|([^.]+))\.(\$?[A-Z]+\$?\d+)$/i.exec(address);
      if (named && (named[1] || named[2]) === sheetName) return named[3];
      throw new Error('This ODS formula refers to another sheet or an unsupported reference.');
    });
    return addresses.join(':');
  }).replace(/;/g, ','));
}

function styleXml(format: CellFormat, name: string) {
  const text: string[] = [], cell: string[] = [], paragraph: string[] = [];
  if (format.bold) text.push('fo:font-weight="bold"');
  if (format.italic) text.push('fo:font-style="italic"');
  if (format.underline) text.push('style:text-underline-style="solid"');
  if (format.strikethrough) text.push('style:text-line-through-style="solid"');
  if (format.textColor) text.push(`fo:color="${escape(format.textColor)}"`);
  if (format.fontSize) text.push(`fo:font-size="${format.fontSize}pt"`);
  if (format.fontFamily) text.push(`fo:font-family="${escape(format.fontFamily)}"`);
  if (format.backgroundColor) cell.push(`fo:background-color="${escape(format.backgroundColor)}"`);
  if (format.border) cell.push('fo:border="0.75pt solid #888888"');
  if (format.wrapText) cell.push('fo:wrap-option="wrap"');
  if (format.verticalAlign) cell.push(`style:vertical-align="${format.verticalAlign}"`);
  if (format.align) paragraph.push(`fo:text-align="${format.align}"`);
  const kind=format.numberFormat;
  const digits=Math.max(0,Math.min(10,format.decimalPlaces ?? (kind==='whole'?0:2)));
  const number=`<number:number number:decimal-places="${digits}" number:min-integer-digits="1" number:grouping="${kind==='currency'||kind==='thousands'}"/>`;
  const family=kind==='currency'?'currency-style':kind==='percent'?'percentage-style':kind==='date'?'date-style':'number-style';
  const content=kind==='currency'?'<number:currency-symbol number:language="en" number:country="US">$</number:currency-symbol>'+number:kind==='percent'?number+'<number:text>%</number:text>':kind==='date'?'<number:year number:style="long"/><number:text>-</number:text><number:month number:style="long"/><number:text>-</number:text><number:day number:style="long"/>':kind==='scientific'?`<number:scientific-number number:decimal-places="${digits}" number:min-exponent-digits="2"/>`:number;
  const numeric=kind && kind!=='plain'?`<number:${family} style:name="${name}n">${content}</number:${family}>`:'';
  return numeric+`<style:style ${numeric?`style:data-style-name="${name}n"`:''} style:name="${name}" style:family="table-cell"><style:text-properties ${text.join(' ')}/><style:table-cell-properties ${cell.join(' ')}/><style:paragraph-properties ${paragraph.join(' ')}/></style:style>`;
}
export async function exportOds(sheet: SheetData): Promise<ArrayBuffer> {
  const zip = new JSZip(), styles: string[] = [];
  const rows = sheet.map((row, r) => '<table:table-row>' + row.map((cell, c) => {
    if (cell.hiddenBy) return '<table:covered-table-cell/>';
    const name = `cell${r}_${c}`;
    if (cell.format) styles.push(styleXml(cell.format, name));
    const attrs: string[] = [];
    if (cell.format) attrs.push(`table:style-name="${name}"`);
    if (cell.merge) attrs.push(`table:number-columns-spanned="${cell.merge.colSpan}" table:number-rows-spanned="${cell.merge.rowSpan}"`);
    const formula = cell.rawValue.startsWith('=');
    if (formula) attrs.push(`table:formula="${escape(toOpenFormula(cell.rawValue))}"`);
    const value = formula ? cell.displayValue : cell.rawValue;
    // Keep identifiers such as 00123 as text.
    const numeric = /^[+-]?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) && Number.isFinite(Number(value));
    if (numeric) attrs.push(`office:value-type="float" office:value="${Number(value)}"`);
    else if (value) attrs.push('office:value-type="string"');
    return `<table:table-cell ${attrs.join(' ')}><text:p>${escape(value)}</text:p></table:table-cell>`;
  }).join('') + '</table:table-row>').join('');
  zip.file('mimetype', MIME, {compression:'STORE'});
  zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="${OFFICE}" xmlns:table="${TABLE}" xmlns:text="${TEXT}" xmlns:style="${STYLE}" xmlns:fo="${FO}" xmlns:number="${NUMBER}" xmlns:of="urn:oasis:names:tc:opendocument:xmlns:of:1.2" office:version="1.2"><office:automatic-styles>${styles.join('')}</office:automatic-styles><office:body><office:spreadsheet><table:table table:name="Sheet 1">${rows}</table:table></office:spreadsheet></office:body></office:document-content>`);
  zip.file('META-INF/manifest.xml', `<?xml version="1.0"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="${MIME}"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>`);
  return zip.generateAsync({type:'arraybuffer',compression:'DEFLATE'});
}
function parse(xml: string) {
  if (xml.length > 8_000_000 || /<!DOCTYPE/i.test(xml)) throw new Error('This ODS XML is too large or contains an unsupported document type.');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('This ODS file contains invalid XML.');
  return doc;
}
async function readXml(zip: JSZip, name: string) {
  const entry = zip.file(name);
  if (!entry) return undefined;
  const size = (entry as unknown as {_data?: {uncompressedSize?: number}})._data?.uncompressedSize;
  if (size && size > 8_000_000) throw new Error('This ODS XML is too large.');
  return parse(await entry.async('string'));
}
function repeat(el: Element, attribute: string) {
  const value = el.getAttributeNS(TABLE, attribute);
  if (!value) return 1;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error('Invalid ODS row or column count.');
  return n;
}
export async function importOds(buffer: ArrayBuffer): Promise<SheetData> {
  if (buffer.byteLength > 20_000_000) throw new Error('ODS imports are limited to 20 MB.');
  const zip = await JSZip.loadAsync(buffer);
  const doc = await readXml(zip, 'content.xml');
  if (!doc) throw new Error('This does not look like an ODS spreadsheet.');
  const table = doc.getElementsByTagNameNS(TABLE, 'table')[0];
  if (!table) throw new Error('This ODS file has no worksheet.');
  const sheetName = table.getAttributeNS(TABLE, 'name') || '';
  const styleDoc = await readXml(zip, 'styles.xml');
  const styles = new Map<string, Element>(), numberStyles=new Map<string,Element>();
  for(const source of [styleDoc,doc])for(const node of source?.getElementsByTagNameNS(NUMBER,'*') || []){const name=node.getAttributeNS(STYLE,'name');if(name)numberStyles.set(name,node);}
  for (const source of [styleDoc,doc]) for (const node of source?.getElementsByTagNameNS(STYLE,'style') || []) styles.set(node.getAttributeNS(STYLE,'name') || '',node);
  function getFormat(name: string, depth = 0): CellFormat | undefined {
    const node = styles.get(name); if (!node || depth > 5) return undefined;
    const format: CellFormat = {...getFormat(node.getAttributeNS(STYLE,'parent-style-name') || '',depth+1)};
    const attr = (type: string, ns: string, key: string) => node.getElementsByTagNameNS(STYLE,type)[0]?.getAttributeNS(ns,key);
    if (attr('text-properties',FO,'font-weight')==='bold') format.bold=true;
    if (attr('text-properties',FO,'font-style')==='italic') format.italic=true;
    if(attr('text-properties',STYLE,'text-line-through-style')==='solid')format.strikethrough=true;
    if (attr('text-properties',STYLE,'text-underline-style') && attr('text-properties',STYLE,'text-underline-style')!=='none') format.underline=true;
    const color=attr('text-properties',FO,'color'), bg=attr('table-cell-properties',FO,'background-color');
    if (color && /^#[0-9a-f]{6}$/i.test(color)) format.textColor=color;
    if (bg && /^#[0-9a-f]{6}$/i.test(bg)) format.backgroundColor=bg;
    const size=parseFloat(attr('text-properties',FO,'font-size') || '');
    if (size>=8 && size<=72) format.fontSize=size;
    const family=attr('text-properties',FO,'font-family');if(family)format.fontFamily=family;
    const align=attr('paragraph-properties',FO,'text-align');if (align==='left'||align==='center'||align==='right')format.align=align;
    const vertical=attr('table-cell-properties',STYLE,'vertical-align');if(vertical==='top'||vertical==='middle'||vertical==='bottom')format.verticalAlign=vertical;
    if(attr('table-cell-properties',FO,'wrap-option')==='wrap')format.wrapText=true;
    if(attr('table-cell-properties',FO,'border') && attr('table-cell-properties',FO,'border')!=='none')format.border=true;
    const n=numberStyles.get(node.getAttributeNS(STYLE,'data-style-name') || '');
    if(n){
      if(n.localName==='percentage-style')format.numberFormat='percent';else if(n.localName==='currency-style')format.numberFormat='currency';else if(n.localName==='date-style')format.numberFormat='date';else if(n.getElementsByTagNameNS(NUMBER,'scientific-number').length)format.numberFormat='scientific';else format.numberFormat='decimal';
      const numeric=n.getElementsByTagNameNS(NUMBER,'number')[0];
      const precision=Number(numeric?.getAttributeNS(NUMBER,'decimal-places') || 0);if(Number.isInteger(precision)&&precision>=0&&precision<=10)format.decimalPlaces=precision;
      if(format.numberFormat==='decimal'){format.numberFormat=numeric?.getAttributeNS(NUMBER,'grouping')==='true'?'thousands':precision===0?'whole':'decimal';}
    }
    return Object.keys(format).length ? format : undefined;
  }
  const data = new Map<number,string[]>(), formats: {r:number,c:number,format:CellFormat}[] = [], merges: {r:number,c:number,rs:number,cs:number}[] = [];
  let rowIndex=0,lastRow=-1,lastCol=-1;
  for (const row of table.getElementsByTagNameNS(TABLE,'table-row')) {
    const copies=repeat(row,'number-rows-repeated');
    const values: string[] = [], rowFormats: {c:number,format:CellFormat}[] = [];
    let col=0,meaningful=false;
    for (const cell of row.children) {
      if (cell.namespaceURI!==TABLE || !['table-cell','covered-table-cell'].includes(cell.localName))continue;
      const count=repeat(cell,'number-columns-repeated');
      const formula=cell.getAttributeNS(TABLE,'formula');
      const type=cell.getAttributeNS(OFFICE,'value-type');
      const text=Array.from(cell.getElementsByTagNameNS(TEXT,'p')).map(p=>p.textContent || '').join('\n');
      const raw=formula ? fromOpenFormula(formula,sheetName) : type==='float'||type==='percentage'||type==='currency' ? cell.getAttributeNS(OFFICE,'value') || text : type==='boolean' ? (cell.getAttributeNS(OFFICE,'boolean-value')==='true'?'=TRUE()':'=FALSE()') : type==='date' ? cell.getAttributeNS(OFFICE,'date-value') || text : text;
      const rs=repeat(cell,'number-rows-spanned'),cs=repeat(cell,'number-columns-spanned');
      if(raw || rs>1 || cs>1){
        if(col+count>200 || rowIndex+copies>2000 || col+cs>200 || rowIndex+rs>2000)throw new Error('This ODS data exceeds the 2,000-row or 200-column limit.');
        meaningful=true;for(let offset=0;offset<count;offset++)values[col+offset]=raw;
        lastCol=Math.max(lastCol,col+count-1,col+cs-1);lastRow=Math.max(lastRow,rowIndex+copies-1,rowIndex+rs-1);
        if(rs>1 || cs>1){if(count!==1 || copies!==1)throw new Error('Repeated merged ODS cells are not supported.');merges.push({r:rowIndex,c:col,rs,cs});}
      }
      const format=getFormat(cell.getAttributeNS(TABLE,'style-name') || '');
      if(format)for(let offset=0;offset<Math.min(count,Math.max(0,200-col));offset++)rowFormats.push({c:col+offset,format});
      col+=count;
    }
    // Calc files can contain millions of repeated trailing blank rows. Do not expand them.
    if(meaningful){for(let offset=0;offset<copies;offset++){data.set(rowIndex+offset,values);for(const f of rowFormats)formats.push({r:rowIndex+offset,...f});}}
    else if(rowIndex<20){for(const f of rowFormats)if(f.c<20)formats.push({r:rowIndex,...f});}
    rowIndex+=copies;
  }
  const rows=Math.max(20,lastRow+1),cols=Math.max(20,lastCol+1);
  if(rows*cols>100000)throw new Error('ODS sheets are limited to 100,000 cells.');
  const matrix=Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>data.get(r)?.[c] || ''));
  const sheet=matrixToSheet(matrix,rows,cols);
  for(const f of formats)if(f.r<rows && f.c<cols)sheet[f.r][f.c].format=f.format;
  for(const m of merges){
    if(sheet[m.r][m.c].hiddenBy)throw new Error('Overlapping ODS merged cells are not supported.');
    sheet[m.r][m.c].merge={rowSpan:m.rs,colSpan:m.cs};
    for(let r=m.r;r<m.r+m.rs;r++)for(let c=m.c;c<m.c+m.cs;c++)if(r!==m.r || c!==m.c){
      if(sheet[r][c].hiddenBy || sheet[r][c].merge)throw new Error('Overlapping ODS merged cells are not supported.');
      sheet[r][c].hiddenBy={row:m.r,col:m.c};sheet[r][c].rawValue='';
    }
  }
  return recalculateSheet(sheet);
}
export const odsMimeType = () => MIME;
