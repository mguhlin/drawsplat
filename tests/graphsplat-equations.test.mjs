import { test } from "node:test";
import assert from "node:assert/strict";
import { typesetEquation } from "../solutions/graphsplat/vendor/equation-engine.mjs";
// GraphSplat is served as native modules, but its package intentionally keeps CommonJS tests.
import { readFile } from "node:fs/promises";
const loadSource = async (file) =>
  import(
    "data:text/javascript;base64," +
      Buffer.from(
        await readFile(new URL(file, import.meta.url), "utf8"),
      ).toString("base64")
  );
const { compileExpression } = await loadSource(
  "../solutions/graphsplat/src/math.js",
);
const { parseTable, tableToLatex, tableToMatrix, equationFromTex, latexDocument, equationMarkdown, equationHtml } = await loadSource('../solutions/graphsplat/converters.js');

test('table conversions preserve quoted delimiters, blank cells, multiline text and literal TeX characters', () => {
  const rows = parseTable('\uFEFFName,Value,Note\r\n"A, B",,"50% & \\input{x}"\r\n"Line\nTwo",2,"Say ""yes"""\n');
  assert.deepEqual(rows, [['Name','Value','Note'], ['A, B','','50% & \\input{x}'], ['Line\nTwo','2','Say "yes"']]);
  const tex = tableToLatex(rows);
  assert.match(tex, /\\toprule/);
  assert.match(tex, /50\\% \\& \\textbackslash\{\}input\\\{x\\\}/);
  assert.match(tex, /\\shortstack\[l\]\{Line\\\\Two\}/);
  assert.doesNotMatch(tex, /\\input\{x\}/);
  assert.deepEqual(parseTable('x\ty\n1\t2'), [['x','y'],['1','2']]);
  assert.deepEqual(parseTable('\n,\n1,2\n'), [['',''],['1','2']]);
});

test('malformed or oversized tables are rejected and numeric matrices render', () => {
  for (const source of ['', 'a,b\n1', '"unclosed', 'a"b,c', '"a"x,b', 'x'.repeat(20001), Array(102).fill('1,2').join('\n'), Array(13).fill('a').join(',')]) assert.throws(() => parseTable(source));
  assert.throws(() => tableToMatrix([['Name','Value']]));
  assert.match(typesetEquation(tableToMatrix(parseTable('1,2\n-3,4e2'))).mathml, /<mtable/);
  assert.match(tableToLatex([['1','2']], false), /1 & 2/);
  assert.doesNotMatch(tableToLatex([['1','2']], false), /midrule|textbf/);
});

test('TeX document export reimports one equation and rejects ambiguous documents', () => {
  const tex = String.raw`\frac{1}{2}+x^2`;
  const document = latexDocument(tex, 'A & B', '50% correct');
  assert.equal(equationFromTex(document), tex);
  assert.match(document, /A \\& B/);
  assert.match(document, /50\\% correct/);
  assert.equal(equationFromTex('x^2 % comment\n+y'), 'x^2 \n+y');
  assert.equal(equationFromTex(String.raw`50\%`), String.raw`50\%`);
  assert.match(equationFromTex(String.raw`\documentclass{article}\begin{document}\begin{align*}x&=1\\y&=2\end{align*}\end{document}`), /begin\{aligned\}/);
  for (const source of [latexDocument('x','Title').replace('\\end{document}',''), String.raw`\documentclass{article}\begin{document}\[x\]\[y\]\end{document}`, latexDocument('','Empty'), 'x'.repeat(2001)]) assert.throws(() => equationFromTex(source));
});

test('share exports escape authored text and preserve structured math without external scripts', () => {
  const result = typesetEquation('x^2');
  const html = equationHtml(result, '<script>alert(1)</script>', '<img src=x onerror=alert(1)>');
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<math/);
  assert.match(html, /<svg/);
  assert.doesNotMatch(html, /<script|<img|src="https?:/);
  assert.match(equationMarkdown('x^2', 'Test', 'Square'), /\$\$\nx\^2\n\$\$/);
});

test("equation engine emits local SVG paths and structured MathML", () => {
  const result = typesetEquation(String.raw`\frac{1}{2}+\sqrt{x_1}`);
  assert.match(result.svg, /<path/);
  assert.match(result.mathml, /<mfrac/);
  assert.match(result.mathml, /<msqrt/);
  assert.match(result.mathml, /<msub/);
  assert.doesNotMatch(result.svg, /<script|<foreignObject|href="https?:/);
});

test("errors, malicious commands and long input leave the engine reusable", () => {
  for (const source of [
    "",
    String.raw`\frac{1}{`,
    String.raw`\href{https://example.com}{x}`,
    String.raw`\require{html}`,
    String.raw`\def\x{\x}\x`,
    "x".repeat(2001),
  ])
    assert.throws(() => typesetEquation(source));
  assert.match(typesetEquation("x^2+y^2=z^2").mathml, /<msup/);
});

test("root function respects the domain of real nth roots", () => {
  assert.equal(compileExpression("root(-8,3)")({}), -2);
  assert.equal(compileExpression("root(16,2)")({}), 4);
  assert.ok(Number.isNaN(compileExpression("root(-4,2)")({})));
  assert.ok(Number.isNaN(compileExpression("root(4,0)")({})));
});
