import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATE_CATALOG, catalogPublication } from './template-catalog.mjs';
import { validatePublication } from './engine.mjs';
import { parseDelimited, substituteStory, generateMerge } from './merge.mjs';
import { makeTemplate } from './templates.mjs';
test('every original template and its six language editions has a valid editable model', () => {
  assert.equal(TEMPLATE_CATALOG.length, 270);
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
