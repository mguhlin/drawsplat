import { cp as syncDirectory, realpath } from 'node:fs/promises';
import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
await copyFile(resolve(root, "index.vite.html"), resolve(root, "index.html"));

// npm file dependencies may be copied instead of symlinked. Always build current shared code.
const shared = resolve(root, '../shared/subtitles'), installed = resolve(root, 'node_modules/@splat/local-subtitles');
if (await realpath(shared) !== await realpath(installed)) await syncDirectory(shared, installed, { recursive: true });
