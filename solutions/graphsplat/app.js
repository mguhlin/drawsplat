import {
  parseRows,
  renderQuick,
  renderPicture,
  renderCoordinate,
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
let pictureRows = [
    { label: "Apples", value: 6, icon: "🍎", image: "" },
    { label: "Bananas", value: 4, icon: "🍌", image: "" },
    { label: "Oranges", value: 3, icon: "🍊", image: "" },
  ],
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
    } else
      lastSvg = renderSpecialty($("specialtyType").value, lastRows, config);
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
  $("viewportControls").hidden = !["coordinate", "expression"].includes(mode());
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
  $("expressions").value = "sin(x)\n0.25*x^2-2";
  $("specialtyData").value =
    "Creativity,8,4\nCommunication,6,7\nCollaboration,9,5\nCritical thinking,7,8";
  $("title").value = "My Graph";
  $("source").value = "";
  $("xLabel").value = "Categories";
  $("yLabel").value = "Value";
  $("altDescription").value = "";
  delete $("altDescription").dataset.edited;
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
    const dataTarget = event.target.closest("[data-drag-row]");
    if (dataTarget && beginDataDrag(event, dataTarget)) {
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
    drag = null;
  });
}

const query = new URLSearchParams(location.search),
  requested = query.get("mode");
if (
  ["quick", "picture", "coordinate", "expression", "specialty"].includes(
    requested,
  )
)
  $("mode").value = requested;
renderPictureRows();
seedEmojiPalette();
refreshProjects();
bind();
syncLevel();
syncMode();
