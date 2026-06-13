import { findPictureIcon } from './icons';

export interface PictureCategory {
  id: string;
  label: string;
  count: number;
  iconId: string;
}

export const initialPictureCategories: PictureCategory[] = [
  { id: 'apples', label: 'Apples', count: 3, iconId: 'apple' },
  { id: 'bananas', label: 'Bananas', count: 2, iconId: 'banana' },
  { id: 'oranges', label: 'Oranges', count: 4, iconId: 'orange' },
];

export function pictureCategoriesToMatrix(
  categories: PictureCategory[],
): string[][] {
  return [
    ['Category', 'Count'],
    ...categories.map((category) => [category.label, String(category.count)]),
  ];
}

export function matrixToPictureCategories(
  matrix: string[][],
): PictureCategory[] | null {
  const [header, ...rows] = matrix;
  const firstHeader = header?.[0]?.toLowerCase() ?? '';
  const secondHeader = header?.[1]?.toLowerCase() ?? '';

  if (
    !['category', 'item', 'name', 'fruit'].some((label) =>
      firstHeader.includes(label),
    ) ||
    !secondHeader.includes('count')
  ) {
    return null;
  }

  const categories = rows
    .filter((row) => row[0]?.trim() && Number.isFinite(Number(row[1])))
    .slice(0, 6)
    .map((row, index) => {
      const icon = findPictureIcon(['apple', 'banana', 'orange', 'star'][index] ?? 'star');

      return {
        count: Math.max(0, Math.floor(Number(row[1]))),
        iconId: icon.id,
        id: row[0].toLowerCase().replace(/[^a-z0-9]+/g, '-') || `item-${index}`,
        label: row[0],
      };
    });

  return categories.length > 0 ? categories : null;
}

export function updateCategoryCount(
  categories: PictureCategory[],
  id: string,
  count: number,
): PictureCategory[] {
  return categories.map((category) =>
    category.id === id
      ? { ...category, count: Math.max(0, Math.floor(count || 0)) }
      : category,
  );
}

export function addPicture(
  categories: PictureCategory[],
  id: string,
): PictureCategory[] {
  const category = categories.find((item) => item.id === id);

  return updateCategoryCount(categories, id, (category?.count ?? 0) + 1);
}

export function removePicture(
  categories: PictureCategory[],
  id: string,
): PictureCategory[] {
  const category = categories.find((item) => item.id === id);

  return updateCategoryCount(
    categories,
    id,
    Math.max(0, (category?.count ?? 0) - 1),
  );
}

export function scaledPictureCount(count: number, scale: number): number {
  return Math.ceil(count / Math.max(1, scale));
}
