import { describe, expect, it } from 'vitest';
import { addTable, createStarterProject, replaceTable, updateCell } from '../src/model/database';
import { evaluateSimpleFormula } from '../src/model/formulas';
import { addRelationship, createRelationship } from '../src/model/relationships';

function starterTable() {
  const table = createStarterProject().schema.tables[0];
  const scoreField = { ...table.fields[0], id: 'score', name: 'Score', type: 'number' as const };
  const bonusField = { ...table.fields[1], id: 'bonus', name: 'Bonus', type: 'number' as const };
  return {
    ...table,
    fields: [scoreField, bonusField, ...table.fields],
    records: table.records.map((record, index) => ({
      ...record,
      values: {
        ...record.values,
        score: index === 0 ? 8 : 10,
        bonus: index === 0 ? 2 : 5,
      },
    })),
  };
}

describe('calculation formulas', () => {
  it('reads and joins field values with quoted text', () => {
    const table = starterTable();
    const record = table.records[0];
    expect(evaluateSimpleFormula('FIELD(Animal)', table, record)).toBe('Axolotl');
    expect(evaluateSimpleFormula('JOIN(Animal, " lives in ", Habitat)', table, record)).toBe('Axolotl lives in Freshwater lakes');
  });

  it('supports classroom-friendly text helpers', () => {
    const table = starterTable();
    const record = table.records[1];
    expect(evaluateSimpleFormula('UPPER(Animal)', table, record)).toBe('RED PANDA');
    expect(evaluateSimpleFormula('TITLECASE("red panda report")', table, record)).toBe('Red Panda Report');
    expect(evaluateSimpleFormula('CONTAINS(Diet, "fruit")', table, record)).toBe('Yes');
    expect(evaluateSimpleFormula('LENGTH(Animal)', table, record)).toBe('9');
  });

  it('supports logic, more text, and date helpers', () => {
    const table = starterTable();
    const record = table.records[0];
    expect(evaluateSimpleFormula('IF(CONTAINS(Diet, "worms"), "carnivore", "other")', table, record)).toBe('carnivore');
    expect(evaluateSimpleFormula('LEFT(Animal, "3")', table, record)).toBe('Axo');
    expect(evaluateSimpleFormula('RIGHT(Animal, "2")', table, record)).toBe('tl');
    expect(evaluateSimpleFormula('SUBSTITUTE(Animal, "Axolotl", "Frog")', table, record)).toBe('Frog');
    expect(evaluateSimpleFormula('AND(CONTAINS(Diet,"worms"), CONTAINS(Habitat,"lakes"))', table, record)).toBe('Yes');
    expect(evaluateSimpleFormula('YEAR("2024-05-01")', table, record)).toBe('2024');
    expect(evaluateSimpleFormula('DAYS_BETWEEN("2024-01-01", "2024-01-11")', table, record)).toBe('10');
    expect(evaluateSimpleFormula('PERCENT("20", "50")', table, record)).toBe('40');
  });

  it('supports row math and clear formula errors', () => {
    const table = starterTable();
    const record = table.records[0];
    expect(evaluateSimpleFormula('ADD(Score, Bonus)', table, record)).toBe('10');
    expect(evaluateSimpleFormula('MULTIPLY(Score, Bonus)', table, record)).toBe('16');
    expect(evaluateSimpleFormula('DIVIDE(Score, "0")', table, record)).toBe('Formula error: divide by zero');
  });

  it('supports table summary calculations', () => {
    const table = starterTable();
    const record = table.records[0];
    expect(evaluateSimpleFormula('SUM(Score)', table, record)).toBe('18');
    expect(evaluateSimpleFormula('AVERAGE(Bonus)', table, record)).toBe('3.5');
    expect(evaluateSimpleFormula('COUNT(Score)', table, record)).toBe('2');
  });

  it('looks up values through named relationships', () => {
    let project = createStarterProject('Books and Reviews');
    project = addTable(project, 'Reviews');

    const books = project.schema.tables[0];
    const reviews = project.schema.tables[1];
    const bookTitle = books.fields[0];
    const reviewBook = reviews.fields[0];
    const reviewRating = reviews.fields[1];

    const editedBooks = updateCell(books, books.records[0].id, bookTitle.id, 'Charlotte');
    let editedReviews = updateCell(reviews, reviews.records[0].id, reviewBook.id, 'Charlotte');
    editedReviews = updateCell(editedReviews, editedReviews.records[0].id, reviewRating.id, '5 stars');
    project = replaceTable(replaceTable(project, editedBooks), editedReviews);

    const relationship = createRelationship('Book reviews', editedBooks.id, bookTitle.id, editedReviews.id, reviewBook.id);
    project = addRelationship(project, relationship);

    expect(evaluateSimpleFormula('COUNT_RELATED("Book reviews")', editedBooks, editedBooks.records[0], project)).toBe('1');
    expect(evaluateSimpleFormula('LOOKUP("Book reviews", Notes)', editedBooks, editedBooks.records[0], project)).toBe('5 stars');
  });
});
