import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
await copyFile(resolve(root, "index.vite.html"), resolve(root, "index.html"));
await mkdir(resolve(root, "public/ffmpeg"), { recursive: true });
for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  await copyFile(resolve(root, `node_modules/@ffmpeg/core/dist/esm/${file}`), resolve(root, `public/ffmpeg/${file}`));
}
