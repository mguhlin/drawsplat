import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATE_CATALOG, catalogPublication } from './template-catalog.mjs';
import { validatePublication } from './engine.mjs';
import { parseDelimited, substituteStory, generateMerge } from './merge.mjs';
import { makeTemplate } from './templates.mjs';
import { textToRichDocument, richDocumentToText } from './rich.mjs';
import { setStoryStyle } from './engine.mjs';
test('each catalog entry has a distinct physical composition within its publication type', () => {
  const groups = new Map();
  for (const entry of TEMPLATE_CATALOG) {
    const doc = catalogPublication(entry.id);
    const geometry = JSON.stringify([doc.width, doc.height, doc.pages.map(p => p.objects.map(o => [o.type, o.kind, o.x, o.y, o.w, o.h, o.rotation, o.path, o.columns]))]);
    const signatures = groups.get(entry.type) || new Set();
    assert.ok(!signatures.has(geometry), `Duplicate composition: ${entry.id}`);
    signatures.add(geometry); groups.set(entry.type, signatures);
  }
});
test('rich editing preserves blank paragraphs, mixed fonts, tracking and paragraph spacing', () => {
  const story = { text: 'Title\n\nBody', style: {size:20,lineHeight:1.2,align:'left',weight:'normal'}, marks:[{from:0,to:5,bold:true,size:20,font:'Georgia',tracking:.4},{from:7,to:11,size:10}], paragraphs:[{from:0,to:5,leading:24,align:'center',spaceAfter:6},{from:6,to:6,leading:12,align:'left'},{from:7,to:11,leading:14,align:'left',indentLeft:18,firstLineIndent:-6}] };
  const output = richDocumentToText(textToRichDocument(story), story.style);
  assert.equal(output.text,story.text); assert.deepEqual(output.paragraphs,story.paragraphs);assert.equal(output.marks[0].tracking,.4);assert.equal(output.marks[1].size,10);
  setStoryStyle(story,'size',30);assert.equal(story.marks[1].size,15);assert.equal(story.paragraphs[2].leading,21);setStoryStyle(story,'align','right');assert.ok(story.paragraphs.every(p=>p.align==='right'));
});
test('every original template and its six language editions has a valid editable model', () => {
  assert.equal(TEMPLATE_CATALOG.length, 145);
  for (const entry of TEMPLATE_CATALOG) for (const language of ['en', 'es', 'vi', 'ar', 'zh', 'uh']) {
    const doc = validatePublication(catalogPublication(entry.id, { language })); assert.equal(doc.templateId, entry.id); assert.ok(doc.pages.length); assert.ok(Object.keys(doc.stories).length);
    if (language === 'ar') assert.ok(Object.values(doc.stories).every(story => story.style.direction === 'rtl'));
  }
});
test('CSV quoted multiline data and leading zeros survive replacement and range remapping', () => {
  const data = parseDelimited('Name,Code\n"Ada, A.\nTeacher",0012'); assert.equal(data.records[0].Name, 'Ada, A.\nTeacher'); assert.equal(data.records[0].Code, '0012');
  const source = { text: 'Dear {{Name}}!', marks: [{ from: 5, to: 13, bold: true }] }, merged = substituteStory(source, { Name: 'Ada' }); assert.equal(merged.text, 'Dear Ada!'); assert.deepEqual(merged.marks, [{ from: 5, to: 8, bold: true }]); assert.equal(source.text, 'Dear {{Name}}!');
});
test('labels fill consecutive recipient slots across sheets without retaining source records', () => {
  const doc = makeTemplate('labels'), records = Array.from({ length: 31 }, (_, i) => ({ Name: `Person ${i + 1}`, Address: 'Local address' })), merged = generateMerge(doc, records);
  assert.equal(merged.pages.length, 2); assert.equal(merged.pages[0].objects.length, 30); assert.equal(merged.pages[1].objects.length, 1); assert.ok(Object.values(merged.stories).some(s => s.text.includes('Person 31'))); assert.equal(merged.records, undefined);
});

test('generated page fields conserve formatting bounds and manual edits detach them',async()=>{
 const{refreshPageNumbers,moveReadingObject}=await import('./publication-fields.mjs');const doc={pages:[{objects:[{id:'a',type:'text',storyId:'s',x:0,y:0}]},{objects:[]}],stories:{s:{text:'Page 1 of 1',pageNumberFormat:'Page {page} of {total}',pageNumberValue:'Page 1 of 1',marks:[{from:0,to:11,bold:true}],paragraphs:[{from:0,to:11}]}}};refreshPageNumbers(doc);assert.equal(doc.stories.s.text,'Page 1 of 2');assert.equal(doc.stories.s.marks[0].to,doc.stories.s.text.length);doc.stories.s.text='User footer';refreshPageNumbers(doc);assert.equal(doc.stories.s.text,'User footer');assert.equal(doc.stories.s.pageNumberFormat,undefined);
 const page={objects:[{id:'a',type:'text',x:0,y:0},{id:'b',type:'image',x:0,y:50}]};assert.equal(moveReadingObject(page,'b',-1),true);assert.deepEqual(page.objects.map(o=>o.id),['a','b']);assert.deepEqual(page.objects.map(o=>o.readingOrder),[1,0]);assert.equal(moveReadingObject(page,'b',-1),false);
});
