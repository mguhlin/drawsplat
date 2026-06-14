import { describe, expect, it } from 'vitest';

import {
  addPicture,
  initialPictureCategories,
  matrixToPictureCategories,
  pictureCategoriesToMatrix,
  removePicture,
  scaledPictureCount,
  updateCategoryCount,
} from './model';

describe('picture graph model', () => {
  it('adds and removes category counts', () => {
    const added = addPicture(initialPictureCategories, 'apples');
    const removed = removePicture(added, 'apples');

    expect(added[0].count).toBe(initialPictureCategories[0].count + 1);
    expect(removed[0].count).toBe(initialPictureCategories[0].count);
  });

  it('keeps counts at zero or above', () => {
    const updated = updateCategoryCount(
      initialPictureCategories,
      'bananas',
      -5,
    );

    expect(updated[1].count).toBe(0);
  });

  it('calculates scaled picture counts', () => {
    expect(scaledPictureCount(5, 2)).toBe(3);
    expect(scaledPictureCount(5, 1)).toBe(5);
  });

  it('converts between picture graph categories and sheet matrices', () => {
    const matrix = pictureCategoriesToMatrix(initialPictureCategories);
    const categories = matrixToPictureCategories(matrix);

    expect(matrix[0]).toEqual(['Category', 'Count']);
    expect(categories?.[0]).toMatchObject({
      count: initialPictureCategories[0].count,
      label: initialPictureCategories[0].label,
    });
  });
});
