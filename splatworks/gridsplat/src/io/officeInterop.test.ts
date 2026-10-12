import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyCellFormat, createSheet, mergeCells, updateCell } from '../grid/gridModel';
import { exportExcel, importExcel } from './excel';
import { exportOds, fromOpenFormula, importOds, toOpenFormula } from './ods';
import { exportNativeJson, importNativeJson } from './json';

function sample() {
  let sheet=createSheet(30,24);
  for(const [row,col,value] of [[0,0,'Classroom data'],[1,0,'3'],[2,0,'4'],[1,1,'00123'],[1,2,'=SUM(A2:A3)'],[1,4,'=$A$2+A3'],[29,23,'=A2*2']] as const)sheet=updateCell(sheet,{row,col},value);
  sheet=applyCellFormat(sheet,{start:{row:0,col:0},end:{row:0,col:0}},{bold:true,italic:true,align:'center',textColor:'#552299',backgroundColor:'#f8f1ff',border:true});
  sheet=applyCellFormat(sheet,{start:{row:1,col:0},end:{row:1,col:0}},{numberFormat:'currency',decimalPlaces:2});
  return mergeCells(sheet,{start:{row:0,col:0},end:{row:0,col:1}});
}
function verify(sheet: ReturnType<typeof sample>) {
  expect(sheet[0][0].rawValue).toBe('Classroom data');expect(sheet[1][1].rawValue).toBe('00123');
  expect(sheet[1][2].rawValue.replace(/\s/g,'')).toBe('=SUM(A2:A3)');expect(sheet[1][2].displayValue).toBe('7');
  expect(sheet[1][4].rawValue).toBe('=$A$2+A3');expect(sheet[29][23].displayValue).toBe('6');
  expect(sheet[0][0].format).toMatchObject({bold:true,italic:true,align:'center'});
  expect(sheet[0][0].merge).toEqual({rowSpan:1,colSpan:2});expect(sheet[0][1].hiddenBy).toEqual({row:0,col:0});
  expect(sheet[1][0].format?.numberFormat).toBe('currency');
}
describe('office spreadsheet interchange',()=>{
  it('exports real XLSX formulas and numeric values, keeping text identifiers and styles',async()=>{
    const buffer=await exportExcel(sample()),workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer);
    expect(workbook.worksheets[0].getCell('C2').formula).toBe('SUM(A2:A3)');expect(workbook.worksheets[0].getCell('A2').value).toBe(3);
    expect(workbook.worksheets[0].getCell('B2').value).toBe('00123');verify(await importExcel(buffer));
  });
  it('round-trips ODS formulas, absolute references, formatting, and merged cells',async()=>verify(await importOds(await exportOds(sample()))));
  it('preserves office formatting, merged cells, and larger dimensions in native backups',()=>verify(importNativeJson(exportNativeJson(sample()))));
  it('converts OpenFormula without modifying quoted text or function names',()=>{
    const raw='=IF(A1="A1, B2",SUM($B$2:C3),LOG10(100))';
    const encoded=toOpenFormula(raw);expect(encoded).toContain('"A1, B2"');expect(encoded).toContain('LOG10(100)');expect(encoded).toContain('[.$B$2:.C3]');
    expect(fromOpenFormula(encoded,'Sheet 1')).toBe(raw);
    expect(()=>fromOpenFormula('of:=[Other.A1]','Sheet 1')).toThrow('another sheet');
  });
  it('ignores Calc repeated trailing blank rows without expanding millions of cells',async()=>{
    const zip=new JSZip();zip.file('content.xml','<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:spreadsheet><table:table table:name="Sheet 1"><table:table-row><table:table-cell office:value-type="float" office:value="4"/><table:table-cell table:number-columns-repeated="16383"/></table:table-row><table:table-row table:number-rows-repeated="1048575"><table:table-cell table:number-columns-repeated="16384"/></table:table-row></table:table></office:spreadsheet></office:body></office:document-content>');
    const sheet=await importOds(await zip.generateAsync({type:'arraybuffer'}));expect(sheet.length).toBe(20);expect(sheet[0][0].displayValue).toBe('4');
  });
  it('keeps last rows and columns of larger imports',async()=>{
    const sheet=await importOds(await exportOds(sample()));expect(sheet.length).toBe(30);expect(sheet[0].length).toBe(24);
  });
  it.skipIf(!process.env.DRAWSPLAT_TEST_LIBREOFFICE)('opens exported XLSX/ODS in LibreOffice and reads the converted files',async()=>{
    const folder=mkdtempSync(join(tmpdir(),'gridsplat-office-')),odsOut=join(folder,'ods'),xlsxOut=join(folder,'xlsx');mkdirSync(odsOut);mkdirSync(xlsxOut);
    const xlsx=join(folder,'classroom.xlsx'),ods=join(folder,'classroom.ods');writeFileSync(xlsx,Buffer.from(await exportExcel(sample())));writeFileSync(ods,Buffer.from(await exportOds(sample())));
    for(const [input,format,out] of [[xlsx,'ods',odsOut],[ods,'xlsx',xlsxOut]])execFileSync('libreoffice',['-env:UserInstallation=file://'+join(folder,'profile-'+format),'--headless','--convert-to',format,'--outdir',out,input],{timeout:30000});
    const asArray=(path:string)=>Uint8Array.from(readFileSync(path)).buffer;
    verify(await importOds(asArray(join(odsOut,'classroom.ods'))));verify(await importExcel(asArray(join(xlsxOut,'classroom.xlsx'))));
  },90000);
});
