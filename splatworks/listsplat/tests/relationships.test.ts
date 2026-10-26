import { describe, expect, it } from 'vitest';
import { addTable, createStarterProject, replaceTable, updateCell } from '../src/model/database';
import { addRelationship, createRelationship, relatedRecords, relationshipLabel } from '../src/model/relationships';

describe('relationships', () => {
  it('creates one-to-many relationships and resolves related records', () => {
    let project = createStarterProject('Books and Reviews');
    project = addTable(project, 'Reviews');

    const books = project.schema.tables[0];
    const reviews = project.schema.tables[1];
    const titleField = books.fields[0];
    const reviewBookField = reviews.fields[0];

    const editedBooks = updateCell(books, books.records[0].id, titleField.id, 'Charlotte');
    const editedReviews = updateCell(reviews, reviews.records[0].id, reviewBookField.id, 'Charlotte');
    project = replaceTable(replaceTable(project, editedBooks), editedReviews);

    const relationship = createRelationship('Book reviews', books.id, titleField.id, reviews.id, reviewBookField.id);
    project = addRelationship(project, relationship);

    expect(project.schema.relationships).toHaveLength(1);
    expect(relationshipLabel(project, relationship)).toContain('Animals');
    expect(relatedRecords(relationship, editedBooks, editedBooks.records[0], editedReviews)).toHaveLength(1);
  });
});

import { createField, createRecord, addRecord, duplicateRecord } from '../src/model/database';
import { relationalIssues, newRelationalIssue } from '../src/model/relationships';
function keyedProject(one = false) {
  const project = createStarterProject();
  const pk = { ...createField('Student ID', 'number'), primaryKey: true };
  const name = createField('Name');
  const fk = createField('Student ID', 'number');
  const parent = { id: 'students', name: 'Students', fields: [pk, name], records: [createRecord([pk, name], { [pk.id]: 101, [name.id]: 'Alex' }), createRecord([pk, name], { [pk.id]: 102, [name.id]: 'Sam' })] };
  const child = { id: 'assignments', name: 'Assignments', fields: [fk], records: [createRecord([fk], { [fk.id]: 101 }), createRecord([fk], { [fk.id]: one ? 102 : 101 })] };
  const rel = { ...createRelationship('Student assignments', parent.id, pk.id, child.id, fk.id), enforceKeys: true, cardinality: one ? 'one-to-one' as const : 'one-to-many' as const };
  project.schema = { tables: [parent, child], relationships: [rel] };
  return { project, parent, child, pk, fk };
}
describe('enforced relational keys', () => {
  it('accepts one-to-many and one-to-one and resolves numeric keys', () => {
    for (const one of [false, true]) {
      const {project, parent, child} = keyedProject(one);
      expect(relationalIssues(project)).toEqual([]);
      expect(relatedRecords(project.schema.relationships[0], parent, parent.records[0], child)).toHaveLength(one ? 1 : 2);
    }
  });
  it('rejects blank and duplicate primary keys', () => {
    const {project, parent, pk} = keyedProject();
    for (const value of ['', 101]) expect(newRelationalIssue(project, replaceTable(project, updateCell(parent, parent.records[1].id, pk.id, value)))).toMatch(value === '' ? /cannot be empty/ : /duplicate primary key/);
  });
  it('rejects dangling references, parent deletion and referenced key changes', () => {
    const {project, parent, child, pk, fk} = keyedProject();
    expect(newRelationalIssue(project, replaceTable(project, updateCell(child, child.records[0].id, fk.id, 999)))).toMatch(/no parent/);
    expect(newRelationalIssue(project, replaceTable(project, {...parent, records: parent.records.slice(1)}))).toMatch(/no parent/);
    expect(newRelationalIssue(project, replaceTable(project, updateCell(parent, parent.records[0].id, pk.id, 999)))).toMatch(/no parent/);
  });
  it('rejects one-to-one duplicates, mismatched types and multiple parents', () => {
    const {project, child, fk} = keyedProject(true);
    expect(newRelationalIssue(project, replaceTable(project, updateCell(child, child.records[1].id, fk.id, 101)))).toMatch(/cannot repeat/);
    expect(relationalIssues(replaceTable(project, {...child, fields: [{...fk, type: 'text'}]})).join()).toMatch(/types must match/);
    expect(relationalIssues({...project, schema: {...project.schema, relationships: [...project.schema.relationships, {...project.schema.relationships[0], id: 'other'}]}}).join()).toMatch(/already has a parent/);
  });
  it('generates fresh numeric and text primary keys on add and duplicate', () => {
    const {parent, pk} = keyedProject();
    expect(addRecord(parent).records.at(-1)?.values[pk.id]).toBe(103);
    expect(duplicateRecord(parent, parent.records[0].id).records.at(-1)?.values[pk.id]).toBe(103);
    const textKey = {...pk, type: 'text' as const};
    const textTable = {...parent, fields: [textKey], records: [createRecord([textKey])]};
    const duplicated = duplicateRecord(textTable, textTable.records[0].id);
    expect(duplicated.records[0].values[pk.id]).not.toBe(duplicated.records[1].values[pk.id]);
  });
  it('preserves legacy relationships and round-trips key metadata', () => {
    const {project} = keyedProject();
    const restored = JSON.parse(JSON.stringify(project));
    expect(relationalIssues(restored)).toEqual([]);
    restored.schema.tables[0].fields[0].primaryKey = false;
    restored.schema.relationships[0].enforceKeys = false;
    expect(relationalIssues(restored)).toEqual([]);
  });
});

it('supports a shared primary key as a one-to-one foreign key', () => {
  const {project, child, fk} = keyedProject(true);
  const shared = replaceTable(project, {...child, fields: [{...fk, primaryKey: true}]});
  expect(relationalIssues(shared)).toEqual([]);
  expect(relationalIssues(replaceTable(shared, updateCell(shared.schema.tables[1], child.records[1].id, fk.id, 101))).join()).toMatch(/duplicate primary key/);
});
