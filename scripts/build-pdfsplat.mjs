import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'solutions/pdfsplat/package.json'));
const { build } = await import(require.resolve('rolldown'));
await build({
  input: resolve(root, 'solutions/pdfsplat/src/app.js'),
  plugins: [{ name: 'local-versioned-imports', resolveId(source, importer) {
    if (source.startsWith('.') && source.includes('?')) return resolve(dirname(importer), source.split('?')[0]);
  } }],
  output: { file: resolve(root, 'solutions/pdfsplat/app.bundle.js'), format: 'iife', minify: true },
});
