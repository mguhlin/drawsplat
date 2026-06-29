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
