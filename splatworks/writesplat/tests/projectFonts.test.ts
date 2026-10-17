import {describe,it,expect} from 'vitest';
import {assertProjectFonts} from '../src/storage/projectFonts';
import {createNativeFile,assertWriteSplatFile} from '../src/storage/nativeFile';
const id='LayoutSplatFont-12345678-1234-1234-1234-123456789abc';
const font={name:'A.ttf',family:'School Font',category:'serif' as const,format:'ttf' as const,weight:400,italic:false,src:'data:font/ttf;base64,AAAA'};
describe('portable font files',()=>{
 it('retains a validated font collection through native save/open',()=>{const file=createNativeFile('Fonts',{type:'doc'},{customFonts:{[id]:font}});assertWriteSplatFile(JSON.parse(JSON.stringify(file)));expect(file.customFonts?.[id].src).toBe(font.src);});
 it('rejects remote font URLs, injected families and oversized collections',()=>{for(const changed of [{...font,src:'https://example.com/font.ttf'},{...font,family:'Bad"family'},{...font,weight:Infinity}])expect(()=>assertProjectFonts({[id]:changed})).toThrow();expect(()=>assertProjectFonts(Array(17).fill(font))).toThrow();});
});
