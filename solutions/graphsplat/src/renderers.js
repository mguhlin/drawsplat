import {
  compileExpression,
  sampleFunction,
  findRoots,
  findIntersections,
} from "./math.js";
export const PALETTE = [
  "#6d38e8",
  "#f59e0b",
  "#2563eb",
  "#16a34a",
  "#ef4444",
  "#0891b2",
  "#db2777",
  "#64748b",
];
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char],
  );
const n = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
export function parseRows(text) {
  return text
    .trim()
    .split(/\n+/)
    .map((line) => {
      const parts = line.split(/\t|,/).map((item) => item.trim());
      return {
        label: parts.shift() || "Item",
        values: parts.map(Number).filter(Number.isFinite),
      };
    })
    .filter((row) => row.values.length);
}
function niceMax(value) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value)),
    unit = value / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
}
function svgShell(
  body,
  settings,
  { width = 900, height = 620, defs = "" } = {},
) {
  const title = esc(settings.title),
    source = esc(settings.source),
    background = settings.background,
    ink = settings.ink || "#172033";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="graph-title graph-desc"><title id="graph-title">${title || "Graph"}</title><desc id="graph-desc">${esc(settings.description || "Graph created with GraphSplat")}</desc><defs><pattern id="diagonal" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-2 2L2-2M0 8L8 0M6 10l4-4" stroke="currentColor" stroke-width="2" opacity=".35"/></pattern>${defs}</defs><rect width="${width}" height="${height}" fill="${background}"/>${title ? `<text x="${width / 2}" y="42" text-anchor="middle" font-family="system-ui,sans-serif" font-size="25" font-weight="800" fill="${ink}">${title}</text>` : ""}${body}${source ? `<text x="${width - 30}" y="${height - 16}" text-anchor="end" font-family="system-ui,sans-serif" font-size="12" fill="${ink}" opacity=".72">Source: ${source}</text>` : ""}</svg>`;
}
function axisFrame(
  settings,
  {
    left = 78,
    right = 35,
    top = 70,
    bottom = 80,
    width = 900,
    height = 620,
    max = 10,
    min = 0,
  } = {},
) {
  const w = width - left - right,
    h = height - top - bottom,
    ink = settings.ink || "#172033",
    grid = settings.grid;
  let content = "";
  for (let i = 0; i <= 5; i++) {
    const y = top + h - (h * i) / 5,
      value = min + ((max - min) * i) / 5;
    if (grid)
      content += `<line x1="${left}" y1="${y}" x2="${left + w}" y2="${y}" stroke="${ink}" opacity=".12"/>`;
    content += `<text x="${left - 10}" y="${y + 4}" text-anchor="end" font-size="12" fill="${ink}">${Math.round(value * 100) / 100}</text>`;
  }
  content += `<path d="M${left} ${top}V${top + h}H${left + w}" fill="none" stroke="${ink}" stroke-width="2"/>`;
  if (settings.xLabel)
    content += `<text x="${left + w / 2}" y="${height - 28}" text-anchor="middle" font-size="15" fill="${ink}">${esc(settings.xLabel)}</text>`;
  if (settings.yLabel)
    content += `<text x="20" y="${top + h / 2}" text-anchor="middle" font-size="15" fill="${ink}" transform="rotate(-90 20 ${top + h / 2})">${esc(settings.yLabel)}</text>`;
  return {
    content,
    left,
    top,
    w,
    h,
    y: (value) => top + h - ((value - min) / (max - min || 1)) * h,
  };
}

export function renderQuick(type, rows, settings) {
  if (!rows.length)
    return svgShell(
      `<text x="450" y="310" text-anchor="middle">Add numeric data to begin.</text>`,
      settings,
    );
  if (type === "scatter") return renderScatter(rows, settings);
  const colors = settings.colors,
    max = niceMax(Math.max(...rows.flatMap((row) => row.values), 1));
  if (type === "pie" || type === "donut") {
    const total =
        rows.reduce((sum, row) => sum + Math.max(0, row.values[0]), 0) || 1,
      cx = 390,
      cy = 315,
      r = 190;
    let angle = -Math.PI / 2,
      body = "";
    rows.forEach((row, index) => {
      const part = Math.max(0, row.values[0]) / total,
        next = angle + part * Math.PI * 2,
        x1 = cx + Math.cos(angle) * r,
        y1 = cy + Math.sin(angle) * r,
        x2 = cx + Math.cos(next) * r,
        y2 = cy + Math.sin(next) * r,
        large = part > 0.5 ? 1 : 0,
        color = colors[index % colors.length];
      body += `<path d="M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 ${large} 1 ${x2} ${y2}Z" fill="${color}"/>`;
      angle = next;
    });
    if (type === "donut")
      body += `<circle cx="${cx}" cy="${cy}" r="92" fill="${settings.background}"/>`;
    body += legend(rows, colors, 650, 125, settings);
    return svgShell(body, settings);
  }
  if (type === "hbar") {
    const left = 165,
      top = 80,
      w = 675,
      rowH = Math.min(72, 440 / rows.length),
      body = rows
        .map((row, index) => {
          const y = top + index * rowH,
            width = (w * Math.max(0, row.values[0])) / max,
            color = colors[index % colors.length];
          return `<text x="${left - 12}" y="${y + rowH * 0.58}" text-anchor="end" font-size="14">${esc(row.label)}</text><rect data-drag-row="${index}" data-drag-series="0" data-drag-axis="x" x="${left}" y="${y + 8}" width="${width}" height="${rowH - 16}" rx="8" fill="${color}"/>${settings.numbers ? `<text x="${left + width + 8}" y="${y + rowH * 0.58}" font-size="13">${row.values[0]}</text>` : ""}`;
        })
        .join("");
    return svgShell(body, settings);
  }
  const frame = axisFrame(settings, { max }),
    slot = frame.w / rows.length;
  let body = frame.content;
  body += rows
    .map(
      (row, index) =>
        `<text x="${frame.left + slot * (index + 0.5)}" y="${frame.top + frame.h + 22}" text-anchor="middle" font-size="12">${esc(row.label)}</text>`,
    )
    .join("");
  if (type === "bar") {
    const seriesCount = Math.max(...rows.map((row) => row.values.length)),
      groupWidth = slot * 0.72,
      barWidth = groupWidth / seriesCount;
    rows.forEach((row, index) =>
      row.values.forEach((value, series) => {
        const y = frame.y(Math.max(0, value)),
          height = frame.top + frame.h - y,
          color = colors[series % colors.length],
          fill = settings.patterns ? `url(#diagonal)` : color,
          x = frame.left + slot * index + slot * 0.14 + barWidth * series;
        body += `<g color="${color}"><rect data-drag-row="${index}" data-drag-series="${series}" data-drag-axis="y" x="${x}" y="${y}" width="${Math.max(2, barWidth - 2)}" height="${height}" rx="4" fill="${fill}" stroke="${color}"/>${settings.numbers ? `<text x="${x + barWidth / 2}" y="${y - 7}" text-anchor="middle" font-size="11">${value}</text>` : ""}</g>`;
      }),
    );
  } else {
    const seriesCount = Math.max(...rows.map((row) => row.values.length));
    for (let series = 0; series < seriesCount; series++) {
      const points = rows
          .map((row, index) =>
            row.values[series] === undefined
              ? null
              : [
                  frame.left + slot * (index + 0.5),
                  frame.y(row.values[series]),
                ],
          )
          .filter(Boolean),
        path = points
          .map((point, index) => `${index ? "L" : "M"}${point[0]} ${point[1]}`)
          .join(" "),
        color = colors[series % colors.length];
      if (!points.length) continue;
      if (type === "area")
        body += `<path d="${path}L${points.at(-1)[0]} ${frame.top + frame.h}L${points[0][0]} ${frame.top + frame.h}Z" fill="${color}" opacity=".18"/>`;
      body += `<path d="${path}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>`;
      body += points
        .map(
          (point) =>
            `<circle cx="${point[0]}" cy="${point[1]}" r="5" fill="${color}"/>`,
        )
        .join("");
    }
  }
  return svgShell(body, settings);
}

function renderScatter(rows, settings) {
  const points = rows.filter((row) => row.values.length > 1);
  if (!points.length)
    return svgShell(
      `<text x="450" y="310" text-anchor="middle">Use label,x,y for scatter data.</text>`,
      settings,
    );
  const xs = points.map((row) => row.values[0]),
    ys = points.map((row) => row.values[1]),
    minX = Math.min(...xs, 0),
    maxX = niceMax(Math.max(...xs, 1)),
    minY = Math.min(...ys, 0),
    maxY = niceMax(Math.max(...ys, 1)),
    left = 78,
    top = 70,
    w = 787,
    h = 470,
    sx = (x) => left + ((x - minX) / (maxX - minX || 1)) * w,
    sy = (y) => top + h - ((y - minY) / (maxY - minY || 1)) * h,
    ink = settings.ink || "#172033";
  let body = `<path d="M${left} ${top}V${top + h}H${left + w}" fill="none" stroke="${ink}" stroke-width="2"/>`;
  points.forEach((row, index) => {
    body += `<circle cx="${sx(row.values[0])}" cy="${sy(row.values[1])}" r="8" fill="${settings.colors[index % settings.colors.length]}"/><text x="${sx(row.values[0]) + 11}" y="${sy(row.values[1]) - 8}" font-size="12" fill="${ink}">${esc(row.label)}</text>`;
  });
  return svgShell(body, settings);
}

function legend(rows, colors, x, y, settings) {
  if (!settings.legend) return "";
  return rows
    .map(
      (row, index) =>
        `<rect x="${x}" y="${y + index * 34}" width="18" height="18" rx="3" fill="${colors[index % colors.length]}"/><text x="${x + 27}" y="${y + index * 34 + 14}" font-size="14">${esc(row.label)} (${row.values[0]})</text>`,
    )
    .join("");
}

export function renderPicture(rows, key, settings, { showValues, showKey }) {
  const left = 190,
    top = 78,
    rowH = Math.min(82, 440 / Math.max(rows.length, 1)),
    maxIcons = Math.max(...rows.map((row) => row.value / key), 1),
    available = 650,
    iconSize = Math.min(54, available / (maxIcons + 1)),
    defs = [],
    body = [];
  rows.forEach((row, index) => {
    const count = Math.max(0, row.value / key),
      whole = Math.floor(count),
      fraction = count - whole,
      y = top + index * rowH + rowH / 2,
      label = esc(row.label);
    body.push(
      `<text x="${left - 16}" y="${y + 6}" text-anchor="end" font-size="15" font-weight="700">${label}</text>`,
    );
    for (let i = 0; i < whole + (fraction > 0.001 ? 1 : 0); i++) {
      const x = left + i * iconSize,
        isPartial = i === whole && fraction > 0.001,
        clip = `clip-${index}-${i}`;
      if (isPartial)
        defs.push(
          `<clipPath id="${clip}"><rect x="${x}" y="${y - iconSize * 0.42}" width="${iconSize * fraction}" height="${iconSize}"/></clipPath>`,
        );
      const content = row.image
        ? `<image href="${esc(row.image)}" x="${x}" y="${y - iconSize * 0.42}" width="${iconSize * 0.88}" height="${iconSize * 0.88}" preserveAspectRatio="xMidYMid meet"/>`
        : `<text x="${x + iconSize * 0.42}" y="${y + iconSize * 0.28}" text-anchor="middle" font-size="${iconSize * 0.72}">${esc(row.icon || "●")}</text>`;
      body.push(
        `<g data-drag-row="${index}" data-drag-series="0" data-drag-axis="y"${isPartial ? ` clip-path="url(#${clip})"` : ""}>${content}</g>`,
      );
    }
    if (showValues)
      body.push(
        `<text x="${left + Math.ceil(count) * iconSize + 8}" y="${y + 5}" font-size="14">${row.value}</text>`,
      );
  });
  if (showKey) {
    const sample = rows[0] || { icon: "●", image: "" },
      content = sample.image
        ? `<image href="${esc(sample.image)}" x="${left}" y="550" width="30" height="30"/>`
        : `<text x="${left + 14}" y="574" text-anchor="middle" font-size="28">${esc(sample.icon)}</text>`;
    body.push(
      `${content}<text x="${left + 42}" y="571" font-size="14">= ${key}</text>`,
    );
  }
  return svgShell(body.join(""), settings, { defs: defs.join("") });
}

function coordinateBase(settings) {
  const width = 900,
    height = 700,
    left = 65,
    right = 35,
    top = 68,
    bottom = 55,
    w = width - left - right,
    h = height - top - bottom,
    minX = settings.xMin,
    maxX = settings.xMax,
    minY = settings.yMin,
    maxY = settings.yMax,
    sx = (x) => left + ((x - minX) / (maxX - minX)) * w,
    sy = (y) => top + h - ((y - minY) / (maxY - minY)) * h,
    ink = settings.ink || "#172033";
  let body = "";
  const step = Math.max(0.1, settings.step);
  if (settings.grid)
    for (let x = Math.ceil(minX / step) * step; x <= maxX; x += step)
      body += `<line x1="${sx(x)}" y1="${top}" x2="${sx(x)}" y2="${top + h}" stroke="${ink}" opacity=".1"/>`;
  if (settings.grid)
    for (let y = Math.ceil(minY / step) * step; y <= maxY; y += step)
      body += `<line x1="${left}" y1="${sy(y)}" x2="${left + w}" y2="${sy(y)}" stroke="${ink}" opacity=".1"/>`;
  const axisY = minY <= 0 && maxY >= 0 ? sy(0) : top + h,
    axisX = minX <= 0 && maxX >= 0 ? sx(0) : left;
  body += `<path d="M${left} ${axisY}H${left + w}M${axisX} ${top + h}V${top}" stroke="${ink}" stroke-width="2"/>`;
  if (settings.numbers) {
    for (let x = Math.ceil(minX / step) * step; x <= maxX; x += step)
      if (Math.abs(x) > 0.0001)
        body += `<text x="${sx(x)}" y="${axisY + 18}" text-anchor="middle" font-size="10">${Math.round(x * 100) / 100}</text>`;
    for (let y = Math.ceil(minY / step) * step; y <= maxY; y += step)
      if (Math.abs(y) > 0.0001)
        body += `<text x="${axisX - 8}" y="${sy(y) + 4}" text-anchor="end" font-size="10">${Math.round(y * 100) / 100}</text>`;
  }
  return { body, sx, sy, left, top, w, h, width, height };
}

export function renderCoordinate(
  points,
  settings,
  { connect, labels, line, slope, intercept },
) {
  const base = coordinateBase(settings),
    colors = settings.colors;
  let body = base.body;
  if (line) {
    const y1 = slope * settings.xMin + intercept,
      y2 = slope * settings.xMax + intercept;
    body += `<line x1="${base.sx(settings.xMin)}" y1="${base.sy(y1)}" x2="${base.sx(settings.xMax)}" y2="${base.sy(y2)}" stroke="${colors[1]}" stroke-width="4" clip-path="url(#plotClip)"/>`;
  }
  if (connect && points.length)
    body += `<polyline points="${points.map((point) => `${base.sx(point.x)},${base.sy(point.y)}`).join(" ")}" fill="none" stroke="${colors[0]}" stroke-width="3"/>`;
  points.forEach((point, index) => {
    const x = base.sx(point.x),
      y = base.sy(point.y);
    body += `<circle cx="${x}" cy="${y}" r="7" fill="${colors[index % colors.length]}"/>${labels ? `<text x="${x + 9}" y="${y - 9}" font-size="12">${esc(point.label || `(${point.x}, ${point.y})`)}</text>` : ""}`;
  });
  return svgShell(body, settings, {
    width: base.width,
    height: base.height,
    defs: `<clipPath id="plotClip"><rect x="${base.left}" y="${base.top}" width="${base.w}" height="${base.h}"/></clipPath>`,
  });
}

export function renderExpressions(
  sources,
  settings,
  params,
  { degrees, roots, intersections },
) {
  const base = coordinateBase(settings),
    series = [],
    errors = [];
  sources.forEach((source) => {
    try {
      const fn = compileExpression(source, { degrees });
      series.push({
        source,
        fn,
        points: sampleFunction(fn, settings.xMin, settings.xMax, 900, params),
      });
    } catch (error) {
      errors.push(`${source}: ${error.message}`);
    }
  });
  let body = base.body;
  series.forEach((item, index) => {
    let path = "",
      drawing = false;
    item.points.forEach((point) => {
      if (
        !Number.isFinite(point.y) ||
        point.y < settings.yMin - (settings.yMax - settings.yMin) * 2 ||
        point.y > settings.yMax + (settings.yMax - settings.yMin) * 2
      ) {
        drawing = false;
        return;
      }
      path += `${drawing ? "L" : "M"}${base.sx(point.x).toFixed(2)} ${base.sy(point.y).toFixed(2)} `;
      drawing = true;
    });
    body += `<path d="${path}" fill="none" stroke="${settings.colors[index % settings.colors.length]}" stroke-width="4" clip-path="url(#plotClip)"/>`;
    if (roots)
      findRoots(item.points).forEach((root) => {
        if (root >= settings.xMin && root <= settings.xMax)
          body += `<circle cx="${base.sx(root)}" cy="${base.sy(0)}" r="5" fill="${settings.colors[index % settings.colors.length]}"/><text x="${base.sx(root)}" y="${base.sy(0) - 9}" text-anchor="middle" font-size="10">${root.toFixed(2)}</text>`;
      });
  });
  if (intersections)
    findIntersections(series.map((item) => item.points)).forEach(
      (hit) =>
        (body += `<circle cx="${base.sx(hit.x)}" cy="${base.sy(hit.y)}" r="6" fill="#f59e0b" stroke="#fff" stroke-width="2"/><text x="${base.sx(hit.x) + 8}" y="${base.sy(hit.y) - 8}" font-size="10">(${hit.x.toFixed(2)}, ${hit.y.toFixed(2)})</text>`),
    );
  if (settings.legend)
    body += series
      .map(
        (item, index) =>
          `<rect x="${base.left + 12}" y="${base.top + 12 + index * 27}" width="18" height="5" fill="${settings.colors[index % settings.colors.length]}"/><text x="${base.left + 38}" y="${base.top + 19 + index * 27}" font-size="12">${esc(item.source)}</text>`,
      )
      .join("");
  return {
    svg: svgShell(body, settings, {
      width: base.width,
      height: base.height,
      defs: `<clipPath id="plotClip"><rect x="${base.left}" y="${base.top}" width="${base.w}" height="${base.h}"/></clipPath>`,
    }),
    series,
    errors,
    base,
  };
}

export function renderSpecialty(type, rows, settings) {
  if (!rows.length) return svgShell("", settings);
  if (type === "pyramid") {
    const max = Math.max(...rows.map((row) => row.values[0]), 1),
      body = rows
        .map((row, index) => {
          const width = (650 * row.values[0]) / max,
            y = 90 + index * (450 / rows.length),
            h = 420 / rows.length;
          return `<path d="M450 ${y}L${450 + width / 2} ${y + h - 4}H${450 - width / 2}Z" fill="${settings.colors[index % settings.colors.length]}"/><text x="450" y="${y + h * 0.68}" text-anchor="middle" fill="#fff" font-weight="700">${esc(row.label)} · ${row.values[0]}</text>`;
        })
        .join("");
    return svgShell(body, settings);
  }
  if (type === "radar" || type === "polar") {
    const cx = 450,
      cy = 330,
      r = 220,
      max = niceMax(Math.max(...rows.map((row) => row.values[0]), 1)),
      angles = rows.map(
        (_, i) => -Math.PI / 2 + (i * Math.PI * 2) / rows.length,
      );
    let body = "";
    for (let ring = 1; ring <= 5; ring++)
      body += `<polygon points="${angles.map((a) => `${cx + (Math.cos(a) * r * ring) / 5},${cy + (Math.sin(a) * r * ring) / 5}`).join(" ")}" fill="none" stroke="#64748b" opacity=".25"/>`;
    angles.forEach(
      (a, i) =>
        (body += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * r}" y2="${cy + Math.sin(a) * r}" stroke="#64748b" opacity=".25"/><text x="${cx + Math.cos(a) * (r + 26)}" y="${cy + Math.sin(a) * (r + 26)}" text-anchor="middle" font-size="12">${esc(rows[i].label)}</text>`),
    );
    body += `<polygon points="${angles.map((a, i) => `${cx + (Math.cos(a) * r * rows[i].values[0]) / max},${cy + (Math.sin(a) * r * rows[i].values[0]) / max}`).join(" ")}" fill="${settings.colors[0]}" fill-opacity=".28" stroke="${settings.colors[0]}" stroke-width="4"/>`;
    return svgShell(body, settings);
  }
  if (type === "bubble") {
    const frame = axisFrame(settings, {
        max: niceMax(Math.max(...rows.flatMap((row) => row.values), 1)),
      }),
      body =
        frame.content +
        rows
          .map((row, index) => {
            const x = frame.left + (frame.w * (index + 0.5)) / rows.length,
              y = frame.y(row.values[0]),
              radius =
                12 + Math.sqrt(Math.max(0, row.values[1] ?? row.values[0])) * 5;
            return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${settings.colors[index % settings.colors.length]}" opacity=".72"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11">${esc(row.label)}</text>`;
          })
          .join("");
    return svgShell(body, settings);
  }
  const max = niceMax(
      Math.max(...rows.map((row) => row.values.reduce((a, b) => a + b, 0)), 1),
    ),
    frame = axisFrame(settings, { max }),
    slot = frame.w / rows.length;
  let body = frame.content;
  if (type === "stackedArea") {
    const seriesCount = Math.max(...rows.map((row) => row.values.length));
    let lower = rows.map(() => 0);
    for (let series = 0; series < seriesCount; series++) {
      const upper = rows.map(
          (row, index) => lower[index] + Math.max(0, row.values[series] || 0),
        ),
        topPoints = upper.map(
          (value, index) =>
            `${frame.left + slot * (index + 0.5)},${frame.y(value)}`,
        ),
        bottomPoints = lower
          .map(
            (value, index) =>
              `${frame.left + slot * (index + 0.5)},${frame.y(value)}`,
          )
          .reverse();
      body += `<polygon points="${[...topPoints, ...bottomPoints].join(" ")}" fill="${settings.colors[series % settings.colors.length]}" opacity=".78"/>`;
      lower = upper;
    }
    rows.forEach((row, index) => {
      body += `<text x="${frame.left + slot * (index + 0.5)}" y="${frame.top + frame.h + 20}" text-anchor="middle" font-size="11">${esc(row.label)}</text>`;
    });
    return svgShell(body, settings);
  }
  rows.forEach((row, index) => {
    let cumulative = 0;
    row.values.forEach((value, series) => {
      const y = frame.y(cumulative + value),
        height = frame.y(cumulative) - y;
      body += `<rect x="${frame.left + index * slot + slot * 0.18}" y="${y}" width="${slot * 0.64}" height="${height}" fill="${settings.colors[series % settings.colors.length]}"/>`;
      cumulative += value;
    });
    body += `<text x="${frame.left + slot * (index + 0.5)}" y="${frame.top + frame.h + 20}" text-anchor="middle" font-size="11">${esc(row.label)}</text>`;
  });
  return svgShell(body, settings);
}

export function accessibleTable(rows) {
  const columns = Math.max(1, ...rows.map((row) => row.values.length));
  return [
    [
      "Category",
      ...Array.from({ length: columns }, (_, i) => `Series ${i + 1}`),
    ],
    ...rows.map((row) => [
      row.label,
      ...Array.from({ length: columns }, (_, i) => row.values[i] ?? ""),
    ]),
  ];
}
