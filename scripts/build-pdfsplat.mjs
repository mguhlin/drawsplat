import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const deckRoot = resolve(root, 'solutions/pdfsplat/webdeck');
const framework = { version: 5, css: await readFile(resolve(deckRoot, 'deck-framework.css'), 'utf8'), js: await readFile(resolve(deckRoot, 'deck-framework.js'), 'utf8') };
await writeFile(resolve(root, 'solutions/pdfsplat/src/webdeck-runtime.js'), '// Generated from ../webdeck/deck-framework.* (WebDeck v5, MIT).\nexport const framework = ' + JSON.stringify(framework) + ';\n');
const require = createRequire(resolve(root, 'solutions/pdfsplat/package.json'));
const { build } = await import(require.resolve('rolldown'));
await build({
  input: resolve(root, 'solutions/pdfsplat/src/app.js'),
  plugins: [{ name: 'local-versioned-imports', resolveId(source, importer) {
    if (source.startsWith('.') && source.includes('?')) return resolve(dirname(importer), source.split('?')[0]);
  } }],
  output: { file: resolve(root, 'solutions/pdfsplat/app.bundle.js'), format: 'iife', minify: true },
});
