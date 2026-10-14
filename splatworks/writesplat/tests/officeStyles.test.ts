import {describe,it,expect} from 'vitest';
import {wordXmlToHtml,odtXmlToHtml} from '../../shared/office-text.mjs';
import {DOMParser as PMParser,Node} from 'prosemirror-model';
import {writeSplatSchema} from '../src/editor/writerEditor';
const w='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
describe('shared local Office styles',()=>{
 it('keeps numbering across blank paragraphs and preserves Word defaults, inheritance and direct paragraph metrics',()=>{
  const styles=`<w:styles xmlns:w="${w}"><w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="20"/><w:rFonts w:ascii="Arial"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:styleId="Base"><w:rPr><w:b/><w:color w:val="123456"/></w:rPr></w:style><w:style w:styleId="Child"><w:basedOn w:val="Base"/><w:rPr><w:i/></w:rPr></w:style></w:styles>`;
  const numbers=`<w:numbering xmlns:w="${w}"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
  const item=(t:string)=>`<w:p><w:pPr><w:pStyle w:val="Child"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:line="276" w:lineRule="auto" w:before="60" w:after="120"/></w:pPr><w:r><w:t>${t}</w:t></w:r></w:p>`;
  const html=wordXmlToHtml(`<w:document xmlns:w="${w}"><w:body>${item('One')}<w:p/>${item('Two')}<w:p/>${item('Three')}</w:body></w:document>`,styles,numbers);
  const host=document.createElement('div');host.innerHTML=html;expect([...host.querySelectorAll('ol')].map(e=>e.start)).toEqual([1,2,3]);expect(host.querySelector('strong em, em strong')?.textContent).toBe('One');
  const native=PMParser.fromSchema(writeSplatSchema).parse(host),first=native.firstChild!;expect(first.attrs.order).toBe(1);expect(first.attrs.compact).toBe(true);const p=first.firstChild!.firstChild!;expect(p.attrs).toMatchObject({fontSize:10,lineMultiple:1.15,spaceBefore:3,spaceAfter:6});expect(Node.fromJSON(writeSplatSchema,native.toJSON()).toJSON()).toEqual(native.toJSON());
 });
 it('resolves actual OpenDocument style properties rather than guessing formatting from style names',()=>{
  const xml=`<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"><office:automatic-styles><style:style style:name="P1" style:family="paragraph"><style:paragraph-properties fo:margin-top="0.1in" fo:line-height="125%"/></style:style><style:style style:name="T1" style:family="text"><style:text-properties fo:font-size="16pt" fo:font-weight="bold" fo:font-style="italic" style:text-underline-style="solid" fo:color="#112233"/></style:style></office:automatic-styles><office:body><office:text><text:p text:style-name="P1"><text:span text:style-name="T1">Styled text</text:span></text:p></office:text></office:body></office:document-content>`;
  const host=document.createElement('div');host.innerHTML=odtXmlToHtml(xml);const doc=PMParser.fromSchema(writeSplatSchema).parse(host);expect(doc.firstChild!.attrs).toMatchObject({spaceBefore:7.2,lineMultiple:1.25});const marks=doc.firstChild!.firstChild!.marks;expect(marks.map(m=>m.type.name)).toEqual(expect.arrayContaining(['strong','em','underline','fontSize','textColor']));expect(marks.find(m=>m.type.name==='fontSize')?.attrs.size).toBe('16pt');
 });
 it('rejects XML declarations with entity expansion',()=>{expect(()=>wordXmlToHtml('<!DOCTYPE doc [<!ENTITY x "bad">]><doc/>')).toThrow(/unsupported/i);expect(()=>odtXmlToHtml('<!DOCTYPE doc><doc/>')).toThrow(/unsupported/i);});
});
