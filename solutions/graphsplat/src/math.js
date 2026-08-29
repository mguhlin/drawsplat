const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: Math.log10,
  ln: Math.log,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  min: Math.min,
  max: Math.max,
};
const CONSTANTS = { pi: Math.PI, e: Math.E };

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
