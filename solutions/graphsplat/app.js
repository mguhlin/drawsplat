import {
  parseRows,
  renderQuick,
  renderPicture,
  renderCoordinate,
  renderGeometry,
  renderExpressions,
  renderSpecialty,
  accessibleTable,
  PALETTE,
} from "./src/renderers.js";
const $ = (id) => document.getElementById(id),
  STORAGE = "graphsplat.projects.v1",
  EMOJIS = [
    "🍎",
    "🍌",
    "🍊",
    "🍇",
    "🍓",
    "⭐",
    "❤️",
    "🐱",
    "🐶",
    "🚗",
    "🌳",
    "📚",
    "⚽",
    "🏀",
    "☀️",
    "🌧️",
    "🍦",
    "🎈",
    "🐟",
    "🦋",
    "🦖",
    "🚀",
    "🧪",
    "🎵",
  ];
const THEMES = {
  drawsplat: {
    colors: ["#6d38e8", "#f5b942", "#2563eb", "#16a34a", "#ef4444", "#0891b2"],
    background: "#ffffff",
    ink: "#172033",
  },
  bright: {
    colors: ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#8b5cf6", "#ec4899"],
    background: "#fffdf4",
    ink: "#172033",
  },
  pastel: {
    colors: ["#a78bfa", "#f9a8d4", "#93c5fd", "#86efac", "#fde68a", "#fdba74"],
    background: "#fffaff",
    ink: "#3f3f46",
  },
  notebook: {
    colors: ["#2563eb", "#dc2626", "#16a34a", "#7c3aed"],
    background: "#fffef7",
    ink: "#1e3a5f",
  },
  chalkboard: {
    colors: ["#fef08a", "#86efac", "#93c5fd", "#f9a8d4"],
    background: "#18352f",
    ink: "#ffffff",
  },
  highContrast: {
    colors: ["#000000", "#0057b8", "#d00000", "#007a3d", "#6f2da8"],
    background: "#ffffff",
    ink: "#000000",
  },
  printer: {
    colors: ["#111827", "#4b5563", "#6b7280", "#9ca3af"],
    background: "#ffffff",
    ink: "#000000",
  },
};
const EXAMPLES = [
  {
    mode: "quick",
    name: "Favorite subjects",
    description: "A colorful classroom bar chart.",
    values: {
      quickType: "bar",
      quickData: "Reading,18\nScience,14\nArt,21\nMath,16",
      title: "Our Favorite Subjects",
    },
  },
  {
    mode: "quick",
    name: "Weather comparison",
    description: "A two-series line chart.",
    values: {
      quickType: "line",
      quickData: "Monday,72,51\nTuesday,75,54\nWednesday,68,49\nThursday,77,56",
      title: "High and Low Temperatures",
    },
  },
  {
    mode: "picture",
    name: "Classroom pets",
    description: "A friendly animal pictograph.",
    pictureRows: [
      { label: "Dogs", value: 8, icon: "🐶", image: "" },
      { label: "Cats", value: 6, icon: "🐱", image: "" },
      { label: "Fish", value: 4, icon: "🐟", image: "" },
    ],
    title: "Our Classroom Pets",
  },
  {
    mode: "picture",
    name: "Books read",
    description: "A book represents two titles.",
    pictureRows: [
      { label: "Week 1", value: 8, icon: "📚", image: "" },
      { label: "Week 2", value: 12, icon: "📚", image: "" },
      { label: "Week 3", value: 10, icon: "📚", image: "" },
    ],
    values: { pictureKey: "2" },
    title: "Books We Read",
  },
  {
    mode: "coordinate",
    name: "Constellation",
    description: "Connected labeled coordinate points.",
    values: {
      pointData: "-6,1,A\n-3,5,B\n0,2,C\n4,6,D\n6,0,E",
      connectPoints: true,
      showPointLabels: true,
    },
    title: "Coordinate Constellation",
  },
  {
    mode: "coordinate",
    name: "Linear relationship",
    description: "Points with y = 2x + 1.",
    values: {
      pointData: "-3,-5\n-1,-1\n0,1\n2,5\n4,9",
      linearEnabled: true,
      slope: "2",
      intercept: "1",
    },
    title: "Linear Relationship",
  },
  {
    mode: "expression",
    name: "Wave lab",
    description: "Compare sine and cosine.",
    values: {
      expressions: "sin(x)\ncos(x)",
      xMin: "-7",
      xMax: "7",
      yMin: "-2",
      yMax: "2",
    },
    title: "Wave Lab",
  },
  {
    mode: "expression",
    name: "Quadratic family",
    description: "Use sliders a, b, and c.",
    values: {
      expressions: "a*x^2+b*x+c",
      paramA: "1",
      paramB: "0",
      paramC: "-4",
    },
    title: "Quadratic Family",
  },
  {
    mode: "geometry",
    name: "Triangle explorer",
    description: "Drag vertices and watch the area.",
    geometryData: "-4,-2,A\n3,-2,B\n0,4,C",
    constructions: [{ type: "polygon", points: [0, 1, 2] }],
    title: "Triangle Explorer",
  },
  {
    mode: "geometry",
    name: "Circle and radius",
    description: "A draggable center and radius point.",
    geometryData: "0,0,O\n4,0,R",
    constructions: [
      { type: "circle", points: [0, 1] },
      { type: "segment", points: [0, 1] },
    ],
    title: "Circle Explorer",
  },
  {
    mode: "specialty",
    name: "Learning skills radar",
    description: "Compare several classroom skills.",
    values: {
      specialtyType: "radar",
      specialtyData:
        "Creativity,8\nCommunication,6\nCollaboration,9\nResearch,7",
    },
    title: "Learning Skills",
  },
  {
    mode: "specialty",
    name: "Project stages",
    description: "A stacked project summary.",
    values: {
      specialtyType: "stackedBar",
      specialtyData: "Plan,3,2\nCreate,5,4\nReview,2,3\nShare,4,2",
    },
    title: "Project Stages",
  },
];
let pictureRows = [
    { label: "Apples", value: 6, icon: "🍎", image: "" },
    { label: "Bananas", value: 4, icon: "🍌", image: "" },
    { label: "Oranges", value: 3, icon: "🍊", image: "" },
  ],
  quickColors = {},
  geometryConstructions = [{ type: "polygon", points: [0, 1, 2] }],
  geometryPending = [],
  lastSvg = "",
  lastRows = [],
  expressionResult = null,
  drag = null;

function numeric(id, fallback = 0) {
  const value = Number($(id).value);
  return Number.isFinite(value) ? value : fallback;
}
function mode() {
  return $("mode").value;
}
function theme() {
  const chosen = THEMES[$("theme").value] || THEMES.drawsplat;
  return {
    ...chosen,
    colors: [
      $("primaryColor").value,
      ...chosen.colors.filter(
        (color) =>
          color.toLowerCase() !== $("primaryColor").value.toLowerCase(),
      ),
    ],
    background: $("backgroundColor").value,
  };
}
function settings() {
  const colors = theme();
  return {
    title: $("title").value.trim(),
    source: $("source").value.trim(),
    xLabel: $("xLabel").value.trim(),
    yLabel: $("yLabel").value.trim(),
    description: $("altDescription").value.trim(),
    grid: $("showGrid").checked,
    legend: $("showLegend").checked,
    numbers: $("showNumbers").checked,
    patterns: $("patterns").checked,
    xMin: numeric("xMin", -10),
    xMax: numeric("xMax", 10),
    yMin: numeric("yMin", -10),
    yMax: numeric("yMax", 10),
    step: Math.max(0.1, numeric("gridStep", 1)),
    itemColors: quickColors,
    ...colors,
  };
}
function parsePoints() {
  return $("pointData")
    .value.trim()
    .split(/\n+/)
    .map((line) => {
      const [x, y, ...label] = line.split(",");
      return { x: Number(x), y: Number(y), label: label.join(",").trim() };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}
function parseGeometryPoints() {
  return $("geometryData")
    .value.trim()
    .split(/\n+/)
    .map((line, index) => {
      const [x, y, ...label] = line.split(",");
      return {
        x: Number(x),
        y: Number(y),
        label: label.join(",").trim() || String.fromCharCode(65 + index),
      };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}
function expressionSources() {
  return $("expressions")
    .value.trim()
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function currentRows() {
  if (mode() === "picture")
    return pictureRows.map((row) => ({
      label: row.label,
      values: [row.value],
    }));
  if (mode() === "coordinate")
    return parsePoints().map((point) => ({
      label: point.label || `(${point.x}, ${point.y})`,
      values: [point.x, point.y],
    }));
  if (mode() === "geometry")
    return parseGeometryPoints().map((point) => ({
      label: point.label,
      values: [point.x, point.y],
    }));
  if (mode() === "expression")
    return expressionSources().map((source) => ({ label: source, values: [] }));
  return parseRows(
    mode() === "specialty" ? $("specialtyData").value : $("quickData").value,
  );
}
function generatedDescription(rows) {
  if (mode() === "expression")
    return `Function graph with ${rows.length} expression${rows.length === 1 ? "" : "s"}: ${rows.map((row) => row.label).join(", ")}. Window x ${$("xMin").value} to ${$("xMax").value}, y ${$("yMin").value} to ${$("yMax").value}.`;
  if (!rows.length) return "Empty graph.";
  const values = rows.flatMap((row) => row.values),
    maximum = Math.max(...values),
    minimum = Math.min(...values);
  return `${$("title").value || "Graph"}. ${rows.length} categories. Values range from ${minimum} to ${maximum}. ${rows.map((row) => `${row.label}: ${row.values.join(" and ")}`).join("; ")}.`;
}
function validateWindow(config) {
  if (config.xMax <= config.xMin || config.yMax <= config.yMin)
    throw new Error("Graph maximums must be greater than minimums.");
}
function render() {
  try {
    const config = settings();
    validateWindow(config);
    lastRows = currentRows();
    if (!$("altDescription").dataset.edited)
      $("altDescription").value = generatedDescription(lastRows);
    config.description = $("altDescription").value;
    expressionResult = null;
    if (mode() === "quick")
      lastSvg = renderQuick($("quickType").value, lastRows, config);
    else if (mode() === "picture")
      lastSvg = renderPicture(
        pictureRows,
        Math.max(0.1, numeric("pictureKey", 1)),
        config,
        {
          showValues: $("showPictureValues").checked,
          showKey: $("showPictureKey").checked,
        },
      );
    else if (mode() === "coordinate")
      lastSvg = renderCoordinate(parsePoints(), config, {
        connect: $("connectPoints").checked,
        labels: $("showPointLabels").checked,
        line: $("linearEnabled").checked,
        slope: numeric("slope", 1),
        intercept: numeric("intercept", 0),
      });
    else if (mode() === "expression") {
      expressionResult = renderExpressions(
        expressionSources(),
        config,
        {
          a: numeric("paramA", 1),
          b: numeric("paramB", 0),
          c: numeric("paramC", 0),
        },
        {
          degrees: $("degrees").checked,
          roots: $("showRoots").checked,
          intersections: $("showIntersections").checked,
        },
      );
      lastSvg = expressionResult.svg;
      if (expressionResult.errors.length)
        $("status").textContent = expressionResult.errors.join(" · ");
    } else if (mode() === "geometry")
      lastSvg = renderGeometry(
        parseGeometryPoints(),
        geometryConstructions,
        config,
        {
          labels: $("geometryLabels").checked,
          measures: $("geometryMeasures").checked,
        },
      );
    else lastSvg = renderSpecialty($("specialtyType").value, lastRows, config);
    $("canvas").innerHTML = lastSvg;
    qualityChecks(config, lastRows);
    if (!expressionResult?.errors.length)
      $("status").textContent = "Graph updated";
  } catch (error) {
    $("canvas").innerHTML = `<p>${error.message}</p>`;
    $("status").textContent = error.message;
    lastSvg = "";
  }
}
function qualityChecks(config, rows) {
  const warnings = [];
  if (!config.title) warnings.push("Add a title");
  if (
    ["quick", "coordinate", "specialty"].includes(mode()) &&
    (!config.xLabel || !config.yLabel)
  )
    warnings.push("Consider axis labels");
  if (!config.source && mode() !== "expression")
    warnings.push("Consider a source");
  if (config.background.toLowerCase() === config.colors[0].toLowerCase())
    warnings.push("Increase color contrast");
  if (!rows.length) warnings.push("Add data");
  $("checks").textContent = warnings.length
    ? `Check: ${warnings.join(" · ")}`
    : "Ready: title, data, and contrast checks passed.";
  $("checks").classList.toggle("warning", Boolean(warnings.length));
}
function syncMode() {
  document
    .querySelectorAll(".mode-controls")
    .forEach((section) => (section.hidden = true));
  $(`${mode()}Controls`).hidden = false;
  $("viewportControls").hidden = ![
    "coordinate",
    "expression",
    "geometry",
  ].includes(mode());
  if (mode() === "coordinate" && $("oneQuadrant").checked) {
    $("xMin").value = 0;
    $("yMin").value = 0;
  }
  render();
}
function syncLevel() {
  document
    .querySelectorAll(".advanced")
    .forEach((item) => (item.hidden = $("level").value !== "advanced"));
}
function safeAttribute(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}
function safeImage(value) {
  return typeof value === "string" &&
    /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value)
    ? value
    : "";
}
function renderPictureRows() {
  const container = $("pictureRows");
  container.innerHTML = "";
  pictureRows.forEach((row, index) => {
    row.image = safeImage(row.image);
    const wrapper = document.createElement("div");
    wrapper.className = "picture-row";
    wrapper.innerHTML = `<input class="emoji" aria-label="Row ${index + 1} icon" maxlength="8" value="${safeAttribute(row.icon)}"><input class="label" aria-label="Row ${index + 1} label" value="${safeAttribute(row.label)}"><input class="value" aria-label="Row ${index + 1} value" type="number" step="0.1" value="${Number(row.value) || 0}"><button class="remove" type="button" aria-label="Remove ${safeAttribute(row.label || `row ${index + 1}`)}">×</button><div class="picture-image">${row.image ? `<img src="${row.image}" alt="">` : ""}<button class="upload" type="button">${row.image ? "Replace picture" : "Use picture"}</button>${row.image ? '<button class="clear" type="button">Clear</button>' : ""}<input class="file" type="file" accept="image/png,image/jpeg,image/webp"></div>`;
    wrapper.querySelector(".emoji").oninput = (event) => {
      row.icon = event.target.value;
      row.image = "";
      renderPictureRows();
      render();
    };
    wrapper.querySelector(".label").oninput = (event) => {
      row.label = event.target.value;
      render();
    };
    wrapper.querySelector(".value").oninput = (event) => {
      row.value = Number(event.target.value) || 0;
      render();
    };
    wrapper.querySelector(".remove").onclick = () => {
      pictureRows.splice(index, 1);
      renderPictureRows();
      render();
    };
    const file = wrapper.querySelector(".file");
    wrapper.querySelector(".upload").onclick = () => file.click();
    file.onchange = () => {
      const selected = file.files[0];
      if (
        !selected ||
        !/^image\/(png|jpeg|webp)$/.test(selected.type) ||
        selected.size > 2 * 1024 * 1024
      ) {
        $("status").textContent =
          "Choose a PNG, JPEG, or WebP image under 2 MB.";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        row.image = safeImage(reader.result);
        renderPictureRows();
        render();
      };
      reader.readAsDataURL(selected);
    };
    wrapper.querySelector(".clear")?.addEventListener("click", () => {
      row.image = "";
      renderPictureRows();
      render();
    });
    container.append(wrapper);
  });
}
function seedEmojiPalette() {
  EMOJIS.forEach((emoji) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = emoji;
    button.ariaLabel = `Use ${emoji} in next picture row`;
    button.onclick = () => {
      pictureRows.push({
        label: "New category",
        value: 1,
        icon: emoji,
        image: "",
      });
      renderPictureRows();
      render();
    };
    $("emojiPalette").append(button);
  });
}
function tableHtml(table) {
  return `<table><thead><tr>${table[0].map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${table
    .slice(1)
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}
function showExpressionTable() {
  if (!expressionResult) return;
  const sources = expressionSources(),
    rows = [["x", ...sources]];
  for (
    let x = Math.ceil(numeric("xMin", -10));
    x <= Math.floor(numeric("xMax", 10));
    x += Math.max(
      1,
      Math.round((numeric("xMax", 10) - numeric("xMin", -10)) / 10),
    )
  )
    rows.push([
      x,
      ...expressionResult.series.map((item) => {
        const value = item.fn({
          x,
          a: numeric("paramA", 1),
          b: numeric("paramB"),
          c: numeric("paramC"),
        });
        return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : "—";
      }),
    ]);
  $("valueTable").innerHTML = tableHtml(rows);
  $("valueTable").hidden = !$("valueTable").hidden;
}
function dataTable() {
  return accessibleTable(lastRows);
}
async function copyDataTable() {
  const tsv = dataTable()
    .map((row) => row.join("\t"))
    .join("\n");
  try {
    await navigator.clipboard.writeText(tsv);
    $("status").textContent = "Accessible data table copied.";
  } catch {
    $("status").textContent = "Clipboard blocked. Use CSV export.";
  }
}
function filename(extension) {
  return `${
    ($("projectName").value || "graphsplat")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "graphsplat"
  }.${extension}`;
}
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function rasterBlob(type = "image/png", quality = 0.94) {
  const canvas = $("raster"),
    context = canvas.getContext("2d"),
    image = new Image(),
    viewBox = lastSvg.match(/viewBox="[^"]*?([\d.]+)\s+([\d.]+)"/),
    width = Number(viewBox?.[1]) || 900,
    height = Number(viewBox?.[2]) || 620,
    blob = new Blob([lastSvg], { type: "image/svg+xml" }),
    url = URL.createObjectURL(blob);
  canvas.width = width * 2;
  canvas.height = height * 2;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = url;
  });
  context.fillStyle = $("backgroundColor").value;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
async function copyPng() {
  try {
    const blob = await rasterBlob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    $("status").textContent = "PNG copied.";
  } catch {
    $("status").textContent = "Copy blocked; download PNG instead.";
  }
}
function project() {
  return {
    type: "drawsplat-graph",
    version: 1,
    name: $("projectName").value,
    mode: mode(),
    controls: Object.fromEntries(
      [
        ...document.querySelectorAll(
          ".controls input:not([type=file]),.controls select,.controls textarea",
        ),
      ]
        .filter((input) => input.id)
        .map((input) => [
          input.id,
          input.type === "checkbox" ? input.checked : input.value,
        ]),
    ),
    pictureRows,
    quickColors,
    geometryConstructions,
  };
}
function applyProject(item) {
  if (item.type !== "drawsplat-graph")
    throw new Error("This is not a GraphSplat project.");
  for (const [id, value] of Object.entries(item.controls || {})) {
    const input = $(id);
    if (!input) continue;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = String(value).slice(0, 50000);
  }
  pictureRows = (
    Array.isArray(item.pictureRows) ? item.pictureRows : pictureRows
  )
    .slice(0, 50)
    .map((row) => ({
      label: String(row.label || "").slice(0, 200),
      value: Number(row.value) || 0,
      icon: String(row.icon || "●").slice(0, 8),
      image: safeImage(row.image),
    }));
  quickColors =
    item.quickColors && typeof item.quickColors === "object"
      ? Object.fromEntries(
          Object.entries(item.quickColors).filter(([, color]) =>
            /^#[0-9a-f]{6}$/i.test(color),
          ),
        )
      : {};
  geometryConstructions = Array.isArray(item.geometryConstructions)
    ? item.geometryConstructions.slice(0, 100)
    : [];
  renderPictureRows();
  syncLevel();
  syncMode();
}
function projects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE)) || [];
  } catch {
    return [];
  }
}
function refreshProjects() {
  const select = $("savedProjects");
  select.innerHTML = '<option value="">Choose a project…</option>';
  projects().forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.append(option);
  });
}
function saveProject() {
  const list = projects(),
    item = { ...project(), id: crypto.randomUUID() };
  const at = list.findIndex((saved) => saved.name === item.name);
  if (at >= 0) ((item.id = list[at].id), list.splice(at, 1, item));
  else list.unshift(item);
  try {
    localStorage.setItem(STORAGE, JSON.stringify(list.slice(0, 20)));
    refreshProjects();
    $("savedProjects").value = item.id;
    $("status").textContent = "Project saved in this browser.";
  } catch {
    $("status").textContent =
      "Project is too large for browser storage; download JSON instead.";
  }
}
function importFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      if (file.name.toLowerCase().endsWith(".json"))
        applyProject(JSON.parse(reader.result));
      else {
        $("mode").value = "quick";
        $("quickData").value = reader.result.trim();
        syncMode();
      }
      $("status").textContent = "Project opened locally.";
    } catch (error) {
      $("status").textContent = error.message;
    }
  };
  reader.readAsText(file);
}
function reset() {
  const chosen = mode();
  $("quickData").value = "Reading,12\nScience,9\nArt,14\nMusic,7";
  $("pointData").value = "-4,2,Point A\n0,0,Origin\n3,5,Point B";
  $("geometryData").value = "-4,-2,A\n2,-2,B\n0,3,C";
  $("expressions").value = "sin(x)\n0.25*x^2-2";
  $("specialtyData").value =
    "Creativity,8,4\nCommunication,6,7\nCollaboration,9,5\nCritical thinking,7,8";
  $("title").value = "My Graph";
  $("source").value = "";
  $("xLabel").value = "Categories";
  $("yLabel").value = "Value";
  $("altDescription").value = "";
  delete $("altDescription").dataset.edited;
  quickColors = {};
  geometryConstructions = [{ type: "polygon", points: [0, 1, 2] }];
  geometryPending = [];
  $("geometryTool").value = "move";
  pictureRows = [
    { label: "Apples", value: 6, icon: "🍎", image: "" },
    { label: "Bananas", value: 4, icon: "🍌", image: "" },
    { label: "Oranges", value: 3, icon: "🍊", image: "" },
  ];
  renderPictureRows();
  $("mode").value = chosen;
  syncMode();
  $("status").textContent = "Started a new graph.";
}
function adjustViewport(
  factor,
  cx = (numeric("xMin") + numeric("xMax")) / 2,
  cy = (numeric("yMin") + numeric("yMax")) / 2,
) {
  const halfX = ((numeric("xMax") - numeric("xMin")) * factor) / 2,
    halfY = ((numeric("yMax") - numeric("yMin")) * factor) / 2;
  $("xMin").value = (cx - halfX).toFixed(3);
  $("xMax").value = (cx + halfX).toFixed(3);
  $("yMin").value = (cy - halfY).toFixed(3);
  $("yMax").value = (cy + halfY).toFixed(3);
  render();
}
function graphCoordinates(event) {
  const rect = $("canvas").getBoundingClientRect(),
    x =
      numeric("xMin") +
      ((event.clientX - rect.left) / rect.width) *
        (numeric("xMax") - numeric("xMin")),
    y =
      numeric("yMax") -
      ((event.clientY - rect.top) / rect.height) *
        (numeric("yMax") - numeric("yMin"));
  return { x, y };
}
function beginDataDrag(event, target) {
  const row = Number(target.dataset.dragRow),
    series = Number(target.dataset.dragSeries),
    rows = parseRows($("quickData").value),
    startValue =
      mode() === "picture"
        ? pictureRows[row]?.value
        : rows[row]?.values[series];
  if (!Number.isFinite(startValue)) return false;
  drag = {
    kind: "data",
    row,
    series,
    axis: target.dataset.dragAxis,
    startX: event.clientX,
    startY: event.clientY,
    startValue,
    rows,
    scale: Math.max(
      5,
      ...currentRows().flatMap((item) => item.values.map(Math.abs)),
    ),
  };
  $("canvas").setPointerCapture(event.pointerId);
  $("status").textContent = "Drag to change the value.";
  return true;
}
function updateDataDrag(event) {
  const rect = $("canvas").getBoundingClientRect(),
    pixels =
      drag.axis === "x"
        ? event.clientX - drag.startX
        : drag.startY - event.clientY,
    dimension = drag.axis === "x" ? rect.width : rect.height,
    raw = Math.max(0, drag.startValue + (pixels / dimension) * drag.scale),
    step = event.shiftKey ? 0.1 : 1,
    value = Math.round(raw / step) * step;
  if (mode() === "picture") {
    pictureRows[drag.row].value = value;
    const input = $("pictureRows").children[drag.row]?.querySelector(".value");
    if (input) input.value = value;
  } else {
    drag.rows[drag.row].values[drag.series] = value;
    $("quickData").value = drag.rows
      .map((row) => [row.label, ...row.values].join(","))
      .join("\n");
  }
  render();
  $("status").textContent =
    `${drag.rows[drag.row]?.label || pictureRows[drag.row]?.label}: ${value}`;
}
function writeGeometryPoints(points) {
  $("geometryData").value = points
    .map((point) => `${point.x},${point.y},${point.label}`)
    .join("\n");
}
function geometryPoint(event) {
  const point = graphCoordinates(event),
    step = $("geometrySnap").checked
      ? Math.max(0.1, numeric("gridStep", 1))
      : 0.01;
  return {
    x: Math.round(point.x / step) * step,
    y: Math.round(point.y / step) * step,
  };
}
function addGeometryPoint(event) {
  const points = parseGeometryPoints(),
    point = geometryPoint(event),
    index = points.length,
    tool = $("geometryTool").value;
  points.push({ ...point, label: String.fromCharCode(65 + (index % 26)) });
  writeGeometryPoints(points);
  if (tool === "segment" || tool === "circle") {
    geometryPending.push(index);
    if (geometryPending.length === 2) {
      geometryConstructions.push({ type: tool, points: [...geometryPending] });
      geometryPending = [];
    }
  } else if (tool === "polygon") geometryPending.push(index);
  render();
}
function finishGeometryPolygon() {
  if (geometryPending.length > 2)
    geometryConstructions.push({
      type: "polygon",
      points: [...geometryPending],
    });
  geometryPending = [];
  render();
}
function loadExample(example) {
  $("mode").value = example.mode;
  Object.entries(example.values || {}).forEach(([id, value]) => {
    const input = $(id);
    if (!input) return;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value;
  });
  if (example.pictureRows) {
    pictureRows = example.pictureRows.map((row) => ({ ...row }));
    renderPictureRows();
  }
  if (example.geometryData !== undefined)
    $("geometryData").value = example.geometryData;
  if (example.constructions)
    geometryConstructions = example.constructions.map((shape) => ({
      ...shape,
      points: [...shape.points],
    }));
  $("title").value = example.title || example.name;
  quickColors = {};
  geometryPending = [];
  $("exampleDialog").close();
  syncMode();
  $("status").textContent = `${example.name} loaded.`;
}
function buildExampleLibrary() {
  const labels = {
      quick: "Quick Chart",
      picture: "Picture Graph",
      coordinate: "Coordinate Plane",
      expression: "Expression Calculator",
      geometry: "Geometry",
      specialty: "Specialty Chart",
    },
    library = $("exampleLibrary");
  library.replaceChildren();
  Object.entries(labels).forEach(([modeId, label]) => {
    const section = document.createElement("section"),
      heading = document.createElement("h3"),
      grid = document.createElement("div");
    section.className = "example-group";
    heading.textContent = label;
    grid.className = "example-grid";
    EXAMPLES.filter((example) => example.mode === modeId).forEach((example) => {
      const button = document.createElement("button"),
        name = document.createElement("strong"),
        description = document.createElement("span");
      button.type = "button";
      button.className = "example-card";
      name.textContent = example.name;
      description.textContent = example.description;
      button.append(name, description);
      button.onclick = () => loadExample(example);
      grid.append(button);
    });
    section.append(heading, grid);
    library.append(section);
  });
}
function openQuickEditor(event, target) {
  const rows = parseRows($("quickData").value),
    row = Number(target.dataset.quickRow),
    series = Number(target.dataset.quickSeries),
    item = rows[row];
  if (!item || !Number.isFinite(item.values[series])) return;
  event.preventDefault();
  const fallback = target.getAttribute("fill");
  $("quickEditDialog").dataset.row = row;
  $("quickEditDialog").dataset.series = series;
  $("quickEditTitle").textContent = `Edit ${item.label}`;
  $("quickEditValue").value = item.values[series];
  $("quickEditColor").value = /^#[0-9a-f]{6}$/i.test(fallback)
    ? fallback
    : quickColors[`${row}:${series}`] || PALETTE[series % PALETTE.length];
  $("quickEditDialog").showModal();
}
function applyQuickEditor(event) {
  event.preventDefault();
  const dialog = $("quickEditDialog"),
    row = Number(dialog.dataset.row),
    series = Number(dialog.dataset.series),
    rows = parseRows($("quickData").value),
    value = Number($("quickEditValue").value);
  if (!rows[row] || !Number.isFinite(value)) return;
  rows[row].values[series] = value;
  quickColors[`${row}:${series}`] = $("quickEditColor").value;
  $("quickData").value = rows
    .map((item) => [item.label, ...item.values].join(","))
    .join("\n");
  dialog.close();
  render();
  $("status").textContent = `${rows[row].label} updated.`;
}
function beginExpressionDrag(event, target) {
  const index = Number(target.dataset.expressionIndex),
    sources = expressionSources();
  if (!sources[index]) return false;
  drag = {
    kind: "expression",
    index,
    sources,
    source: sources[index],
    startY: event.clientY,
    yRange: numeric("yMax", 10) - numeric("yMin", -10),
  };
  $("canvas").setPointerCapture(event.pointerId);
  $("status").textContent = "Drag the curve vertically to change its offset.";
  return true;
}
function updateExpressionDrag(event) {
  const height = $("canvas").getBoundingClientRect().height,
    offset = ((drag.startY - event.clientY) / height) * drag.yRange,
    rounded = Math.round(offset * 1000) / 1000;
  drag.sources[drag.index] =
    Math.abs(rounded) < 0.001
      ? drag.source
      : `(${drag.source})${rounded >= 0 ? "+" : ""}${rounded}`;
  $("expressions").value = drag.sources.join("\n");
  render();
  $("status").textContent = `Expression offset: ${rounded}`;
}
function bind() {
  document
    .querySelectorAll(".controls input,.controls select,.controls textarea")
    .forEach((input) => {
      if (input.type !== "file")
        input.addEventListener("input", () => {
          if (input === $("altDescription")) input.dataset.edited = "true";
          render();
        });
    });
  $("mode").onchange = syncMode;
  $("openExamples").onclick = () => $("exampleDialog").showModal();
  $("closeExamples").onclick = () => $("exampleDialog").close();
  $("level").onchange = () => {
    syncLevel();
    render();
  };
  $("theme").onchange = () => {
    const selected = THEMES[$("theme").value];
    $("primaryColor").value = selected.colors[0];
    $("backgroundColor").value = selected.background;
    render();
  };
  $("oneQuadrant").onchange = syncMode;
  $("addPictureRow").onclick = () => {
    pictureRows.push({
      label: "New category",
      value: 1,
      icon: EMOJIS[pictureRows.length % EMOJIS.length],
      image: "",
    });
    renderPictureRows();
    render();
  };
  $("expressionTable").onclick = showExpressionTable;
  $("copyTable").onclick = copyDataTable;
  $("copyPng").onclick = copyPng;
  $("downloadPng").onclick = async () =>
    download(await rasterBlob(), filename("png"));
  $("downloadJpg").onclick = async () =>
    download(await rasterBlob("image/jpeg"), filename("jpg"));
  $("downloadSvg").onclick = () =>
    download(new Blob([lastSvg], { type: "image/svg+xml" }), filename("svg"));
  $("print").onclick = () => window.print();
  $("exportCsv").onclick = () =>
    download(
      new Blob(
        [
          dataTable()
            .map((row) =>
              row
                .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                .join(","),
            )
            .join("\n"),
        ],
        { type: "text/csv" },
      ),
      filename("csv"),
    );
  $("saveProject").onclick = saveProject;
  $("downloadProject").onclick = () =>
    download(
      new Blob([JSON.stringify(project(), null, 2)], {
        type: "application/json",
      }),
      filename("json"),
    );
  $("openProject").onclick = () => $("projectFile").click();
  $("projectFile").onchange = () =>
    $("projectFile").files[0] && importFile($("projectFile").files[0]);
  $("savedProjects").onchange = () => {
    const item = projects().find(
      (project) => project.id === $("savedProjects").value,
    );
    if (item) applyProject(item);
  };
  $("reset").onclick = reset;
  $("quickEditApply").onclick = applyQuickEditor;
  $("finishPolygon").onclick = finishGeometryPolygon;
  $("undoGeometry").onclick = () => {
    if (geometryPending.length) geometryPending.pop();
    else geometryConstructions.pop();
    render();
  };
  $("clearGeometry").onclick = () => {
    geometryPending = [];
    geometryConstructions = [];
    $("geometryData").value = "";
    render();
  };
  ["paramA", "paramB", "paramC"].forEach((id) =>
    $(id).addEventListener("input", () => {
      $(`${id}Out`).textContent = $(id).value;
    }),
  );
  $("canvas").addEventListener(
    "wheel",
    (event) => {
      if (mode() !== "expression") return;
      event.preventDefault();
      const point = graphCoordinates(event);
      adjustViewport(event.deltaY > 0 ? 1.2 : 0.83, point.x, point.y);
    },
    { passive: false },
  );
  $("canvas").addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const dataTarget = event.target.closest("[data-drag-row]");
    if (dataTarget && beginDataDrag(event, dataTarget)) {
      event.preventDefault();
      return;
    }
    const expressionTarget = event.target.closest("[data-expression-index]");
    if (expressionTarget && beginExpressionDrag(event, expressionTarget)) {
      event.preventDefault();
      return;
    }
    if (mode() === "geometry") {
      const pointTarget = event.target.closest("[data-geometry-point]");
      if (pointTarget) {
        drag = {
          kind: "geometry",
          index: Number(pointTarget.dataset.geometryPoint),
        };
        $("canvas").setPointerCapture(event.pointerId);
      } else if ($("geometryTool").value !== "move") addGeometryPoint(event);
      event.preventDefault();
      return;
    }
    if (!["expression", "coordinate"].includes(mode())) return;
    drag = {
      kind: "viewport",
      startX: event.clientX,
      startY: event.clientY,
      xMin: numeric("xMin"),
      xMax: numeric("xMax"),
      yMin: numeric("yMin"),
      yMax: numeric("yMax"),
      moved: false,
    };
    $("canvas").setPointerCapture(event.pointerId);
  });
  $("canvas").addEventListener("pointermove", (event) => {
    if (!drag) {
      if (mode() === "expression") {
        const point = graphCoordinates(event);
        $("trace").textContent =
          `x ${point.x.toFixed(3)} · y ${point.y.toFixed(3)}`;
      }
      return;
    }
    if (drag.kind === "data") {
      updateDataDrag(event);
      return;
    }
    if (drag.kind === "expression") {
      updateExpressionDrag(event);
      return;
    }
    if (drag.kind === "geometry") {
      const points = parseGeometryPoints(),
        point = geometryPoint(event);
      if (points[drag.index]) {
        points[drag.index] = { ...points[drag.index], ...point };
        writeGeometryPoints(points);
        render();
      }
      return;
    }
    const rect = $("canvas").getBoundingClientRect(),
      dx =
        ((event.clientX - drag.startX) / rect.width) * (drag.xMax - drag.xMin),
      dy =
        ((event.clientY - drag.startY) / rect.height) * (drag.yMax - drag.yMin);
    if (
      Math.abs(event.clientX - drag.startX) +
        Math.abs(event.clientY - drag.startY) >
      4
    )
      drag.moved = true;
    $("xMin").value = (drag.xMin - dx).toFixed(3);
    $("xMax").value = (drag.xMax - dx).toFixed(3);
    $("yMin").value = (drag.yMin + dy).toFixed(3);
    $("yMax").value = (drag.yMax + dy).toFixed(3);
    render();
  });
  $("canvas").addEventListener("pointerup", (event) => {
    if (mode() === "coordinate" && drag?.kind === "viewport" && !drag.moved) {
      const point = graphCoordinates(event);
      $("pointData").value += `\n${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      render();
    }
    if (drag?.kind === "data") $("status").textContent = "Value updated.";
    if (drag?.kind === "expression")
      $("status").textContent = "Expression updated.";
    if (drag?.kind === "geometry")
      $("status").textContent = "Geometry point updated.";
    drag = null;
  });
  $("canvas").addEventListener("contextmenu", (event) => {
    if (mode() !== "quick") return;
    const target = event.target.closest("[data-quick-row]");
    if (target) openQuickEditor(event, target);
  });
}

const query = new URLSearchParams(location.search),
  requested = query.get("mode");
if (
  [
    "quick",
    "picture",
    "coordinate",
    "expression",
    "geometry",
    "specialty",
  ].includes(requested)
)
  $("mode").value = requested;
renderPictureRows();
seedEmojiPalette();
buildExampleLibrary();
refreshProjects();
bind();
syncLevel();
syncMode();
