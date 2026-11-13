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
