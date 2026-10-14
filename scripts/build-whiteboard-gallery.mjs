// Derive LayoutSplat's picker from the actual whiteboard collection, not a copy.
import { readFile, writeFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('assets/js/app.js', root), 'utf8');
const constant = name => runInNewContext('(' + source.match(new RegExp(`const ${name}=([\\s\\S]*?);\\n`))[1] + ')', { appPath: path => path });
const backgrounds = constant('BACKGROUND_TEMPLATES');
const entries = [];
for (const [id, path] of Object.entries(backgrounds)) {
  const svg = await readFile(new URL(path, root), 'utf8');
  const name = svg.match(/<title[^>]*>(.*?)<\/title>/s)?.[1].replace(/ panel background$/i, '') || id;
  entries.push({ id, name, group: 'classroom', path });
}
for (const [id, category, name, file] of constant('COLORING_BOOK_ITEMS')) entries.push({ id, name, group: 'coloring', category, path: 'assets/coloring-book/' + file });
for (const [, items] of constant('IMAGE_GALLERY_CATALOG')) for (const [id, name, path] of items) entries.push({ id, name, group: 'animals', path });
const scratch = JSON.parse(await readFile(new URL('assets/scratch-art/manifest.json', root), 'utf8'));
scratch.forEach((file, i) => entries.push({ id: 'scratch-art-' + (i + 1), name: 'ScratchArt Background ' + (i + 1), group: 'scratch', path: 'assets/scratch-art/' + file }));
for (const entry of entries) await readFile(new URL(entry.path, root));
const output = JSON.stringify(entries, null, 2) + '\n';
const target = new URL('splatworks/layoutsplat/whiteboard-catalog.json', root);
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== output) throw Error('Run node scripts/build-whiteboard-gallery.mjs to refresh the collection.');
} else await writeFile(target, output);
console.log(`${entries.length} shared whiteboard backgrounds and images`);
