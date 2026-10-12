import {describe,it,expect} from 'vitest';
import {createSheet,updateCell} from './gridModel';
import {parseRange,changeStructure,fillRange,replaceInRange} from './spreadsheetPower';
describe('spreadsheet range operations',()=>{
 it('selects complete columns or rows and rejects ranges beyond the sheet',()=>{
  expect(parseRange('A:C',20,20)).toEqual({start:{row:0,col:0},end:{row:19,col:2}});
  expect(parseRange('2:5',20,20)).toEqual({start:{row:1,col:0},end:{row:4,col:19}});
  expect(()=>parseRange('Z99',20,20)).toThrow();
 });
 it('adjusts formula references when inserting and deleting a row',()=>{
  let sheet=updateCell(updateCell(createSheet(4,4),{row:0,col:0},'7'),{row:1,col:1},'=A1*2');
  sheet=changeStructure(sheet,'row',0,1);
  expect(sheet[2][1].rawValue).toBe('=A2*2');expect(sheet[2][1].displayValue).toBe('14');
  sheet=changeStructure(sheet,'row',0,1,true);expect(sheet[1][1].rawValue).toBe('=A1*2');
 });
 it('fills relative formulas, keeps absolute references and extends numeric series',()=>{
  let sheet=updateCell(updateCell(updateCell(createSheet(4,4),{row:0,col:0},'2'),{row:1,col:0},'4'),{row:0,col:1},'=A1+$A$1');
  sheet=fillRange(sheet,parseRange('A1:A4',4,4),'down',true);expect(sheet[3][0].rawValue).toBe('8');
  sheet=fillRange(sheet,parseRange('B1:B4',4,4),'down');expect(sheet[3][1].rawValue).toBe('=A4+$A$1');expect(sheet[3][1].displayValue).toBe('10');
 });
 it('replaces literal text in selection without rewriting formulas',()=>{
  let sheet=updateCell(updateCell(createSheet(3,3),{row:0,col:0},'Hello [class]'),{row:1,col:0},'="[class]"');
  sheet=replaceInRange(sheet,parseRange('A1:A2',3,3),'[class]','team');
  expect(sheet[0][0].rawValue).toBe('Hello team');expect(sheet[1][0].rawValue).toBe('="[class]"');
 });
});
