import { describe, expect, it } from 'vitest';
import { createStarterProject } from '../src/model/database';
import { evaluateSimpleFormula } from '../src/model/formulas';

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
});
