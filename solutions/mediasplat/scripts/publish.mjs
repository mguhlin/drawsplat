import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."); const dist = resolve(root, "dist");
await rm(resolve(root, "assets"), { recursive: true, force: true });
await rm(resolve(root, "ffmpeg"), { recursive: true, force: true });
await mkdir(resolve(root, "assets"), { recursive: true });
await cp(resolve(dist, "assets"), resolve(root, "assets"), { recursive: true });
await cp(resolve(dist, "ffmpeg"), resolve(root, "ffmpeg"), { recursive: true });
for (const file of ["index.html", "manifest.webmanifest", "icon.svg", "sw.js"]) await copyFile(resolve(dist, file), resolve(root, file));
