import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(await readFile(path.join(root, "data/drawsplat-tools.json"), "utf8"));
const failures = [], ids = new Set(), categories = new Set(registry.categories?.map((category) => category.id));
if (registry.version !== 1) failures.push("Registry version must be 1.");
for (const tool of registry.tools || []) {
  if (ids.has(tool.id)) failures.push(`Duplicate ID: ${tool.id}`); ids.add(tool.id);
  for (const field of ["id", "name", "description", "url", "icon", "type"]) if (!tool[field]) failures.push(`${tool.id || "unknown"} is missing ${field}.`);
  for (const category of tool.categories || []) if (!categories.has(category)) failures.push(`${tool.id} has unknown category ${category}.`);
  for (const value of [tool.url, tool.icon]) {
    if (!value?.startsWith("/")) { failures.push(`${tool.id} path is not root-relative: ${value}`); continue; }
    const local = path.join(root, value.slice(1));
    try { const info = await stat(local); if (value.endsWith("/") && !info.isDirectory()) failures.push(`${tool.id} URL is not a directory: ${value}`); }
    catch { failures.push(`${tool.id} path does not exist: ${value}`); }
  }
}
for (const tool of registry.tools || []) for (const related of tool.related || []) if (!ids.has(related)) failures.push(`${tool.id} references unknown related ID ${related}.`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Validated ${registry.tools.length} destinations, ${categories.size} categories, and all related IDs and local paths.`);
