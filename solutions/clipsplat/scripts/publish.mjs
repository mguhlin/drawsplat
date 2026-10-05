import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
// These are this app's generated assets; rebuild from dist on every publication.
await rm('assets', { recursive: true, force: true });
await mkdir('assets', { recursive: true });
await cp('dist/assets', 'assets', { recursive: true });
await copyFile('dist/index.vite.html', 'index.html');
