import { rolldown } from '../splatworks/writesplat/node_modules/rolldown/dist/index.mjs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const build = await rolldown({ input: resolve('splatworks/layoutsplat/suite-data-src.mjs'), plugins: [{ name: 'suite-data-dependencies', resolveId(source, importer) { if (!source.startsWith('.') && !source.startsWith('/')) return createRequire(importer).resolve(source); } }] });
await build.write({ file: 'splatworks/layoutsplat/suite-data.mjs', format: 'es', minify: true });
await build.close();
