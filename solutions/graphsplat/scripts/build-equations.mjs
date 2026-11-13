import { build } from "esbuild";
import { readdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const fontDir = new URL(
  "../node_modules/@mathjax/mathjax-newcm-font/mjs/svg/dynamic/",
  import.meta.url,
);
const imports = (await readdir(fontDir))
  .filter((name) => name.endsWith(".js"))
  .sort()
  .map(
    (name) => `import '@mathjax/mathjax-newcm-font/mjs/svg/dynamic/${name}';`,
  )
  .join("\n");
await build({
  stdin: {
    contents:
      imports +
      "\n" +
      (await readFile(root + "src/equation-engine.js", "utf8")),
    resolveDir: root,
    sourcefile: "equation-engine.js",
  },
  outfile: root + "vendor/equation-engine.mjs",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  legalComments: "eof",
  banner: {
    js: "// MathJax 4.1.3 and New Computer Modern fonts; see MATHJAX-NOTICE.md and bundled licenses.",
  },
});
await copyFile(
  root + "node_modules/@mathjax/src/LICENSE",
  root + "vendor/MathJax-LICENSE.txt",
);
await copyFile(
  root + "node_modules/@mathjax/src/LICENSE",
  root + "vendor/MathJax-font-LICENSE.txt",
);
console.log("Built local equation engine with all SVG font parts.");
