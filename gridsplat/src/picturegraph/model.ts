export interface PictureCategory {
  id: string;
  label: string;
  count: number;
  icon: string;
}

export const initialPictureCategories: PictureCategory[] = [
  { id: 'apples', label: 'Apples', count: 3, icon: '●' },
  { id: 'bananas', label: 'Bananas', count: 2, icon: '▲' },
  { id: 'oranges', label: 'Oranges', count: 4, icon: '■' },
];

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
