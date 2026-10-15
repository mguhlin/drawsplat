import { validatePublication, uid } from './engine.mjs';
export async function loadStarterPublication() {
  const response = await fetch(new URL('./defaults/splatworks-news-october-2026.layoutsplat.json?v=20261015', import.meta.url), { cache: 'no-cache' });
  if (!response.ok) throw new Error('The starter newsletter could not be loaded.');
  const publication = validatePublication(await response.json());
  publication.id = uid(); publication.createdAt = new Date().toISOString();
  return publication;
}
