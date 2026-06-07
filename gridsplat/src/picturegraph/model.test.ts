import { describe, expect, it } from 'vitest';

import {
  addPicture,
  initialPictureCategories,
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
});
