import { createRecord } from '../model/database';
import type { ListSplatTable } from '../model/types';
import { tableFromCsv } from '../io/csv';

export interface ListSplatTemplate {
  id: string;
  title: string;
  gradeBand: string;
  goal: string;
  table: ListSplatTable;
  reflectionQuestions: string[];
}

function templateFromCsv(
  id: string,
  title: string,
  gradeBand: string,
  goal: string,
  csv: string,
  reflectionQuestions: string[],
): ListSplatTemplate {
  return {
    id,
    title,
    gradeBand,
    goal,
    table: tableFromCsv(title, csv),
    reflectionQuestions,
  };
}

export const listSplatTemplates: ListSplatTemplate[] = [
  templateFromCsv(
    'classroom-library',
    'Classroom Library Catalog',
    'Grades 3-8',
    'Track books, genres, reading levels, and recommendations.',
    `Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,
    ['Which genre appears most often?', 'What book would you recommend first?'],
  ),
  templateFromCsv(
    'science-observations',
    'Science Observation Log',
    'Grades 3-8',
    'Collect observations over time and look for patterns.',
    `Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,
    ['What changed over time?', 'What might explain the pattern?'],
  ),
  templateFromCsv(
    'state-facts',
    'State Facts Database',
    'Grades 4-8',
    'Compare places using consistent fields.',
    `State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,
    ['Which fields help compare states?', 'What new field would improve this database?'],
  ),
  templateFromCsv(
    'book-reviews',
    'Book Review Collection',
    'Grades 3-8',
    'Collect opinions and evidence from student reading.',
    `Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,
    ['Which book has the strongest recommendation?', 'What evidence supports each rating?'],
  ),
  templateFromCsv(
    'vocabulary-bank',
    'Vocabulary Word Bank',
    'Grades 2-8',
    'Build a searchable word list with definitions and examples.',
    `Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,
    ['Which words belong to more than one subject?', 'Which examples help you remember the word?'],
  ),
  templateFromCsv(
    'survey-results',
    'Simple Survey Results',
    'Grades 3-8',
    'Organize survey answers and look for patterns.',
    `Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,
    ['Which answer appears most often?', 'What new question should the class ask next?'],
  ),
  templateFromCsv(
    'museum-cards',
    'Museum Exhibit Cards',
    'Grades 4-8',
    'Create printable exhibit cards for objects, images, or research topics.',
    `Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,
    ['How should the exhibit be grouped?', 'What field would help visitors understand the item?'],
  ),
];

export function cloneTemplateTable(template: ListSplatTemplate): ListSplatTable {
  const fields = template.table.fields.map((field) => ({ ...field, id: `${field.id}_${Date.now().toString(36)}` }));
  const records = template.table.records.map((record) =>
    createRecord(
      fields,
      Object.fromEntries(
        template.table.fields.map((oldField, index) => [fields[index].id, record.values[oldField.id] ?? '']),
      ),
    ),
  );
  return {
    ...template.table,
    id: `table_${template.id}_${Date.now().toString(36)}`,
    fields,
    records,
  };
}
