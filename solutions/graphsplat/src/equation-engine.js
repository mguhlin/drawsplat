// SPDX-License-Identifier: AGPL-3.0-or-later
import { mathjax } from "@mathjax/src/js/mathjax.js";
import { TeX } from "@mathjax/src/js/input/tex.js";
import { SVG } from "@mathjax/src/js/output/svg.js";
import { DefaultFont } from "@mathjax/src/js/output/svg/DefaultFont.js";
import { liteAdaptor } from "@mathjax/src/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "@mathjax/src/js/handlers/html.js";
import { SerializedMmlVisitor } from "@mathjax/src/js/core/MmlTree/SerializedMmlVisitor.js";
import { STATE } from "@mathjax/src/js/core/MathItem.js";
import "@mathjax/src/js/input/tex/ams/AmsConfiguration.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const font = new DefaultFont();
// All font parts are bundled and registered at build time. No CDN or lazy fetches.
for (const part of Object.values(DefaultFont.dynamicFiles)) part.setup(font);
const input = new TeX({
  packages: ["base", "ams"],
  maxBuffer: 4096,
  maxMacros: 500,
  formatError: (_jax, error) => {
    throw Error(error.message);
  },
});
const output = new SVG({ fontCache: "none", fontData: font });
const document = mathjax.document("", { InputJax: input, OutputJax: output });
const visitor = new SerializedMmlVisitor();

export function typesetEquation(source) {
  const tex = String(source)
    .trim()
    .replace(/^\$\$([\s\S]*)\$\$$/, "$1")
    .replace(/^\$([^$]*)\$$/, "$1")
    .replace(/^\\\[([\s\S]*)\\\]$/, "$1")
    .replace(/^\\\(([\s\S]*)\\\)$/, "$1");
  if (!tex) throw Error("Enter an equation or choose an example.");
  if (tex.length > 2000)
    throw Error("Keep an equation under 2,000 characters.");
  // Do not enable document commands, URLs, styles, macro definitions, or remote packages.
  if (
    /\\(?:href|url|html\w*|class|style|cssId|require|autoload|includegraphics|unicode|def|gdef|edef|xdef|let|newcommand|renewcommand|providecommand|newenvironment|renewenvironment|label|ref|eqref|tag)\b/.test(
      tex,
    )
  )
    throw Error(
      "Use math notation only; links, styling commands, package loading, and custom macros are unavailable.",
    );
  input.reset();
  const root = document.convert(tex, { display: true, end: STATE.COMPILED });
  const mathml = visitor.visitTree(root);
  input.reset();
  const node = document.convert(tex, { display: true });
  const svg = adaptor.outerHTML(adaptor.firstChild(node));
  return { tex, mathml, svg };
}
