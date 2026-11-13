// Equation authoring is independent of the function evaluator: notation is never executed.
export const EQUATION_EXAMPLES = [
  [
    "Fraction addition",
    "Compare halves and quarters.",
    String.raw`\frac{1}{2}+\frac{1}{4}=\frac{3}{4}`,
    "One half plus one quarter equals three quarters.",
  ],
  [
    "Quadratic formula",
    "Write both roots of a quadratic.",
    String.raw`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`,
    "x equals negative b plus or minus the square root of b squared minus four a c, all divided by two a.",
  ],
  [
    "Pythagorean theorem",
    "Connect a geometric model to its equation.",
    String.raw`a^2+b^2=c^2`,
    "a squared plus b squared equals c squared.",
  ],
  [
    "Slope between two points",
    "Use subscripts and a fraction.",
    String.raw`m=\frac{y_2-y_1}{x_2-x_1}`,
    "Slope equals the change in y divided by the change in x.",
  ],
  [
    "Mean of a data set",
    "Connect a statistics formula to chart data.",
    String.raw`\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i`,
    "The mean is the sum of the values divided by the number of values.",
  ],
  [
    "Definite integral",
    "Write a calculus worked example.",
    String.raw`\int_0^1 x^2\,dx=\frac{1}{3}`,
    "The integral of x squared from zero to one equals one third.",
  ],
  [
    "Aligned equation steps",
    "Prepare the steps of an algebra explanation.",
    String.raw`\begin{aligned}2x+3&=11\\2x&=8\\x&=4\end{aligned}`,
    "Two x plus three equals eleven. Subtract three from both sides. Two x equals eight. Divide both sides by two. x equals four.",
  ],
  [
    "Matrix and vector",
    "Typeset matrices with multiple rows.",
    String.raw`\begin{pmatrix}1&2\\3&4\end{pmatrix}\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}5\\6\end{pmatrix}`,
    "A two by two matrix with rows one two and three four times the column vector x y equals the column vector five six.",
  ],
].map(([name, description, equationTex, equationReading]) => ({
  mode: "equation",
  name,
  description,
  title: name,
  values: { equationTex, equationReading },
}));

export const EQUATION_TEMPLATES = [
  ["Fraction", String.raw`\frac{#}{2}`],
  ["Square root", String.raw`\sqrt{#}`],
  ["Power", String.raw`{#}^{2}`],
  ["Subscript", String.raw`{#}_{1}`],
  ["Pi", String.raw`\pi `],
  ["Theta", String.raw`\theta `],
  ["Multiply", String.raw`\times `],
  ["Divide", String.raw`\div `],
  ["Plus or minus", String.raw`\pm `],
  ["Less or equal", String.raw`\leq `],
  ["Greater or equal", String.raw`\geq `],
  ["Not equal", String.raw`\neq `],
  ["Angle", String.raw`\angle `],
  ["Degree", String.raw`^{\circ}`],
  ["Sum", String.raw`\sum_{i=1}^{n}{#}`],
  ["Integral", String.raw`\int_{0}^{1}{#}\,dx`],
  ["Matrix", String.raw`\begin{pmatrix}1&2\\3&4\end{pmatrix}`],
  ["Aligned steps", String.raw`\begin{aligned}x+1&=2\\x&=1\end{aligned}`],
];
let engine;
export async function renderEquationCard(source, config) {
  engine ||= import("./vendor/equation-engine.mjs");
  const { typesetEquation } = await engine;
  const result = typesetEquation(source);
  const svg = new DOMParser().parseFromString(
    result.svg,
    "image/svg+xml",
  ).documentElement;
  if (svg.localName !== "svg")
    throw Error("The equation could not be rendered.");
  const [, , w, h] = svg.getAttribute("viewBox").split(/\s+/).map(Number);
  const height = Math.min(290, (780 * h) / w),
    width = (height * w) / h;
  svg.removeAttribute("style");
  // MathJax uses em/ex lengths in a few styles. Essential glyphs use paths and presentation attributes.
  for (const node of svg.querySelectorAll("[style]"))
    node.removeAttribute("style");
  svg.setAttribute("x", String((900 - width) / 2));
  svg.setAttribute("y", String(90 + (290 - height) / 2));
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("color", config.colors[0]);
  svg.setAttribute("aria-hidden", "true");
  svg.removeAttribute("role");
  const escape = (value) =>
    String(value || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    );
  const title = escape(config.title || "Equation"),
    description = escape(config.description || result.tex);
  const card = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 440" role="img" aria-labelledby="equation-title equation-description"><title id="equation-title">${title}</title><desc id="equation-description">${description}</desc><rect width="900" height="440" fill="${config.background}"/><text x="450" y="48" text-anchor="middle" font-family="system-ui,sans-serif" font-size="25" font-weight="700" fill="${config.ink}">${title}</text>${new XMLSerializer().serializeToString(svg)}${config.source ? `<text x="870" y="420" text-anchor="end" font-family="system-ui,sans-serif" font-size="12" fill="${config.ink}">${escape(config.source)}</text>` : ""}</svg>`;
  return { ...result, svg: card };
}
