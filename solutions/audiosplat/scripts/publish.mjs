import { cp, mkdir, readdir, rm } from 'node:fs/promises';

await rm('assets', { recursive: true, force: true });
await mkdir('assets', { recursive: true });
for (const entry of await readdir('dist/assets')) {
  await cp(`dist/assets/${entry}`, `assets/${entry}`, { recursive: true });
}
await cp('dist/index.html', 'index.html');
for (const entry of ['audiosplat-icon.svg', 'manifest.webmanifest', 'sw.js']) {
  await cp(`dist/${entry}`, entry);
}
