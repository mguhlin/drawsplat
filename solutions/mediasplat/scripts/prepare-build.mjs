import { cp as syncDirectory, realpath } from 'node:fs/promises';
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
await copyFile(resolve(root, "index.vite.html"), resolve(root, "index.html"));
await mkdir(resolve(root, "public/ffmpeg"), { recursive: true });
const core = await readFile(resolve(root, "node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js"), "utf8");
await writeFile(resolve(root, "public/ffmpeg/ffmpeg-core.js"), core.replace(/[ \t]+$/gm, "").trimEnd() + "\n");
const wasm = await readFile(resolve(root, "node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm"));
const midpoint = Math.ceil(wasm.length / 2);
await writeFile(resolve(root, "public/ffmpeg/ffmpeg-core.part-01"), wasm.subarray(0, midpoint));
await writeFile(resolve(root, "public/ffmpeg/ffmpeg-core.part-02"), wasm.subarray(midpoint));
await rm(resolve(root, "public/ffmpeg/ffmpeg-core.wasm"), { force: true });

// Keep the licensed subtitle font in the standalone package and build output.
for (const name of ["DejaVuSans.ttf", "FONT-LICENSE.txt"]) await copyFile(resolve(root, "ffmpeg", name), resolve(root, "public/ffmpeg", name));

// npm file dependencies may be copied instead of symlinked. Always build current shared code.
const shared = resolve(root, '../shared/subtitles'), installed = resolve(root, 'node_modules/@splat/local-subtitles');
if (await realpath(shared) !== await realpath(installed)) await syncDirectory(shared, installed, { recursive: true });
