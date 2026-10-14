import {describe,it,expect} from 'vitest';
import {normalizeTabs} from '../src/editor/tabPlugin';
import {removeLegacyStarterHeading} from '../src/editor/starterCleanup';
import {DOMParser,Node} from 'prosemirror-model';
import {writeSplatSchema} from '../src/editor/writerEditor';
describe('ruler document data',()=>{
 it('preserves saved indents and actual tab nodes through native JSON and HTML parsing',()=>{
  const host=document.createElement('div');host.innerHTML='<p style="margin-left:36pt;text-indent:18pt;margin-right:12pt" data-writer-tabs="[72,144]">Before<span data-writer-tab="true">\t</span>After</p>';
  const doc=DOMParser.fromSchema(writeSplatSchema).parse(host);expect(doc.firstChild!.attrs).toMatchObject({indentLeft:36,firstLineIndent:18,indentRight:12,tabs:[72,144]});expect(doc.firstChild!.child(1).type.name).toBe('tab');expect(Node.fromJSON(writeSplatSchema,doc.toJSON()).toJSON()).toEqual(doc.toJSON());
 });
 it('bounds tab stops and removes duplicates without mutating callers',()=>{const source=[72,-1,72,144,900,NaN];expect(normalizeTabs(source)).toEqual([72,144]);expect(source.length).toBe(6);});
 it('removes only the recognized old starter heading, preserving instructions and user content',()=>{
  const doc={type:'doc',content:[{type:'heading',content:[{type:'text',text:'Untitled Document'}]},{type:'paragraph',content:[{type:'text',text:'Start writing in WriteSplatTM. Your work saves locally and the readability panel updates as you type.'}]},{type:'paragraph',content:[{type:'text',text:'Keep my writing.'}]}]};
  expect((removeLegacyStarterHeading(doc) as typeof doc).content).toEqual(doc.content.slice(1));const real={...doc,content:[doc.content[0],doc.content[2]]};expect(removeLegacyStarterHeading(real)).toBe(real);
 });
});
