import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
await copyFile(resolve(root, "index.vite.html"), resolve(root, "index.html"));
