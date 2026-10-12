import ExcelJS from 'exceljs';

import type { SheetData } from '../grid/types';
import { matrixToSheet, type SheetMatrix } from './matrix';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function cellValueToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'object' && 'formula' in value) {
    const formula = value.formula;

    return typeof formula === 'string' ? `=${formula}` : '';
  }

  if (typeof value === 'object' && 'richText' in value) {
    return value.richText?.map((item) => item.text).join('') ?? '';
  }

  if (typeof value === 'object' && 'text' in value) {
    return String(value.text ?? '');
  }

  if (typeof value === 'object' && 'result' in value) {
    return cellValueToText(value.result as ExcelJS.CellValue);
  }

  return String(value);
}

function toArrayBuffer(buffer: ExcelJS.Buffer): ArrayBuffer {
  if (buffer instanceof ArrayBuffer) {
    return buffer;
  }

  const view = new Uint8Array(buffer as ArrayBufferLike);
  const copy = new Uint8Array(view.byteLength);

  copy.set(view);

  return copy.buffer;
}

export async function exportExcel(sheet: SheetData): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');
  workbook.calcProperties.fullCalcOnLoad = true;
  sheet.forEach((row,r)=>row.forEach((cell,c)=>{
    if(cell.hiddenBy)return;
    const target=worksheet.getCell(r+1,c+1), raw=cell.rawValue;
    const number=(value:string)=>/^[+-]?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) && Number.isFinite(Number(value));
    target.value=raw.startsWith('=') ? {formula:raw.slice(1),result:number(cell.displayValue)?Number(cell.displayValue):cell.displayValue} : number(raw)?Number(raw):raw;
    const f=cell.format;
    if(f){
      target.font={bold:f.bold,italic:f.italic,underline:f.underline,strike:f.strikethrough,name:f.fontFamily,size:f.fontSize,color:f.textColor?{argb:'FF'+f.textColor.replace('#','')}:undefined};
      target.alignment={horizontal:f.align,vertical:f.verticalAlign,wrapText:f.wrapText};
      if(f.backgroundColor)target.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+f.backgroundColor.replace('#','')}};
      if(f.border){const edge={style:'thin' as const,color:{argb:'FF888888'}};target.border={top:edge,bottom:edge,left:edge,right:edge};}
      const digits=Math.max(0,Math.min(10,f.decimalPlaces ?? (f.numberFormat==='whole'?0:2))), decimal=digits?'.'+'0'.repeat(digits):'';
      const formats={plain:'General',whole:'0',decimal:'0'+decimal,currency:'$#,##0'+decimal,percent:'0'+decimal+'%',thousands:'#,##0'+decimal,scientific:'0'+decimal+'E+00',date:'yyyy-mm-dd'};
      if(f.numberFormat)target.numFmt=formats[f.numberFormat];
    }
    if(cell.merge)worksheet.mergeCells(r+1,c+1,r+cell.merge.rowSpan,c+cell.merge.colSpan);
  }));

  const buffer = await workbook.xlsx.writeBuffer();

  return toArrayBuffer(buffer);
}

export async function importExcel(buffer: ArrayBuffer): Promise<SheetData> {
  if(buffer.byteLength>20_000_000)throw new Error('Excel imports are limited to 20 MB.');
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('This Excel file does not contain a worksheet.');
  }

  if(worksheet.rowCount>2000 || worksheet.columnCount>200 || Math.max(20,worksheet.rowCount)*Math.max(20,worksheet.columnCount)>100000)throw new Error('This Excel sheet exceeds the 2,000-row, 200-column or 100,000-cell limit.');
  const matrix: SheetMatrix = [];

  worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
    const values: string[] = [];

    row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
      values[colIndex - 1] = cell.type===ExcelJS.ValueType.Merge ? '' : cellValueToText(cell.value);
    });

    matrix[rowIndex - 1] = values;
  });

  const dense=Array.from({length:worksheet.rowCount},(_,r)=>matrix[r] || []);
  const sheet=matrixToSheet(dense);
  worksheet.eachRow({includeEmpty:true},(row,r)=>row.eachCell({includeEmpty:true},(cell,c)=>{
    if(cell.type===ExcelJS.ValueType.Merge)return;
    const f: import('../grid/types').CellFormat = {};
    const font=cell.font || {},align=cell.alignment || {};
    if(font.bold)f.bold=true;if(font.italic)f.italic=true;if(font.underline)f.underline=true;if(font.strike)f.strikethrough=true;
    if(font.name)f.fontFamily=font.name;if(font.size && font.size>=8 && font.size<=72)f.fontSize=font.size;
    if(font.color?.argb && /^[0-9a-f]{8}$/i.test(font.color.argb))f.textColor='#'+font.color.argb.slice(2);
    if(cell.fill?.type==='pattern' && cell.fill.fgColor?.argb && /^[0-9a-f]{8}$/i.test(cell.fill.fgColor.argb))f.backgroundColor='#'+cell.fill.fgColor.argb.slice(2);
    if(align.horizontal==='left'||align.horizontal==='center'||align.horizontal==='right')f.align=align.horizontal;
    if(align.vertical==='top'||align.vertical==='middle'||align.vertical==='bottom')f.verticalAlign=align.vertical;
    if(align.wrapText)f.wrapText=true;
    if(cell.border && Object.values(cell.border).some(edge=>edge?.style))f.border=true;
    const num=cell.numFmt || '';
    if(num.includes('%'))f.numberFormat='percent';else if(num.includes('$'))f.numberFormat='currency';else if(/E[+-]0/i.test(num))f.numberFormat='scientific';else if(num.includes('#,##'))f.numberFormat='thousands';else if(/^0\.0+$/.test(num))f.numberFormat='decimal';else if(num==='0')f.numberFormat='whole';
    const precision=/\.(0+)/.exec(num);if(precision)f.decimalPlaces=Math.min(10,precision[1].length);
    if(Object.keys(f).length)sheet[r-1][c-1].format=f;
  }));
  for(const range of worksheet.model.merges || []){
    const [first,last]=range.split(':').map(address=>worksheet.getCell(address));
    const r=Number(first.row)-1,c=Number(first.col)-1,rs=Number(last.row)-r,cs=Number(last.col)-c;
    sheet[r][c].merge={rowSpan:rs,colSpan:cs};
    for(let y=r;y<r+rs;y++)for(let x=c;x<c+cs;x++)if(y!==r || x!==c)sheet[y][x].hiddenBy={row:r,col:c};
  }
  return sheet;
}

export function excelMimeType(): string {
  return EXCEL_MIME;
}
