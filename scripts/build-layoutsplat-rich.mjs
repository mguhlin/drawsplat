import { rolldown } from '../splatworks/writesplat/node_modules/rolldown/dist/index.mjs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(new URL('../splatworks/writesplat/package.json', import.meta.url));
const build = await rolldown({ input: resolve('splatworks/layoutsplat/rich-editor-src.mjs'), plugins: [{ name: 'suite-prosemirror', resolveId(source, importer) { if (!source.startsWith('.') && !source.startsWith('/')) return (source.startsWith('prosemirror-') || !importer ? require : createRequire(importer)).resolve(source); } }] });
await build.write({ file: 'splatworks/layoutsplat/rich-editor.mjs', format: 'es', minify: true });
await build.close();
