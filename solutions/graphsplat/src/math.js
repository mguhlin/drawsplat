const factorial = (value) => {
  if (!Number.isInteger(value) || value < 0 || value > 170) return NaN;
  let result = 1;
  for (let number = 2; number <= value; number++) result *= number;
  return result;
};
const gcd = (first, second) => {
  let a = Math.abs(Math.trunc(first)),
    b = Math.abs(Math.trunc(second));
  while (b) [a, b] = [b, a % b];
  return a;
};
const mean = (...values) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
const variance = (...values) => {
  const average = mean(...values);
  return mean(...values.map((value) => (value - average) ** 2));
};
const median = (...values) => {
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
const erf = (value) => {
  const sign = Math.sign(value),
    x = Math.abs(value),
    t = 1 / (1 + 0.3275911 * x);
  return (
    sign *
    (1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
        t +
        0.254829592) *
        t *
        Math.exp(-x * x))
  );
};
const gamma = (value) => {
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019571e-6, 1.5056327351493116e-7,
  ];
  if (value < 0.5)
    return Math.PI / (Math.sin(Math.PI * value) * gamma(1 - value));
  let x = 0.9999999999998099,
    adjusted = value - 1;
  coefficients.forEach((coefficient, index) => {
    x += coefficient / (adjusted + index + 1);
  });
  const t = adjusted + coefficients.length - 0.5;
  return Math.sqrt(2 * Math.PI) * t ** (adjusted + 0.5) * Math.exp(-t) * x;
};
const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  arcsin: Math.asin,
  arccos: Math.acos,
  arctan: Math.atan,
  atan2: Math.atan2,
  cot: (value) => 1 / Math.tan(value),
  sec: (value) => 1 / Math.cos(value),
  csc: (value) => 1 / Math.sin(value),
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  asinh: Math.asinh,
  acosh: Math.acosh,
  atanh: Math.atanh,
  sech: (value) => 1 / Math.cosh(value),
  csch: (value) => 1 / Math.sinh(value),
  coth: (value) => 1 / Math.tanh(value),
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  log: Math.log10,
  logbase: (value, base) => Math.log(value) / Math.log(base),
  ln: Math.log,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  mod: (value, divisor) => ((value % divisor) + divisor) % divisor,
  clamp: (value, minimum, maximum) =>
    Math.min(maximum, Math.max(minimum, value)),
  hypot: Math.hypot,
  root: (value, degree) => Math.sign(value) * Math.abs(value) ** (1 / degree),
  factorial,
  ncr: (n, r) => factorial(n) / (factorial(r) * factorial(n - r)),
  npr: (n, r) => factorial(n) / factorial(n - r),
  gcd,
  lcm: (a, b) => Math.abs(a * b) / gcd(a, b),
  mean,
  median,
  total: (...values) => values.reduce((sum, value) => sum + value, 0),
  sum: (...values) => values.reduce((sum, value) => sum + value, 0),
  product: (...values) => values.reduce((result, value) => result * value, 1),
  variance,
  stdev: (...values) => Math.sqrt(variance(...values)),
  mad: (...values) => {
    const average = mean(...values);
    return mean(...values.map((value) => Math.abs(value - average)));
  },
  erf,
  gamma,
  min: Math.min,
  max: Math.max,
};
const CONSTANTS = {
  pi: Math.PI,
  tau: Math.PI * 2,
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2,
};

function normalize(source) {
  return source
    .trim()
    .replace(/^y\s*=\s*/i, "")
    .replace(/π/g, "pi")
    .replace(/[−–]/g, "-")
    .replace(/(\d|x|a|b|c|\))(?=(x|a|b|c|pi|e|\())/gi, "$1*")
    .replace(/(x|a|b|c|pi|e|\))(?=\d)/gi, "$1*");
}

function tokens(source) {
  const output = [],
    pattern = /\s*(?:(\d*\.?\d+(?:e[+-]?\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|(.))/gy;
  let match;
  while ((match = pattern.exec(source))) {
    if (match[1]) output.push({ type: "number", value: Number(match[1]) });
    else if (match[2])
      output.push({ type: "name", value: match[2].toLowerCase() });
    else if ("+-*/^(),".includes(match[3]))
      output.push({ type: match[3], value: match[3] });
    else throw new Error(`Unsupported character: ${match[3]}`);
  }
  output.push({ type: "end" });
  return output;
}

export function compileExpression(source, { degrees = false } = {}) {
  const domainText = (source.match(/\{([^}]+)\}/) || [])[1] || "";
  source = normalize(source.replace(/\{[^}]+\}/g, ""));
  const list = tokens(source);
  let at = 0;
  const peek = () => list[at],
    take = (type) => {
      if (peek().type !== type) throw new Error(`Expected ${type}`);
      return list[at++];
    };
  function primary() {
    const token = peek();
    if (token.type === "number") {
      at++;
      return () => token.value;
    }
    if (token.type === "name") {
      at++;
      const name = token.value;
      if (peek().type === "(") {
        take("(");
        const args = [];
        if (peek().type !== ")") {
          args.push(expression());
          while (peek().type === ",") {
            take(",");
            args.push(expression());
          }
        }
        take(")");
        if (!FUNCTIONS[name]) throw new Error(`Unknown function: ${name}`);
        return (vars) => {
          const values = args.map((fn) => fn(vars));
          if (degrees && ["sin", "cos", "tan"].includes(name))
            values[0] = (values[0] * Math.PI) / 180;
          return FUNCTIONS[name](...values);
        };
      }
      if (!["x", "a", "b", "c"].includes(name) && !(name in CONSTANTS))
        throw new Error(`Unknown value: ${name}`);
      return (vars) => (name in CONSTANTS ? CONSTANTS[name] : vars[name]);
    }
    if (token.type === "(") {
      take("(");
      const value = expression();
      take(")");
      return value;
    }
    throw new Error("Expected a number, variable, or function");
  }
  function unary() {
    if (peek().type === "+") {
      take("+");
      return unary();
    }
    if (peek().type === "-") {
      take("-");
      const value = unary();
      return (vars) => -value(vars);
    }
    return primary();
  }
  function power() {
    let left = unary();
    if (peek().type === "^") {
      take("^");
      const right = power(),
        prior = left;
      left = (vars) => Math.pow(prior(vars), right(vars));
    }
    return left;
  }
  function product() {
    let left = power();
    while (peek().type === "*" || peek().type === "/") {
      const op = take(peek().type).type,
        right = power(),
        prior = left;
      left =
        op === "*"
          ? (vars) => prior(vars) * right(vars)
          : (vars) => prior(vars) / right(vars);
    }
    return left;
  }
  function expression() {
    let left = product();
    while (peek().type === "+" || peek().type === "-") {
      const op = take(peek().type).type,
        right = product(),
        prior = left;
      left =
        op === "+"
          ? (vars) => prior(vars) + right(vars)
          : (vars) => prior(vars) - right(vars);
    }
    return left;
  }
  const evaluate = expression();
  if (peek().type !== "end") throw new Error("Unexpected expression content");
  let domain = () => true;
  if (domainText) {
    const match = domainText.match(
      /^\s*x\s*(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)\s*$/,
    );
    if (!match) throw new Error("Domain restrictions use forms like {x>0}");
    const limit = Number(match[2]);
    domain =
      match[1] === "<"
        ? (x) => x < limit
        : match[1] === ">"
          ? (x) => x > limit
          : match[1] === "<="
            ? (x) => x <= limit
            : (x) => x >= limit;
  }
  return (vars) => (domain(vars.x) ? evaluate(vars) : NaN);
}

export function sampleFunction(fn, min, max, count, vars) {
  const points = [];
  for (let i = 0; i <= count; i++) {
    const x = min + ((max - min) * i) / count,
      y = fn({ ...vars, x });
    points.push({ x, y: Number.isFinite(y) ? y : NaN });
  }
  return points;
}

export function findRoots(points) {
  const roots = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    if (!Number.isFinite(a.y) || !Number.isFinite(b.y)) continue;
    if (a.y === 0 || a.y * b.y < 0) {
      const x = a.y === 0 ? a.x : a.x + ((b.x - a.x) * -a.y) / (b.y - a.y);
      if (!roots.some((root) => Math.abs(root - x) < 0.05)) roots.push(x);
    }
  }
  return roots;
}

export function findIntersections(series) {
  const hits = [];
  for (let a = 0; a < series.length; a++)
    for (let b = a + 1; b < series.length; b++)
      for (let i = 1; i < series[a].length; i++) {
        const p = series[a][i - 1],
          q = series[a][i],
          r = series[b][i - 1],
          s = series[b][i];
        if (![p.y, q.y, r.y, s.y].every(Number.isFinite)) continue;
        const d1 = p.y - r.y,
          d2 = q.y - s.y;
        if (d1 === 0 || d1 * d2 < 0) {
          const ratio =
              d1 === 0 ? 0 : Math.abs(d1) / (Math.abs(d1) + Math.abs(d2)),
            x = p.x + (q.x - p.x) * ratio,
            y = p.y + (q.y - p.y) * ratio;
          if (!hits.some((hit) => Math.hypot(hit.x - x, hit.y - y) < 0.12))
            hits.push({ x, y });
        }
      }
  return hits.slice(0, 30);
}
