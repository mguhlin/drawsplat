import { protectPdf, unlockPdf } from "./ciphersplat-pdf.js";

const pdfjs = globalThis.pdfjsLib;
const { PDFDocument, StandardFonts, rgb, degrees } = globalThis.PDFLib;
pdfjs.GlobalWorkerOptions.workerSrc = "../../vendor/pdf.worker.min.js";

const $ = (id) => document.getElementById(id);
const ids = ["openButton", "pagesButton", "chooseButton", "fileInput", "mergeButton", "mergeInput", "imageInput", "vaultInput", "protectButton", "unlockButton", "exportButton", "undoButton", "redoButton", "sidebar", "thumbnails", "pageCount", "dropZone", "documentView", "pageShell", "pdfCanvas", "textHitLayer", "annotationLayer", "status", "editTextButton", "removeAreaButton", "addTextButton", "highlightButton", "drawButton", "addImageButton", "rotateLeftButton", "rotateRightButton", "duplicatePageButton", "deletePageButton", "extractPageButton", "splitButton", "textProperties", "textValue", "fontSize", "textColor", "deleteTextButton", "objectProperties", "objectOpacity", "deleteObjectButton", "zoomOutButton", "zoomInButton", "zoomLabel", "fitButton", "privacyButton", "privacyDialog", "splitDialog", "splitForm", "splitRanges", "vaultDialog", "vaultForm", "vaultTitle", "vaultIntro", "vaultFields", "vaultCopy", "vaultPassword", "vaultConfirm", "vaultConfirmRow", "vaultProtectChoice", "vaultUnlockChoice", "vaultCancel", "vaultRun"];
const els = Object.fromEntries(ids.map((id) => [id, $(id)]));
const state = {
  fileName: "document.pdf",
  sources: new Map(),
  assets: new Map(),
  pages: [],
  current: 0,
  selectedPageIds: new Set(),
  selectionAnchor: 0,
  zoom: 1,
  renderScale: 1,
  selectedId: null,
  mode: "select",
  history: [],
  future: [],
  renderToken: 0,
  thumbnailObserver: null,
};

function announce(message) {
  els.status.textContent = message;
}
function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
function currentPage() {
  return state.pages[state.current];
}
function selectedPageIndexes() {
  const indexes = state.pages.map((page, index) => (state.selectedPageIds.has(page.id) ? index : -1)).filter((index) => index >= 0);
  return indexes.length ? indexes : state.pages.length ? [state.current] : [];
}
function selectOnlyPage(index) {
  state.selectedPageIds = new Set(state.pages[index] ? [state.pages[index].id] : []);
  state.selectionAnchor = index;
}
function selectedObject() {
  return currentPage()?.annotations.find((o) => o.id === state.selectedId);
}
function snapshot() {
  return JSON.stringify({ pages: state.pages, current: state.current, selectedPageIds: [...state.selectedPageIds] });
}
function commit(before, label) {
  const after = snapshot();
  if (before === after) return;
  state.history.push({ before, after, label });
  if (state.history.length > 100) state.history.shift();
  state.future = [];
  syncHistory();
}
function mutate(label, fn) {
  const before = snapshot();
  fn();
  commit(before, label);
}
function syncHistory() {
  els.undoButton.disabled = !state.history.length;
  els.redoButton.disabled = !state.future.length;
}
function restore(value) {
  const data = JSON.parse(value);
  state.pages = data.pages;
  state.current = Math.max(0, Math.min(data.current, state.pages.length - 1));
  state.selectedPageIds = new Set(data.selectedPageIds || (state.pages[state.current] ? [state.pages[state.current].id] : []));
  state.selectionAnchor = state.current;
  state.selectedId = null;
  setMode("select");
  renderAll();
}
function setEnabled(on) {
  ["pagesButton", "mergeButton", "exportButton", "editTextButton", "removeAreaButton", "addTextButton", "highlightButton", "drawButton", "addImageButton", "rotateLeftButton", "rotateRightButton", "duplicatePageButton", "deletePageButton", "extractPageButton", "splitButton", "zoomOutButton", "zoomInButton", "fitButton"].forEach((id) => (els[id].disabled = !on));
}
function setMode(mode) {
  state.mode = mode;
  els.annotationLayer.classList.toggle("drawing", mode === "draw");
  els.annotationLayer.classList.toggle("masking", mode === "mask");
  els.annotationLayer.classList.toggle("editing-text", mode === "edit-text");
  els.textHitLayer.classList.toggle("active", mode === "edit-text");
  els.drawButton.classList.toggle("active", mode === "draw");
  els.removeAreaButton.classList.toggle("active", mode === "mask");
  els.editTextButton.classList.toggle("active", mode === "edit-text");
  els.drawButton.setAttribute("aria-pressed", String(mode === "draw"));
  els.removeAreaButton.setAttribute("aria-pressed", String(mode === "mask"));
  els.editTextButton.setAttribute("aria-pressed", String(mode === "edit-text"));
}

async function loadSource(file) {
  if (!file || !file.name.toLowerCase().endsWith(".pdf")) throw Error("Choose a PDF file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  return { id: uid(), name: file.name, bytes, pdf };
}
function pagesFor(source) {
  return Array.from({ length: source.pdf.numPages }, (_, sourceIndex) => ({
    id: uid(),
    sourceId: source.id,
    sourceIndex,
    rotation: 0,
    annotations: [],
  }));
}
async function openFile(file) {
  try {
    announce(`Opening ${file?.name || "PDF"}…`);
    const source = await loadSource(file);
    for (const asset of state.assets.values()) URL.revokeObjectURL(asset.url);
    state.sources = new Map([[source.id, source]]);
    state.assets.clear();
    state.pages = pagesFor(source);
    state.fileName = file.name;
    state.current = 0;
    selectOnlyPage(0);
    state.zoom = 1;
    state.selectedId = null;
    state.history = [];
    state.future = [];
    setMode("select");
    els.dropZone.hidden = true;
    els.documentView.hidden = false;
    setEnabled(true);
    syncHistory();
    await renderAll();
    announce(`${file.name} opened. ${state.pages.length} pages.`);
  } catch (error) {
    console.error(error);
    announce(error?.name === "PasswordException" ? "This encrypted PDF needs password support not available in this release." : error.message || "The PDF could not be opened.");
  } finally {
    els.fileInput.value = "";
  }
}
async function mergeFile(file) {
  try {
    announce(`Adding ${file?.name || "PDF"}…`);
    const source = await loadSource(file),
      before = snapshot();
    state.sources.set(source.id, source);
    state.pages.push(...pagesFor(source));
    state.current = state.pages.length - source.pdf.numPages;
    selectOnlyPage(state.current);
    commit(before, "Add PDF");
    await renderAll();
    announce(`${source.pdf.numPages} pages from ${file.name} added.`);
  } catch (error) {
    console.error(error);
    announce(error.message || "The additional PDF could not be opened.");
  } finally {
    els.mergeInput.value = "";
  }
}
async function sourcePage(item) {
  return state.sources.get(item.sourceId).pdf.getPage(item.sourceIndex + 1);
}

async function renderAll() {
  els.pageCount.textContent = state.pages.length;
  await Promise.all([renderCurrent(), renderThumbnails()]);
}
async function renderCurrent() {
  const token = ++state.renderToken,
    item = currentPage();
  if (!item) return;
  const page = await sourcePage(item);
  if (token !== state.renderToken) return;
  const rotation = (page.rotate + item.rotation) % 360,
    base = page.getViewport({ scale: 1, rotation }),
    available = Math.max(320, els.documentView.clientWidth - 64),
    scale = Math.min(2.2, available / base.width) * state.zoom,
    viewport = page.getViewport({ scale, rotation }),
    ratio = Math.min(devicePixelRatio || 1, 2),
    canvas = els.pdfCanvas;
  state.renderScale = scale;
  canvas.width = Math.floor(viewport.width * ratio);
  canvas.height = Math.floor(viewport.height * ratio);
  els.pageShell.style.width = `${viewport.width}px`;
  els.pageShell.style.height = `${viewport.height}px`;
  await page.render({
    canvasContext: canvas.getContext("2d"),
    viewport,
    transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null,
  }).promise;
  if (token !== state.renderToken) return;
  await renderTextHits(page, viewport, token);
  renderAnnotations();
  els.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
  [...els.thumbnails.children].forEach((node, i) => {
    node.classList.toggle("selected", state.selectedPageIds.has(state.pages[i].id));
    node.classList.toggle("current", i === state.current);
    node.setAttribute("aria-selected", String(state.selectedPageIds.has(state.pages[i].id)));
  });
}
async function renderTextHits(page, viewport, token) {
  els.textHitLayer.replaceChildren();
  const content = await page.getTextContent();
  if (token !== state.renderToken) return;
  const runs = [];
  for (const item of content.items) {
    if (!item.str?.trim()) continue;
    const transform = pdfjs.Util.transform(viewport.transform, item.transform),
      height = Math.max(6, Math.hypot(transform[2], transform[3]) || Math.hypot(transform[0], transform[1])),
      width = Math.max(height * 0.5, item.width * viewport.scale),
      left = transform[4],
      baseline = transform[5],
      top = baseline - height;
    if (left >= viewport.width || top >= viewport.height || left + width <= 0 || top + height <= 0) continue;
    runs.push({
      text: item.str,
      left,
      top,
      width,
      height,
      baseline,
      fontSize: Math.max(6, Math.hypot(item.transform[0], item.transform[1])),
      fontFamily: content.styles?.[item.fontName]?.fontFamily || "Arial, sans-serif",
    });
  }
  runs.sort((a, b) => (Math.abs(a.baseline - b.baseline) > Math.max(a.height, b.height) * 0.45 ? a.top - b.top : a.left - b.left));
  const lines = [];
  for (const run of runs) {
    let line = lines.find((candidate) => Math.abs(candidate.baseline - run.baseline) <= Math.max(candidate.height, run.height) * 0.45);
    if (!line) {
      line = { runs: [], baseline: run.baseline, height: run.height };
      lines.push(line);
    }
    line.runs.push(run);
    line.height = Math.max(line.height, run.height);
  }
  for (const line of lines) {
    line.runs.sort((a, b) => a.left - b.left);
    let text = "",
      right = line.runs[0].left,
      fontSize = 0,
      fontFamily = line.runs[0].fontFamily;
    for (const run of line.runs) {
      const gap = run.left - right;
      if (text && gap > line.height * 0.12 && !/\s$/.test(text) && !/^\s/.test(run.text)) text += " ";
      text += run.text;
      right = Math.max(right, run.left + run.width);
      fontSize = Math.max(fontSize, run.fontSize);
    }
    const left = line.runs[0].left - 2,
      top = Math.min(...line.runs.map((run) => run.top)) - 1,
      width = right - left + 3,
      height = line.height + 3;
    const hit = document.createElement("button");
    hit.type = "button";
    hit.className = "text-hit";
    hit.textContent = text;
    hit.setAttribute("aria-label", `Edit text: ${text}`);
    Object.assign(hit.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
    hit.onclick = (event) => {
      event.stopPropagation();
      replaceTextRun(text, {
        x: left / viewport.width,
        y: top / viewport.height,
        w: width / viewport.width,
        h: height / viewport.height,
        fontSize,
        fontFamily,
      });
    };
    els.textHitLayer.append(hit);
  }
}
async function renderThumbnail(li) {
  if (li.dataset.rendered === "true") return;
  li.dataset.rendered = "true";
  const index = Number(li.dataset.index),
    item = state.pages[index];
  if (!item) return;
  const canvas = li.querySelector("canvas"),
    page = await sourcePage(item),
    vp = page.getViewport({
      scale: 0.2,
      rotation: (page.rotate + item.rotation) % 360,
    });
  canvas.width = vp.width;
  canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
}
async function renderThumbnails() {
  state.thumbnailObserver?.disconnect();
  els.thumbnails.replaceChildren();
  state.thumbnailObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          renderThumbnail(entry.target);
          state.thumbnailObserver.unobserve(entry.target);
        }
    },
    { root: els.sidebar, rootMargin: "240px" },
  );
  for (let index = 0; index < state.pages.length; index++) {
    const li = document.createElement("li"),
      canvas = document.createElement("canvas"),
      label = document.createElement("span");
    li.className = `thumbnail${state.selectedPageIds.has(state.pages[index].id) ? " selected" : ""}${index === state.current ? " current" : ""}`;
    li.draggable = true;
    li.dataset.index = index;
    li.tabIndex = 0;
    li.setAttribute("aria-label", `Page ${index + 1}`);
    li.setAttribute("aria-selected", String(state.selectedPageIds.has(state.pages[index].id)));
    canvas.width = 120;
    canvas.height = 160;
    label.textContent = `Page ${index + 1}`;
    li.append(canvas, label);
    els.thumbnails.append(li);
    li.onclick = (event) => selectPage(index, event);
    li.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectPage(index, e);
      }
    };
    li.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", String(index));
      li.classList.add("dragging");
    };
    li.ondragend = () => li.classList.remove("dragging");
    li.ondragover = (e) => e.preventDefault();
    li.ondrop = (e) => {
      e.preventDefault();
      reorderPage(Number(e.dataTransfer.getData("text/plain")), index);
    };
    state.thumbnailObserver.observe(li);
  }
}
function selectPage(index, event = {}) {
  if (event.shiftKey) {
    const start = Math.min(state.selectionAnchor, index),
      end = Math.max(state.selectionAnchor, index);
    state.selectedPageIds = new Set(state.pages.slice(start, end + 1).map((page) => page.id));
  } else if (event.ctrlKey || event.metaKey) {
    const id = state.pages[index].id;
    if (state.selectedPageIds.has(id)) state.selectedPageIds.delete(id);
    else state.selectedPageIds.add(id);
    state.selectionAnchor = index;
  } else selectOnlyPage(index);
  state.current = index;
  state.selectedId = null;
  setMode("select");
  $("sidebar").classList.remove("open");
  els.pagesButton.setAttribute("aria-expanded", "false");
  renderAll();
  const count = selectedPageIndexes().length;
  announce(count > 1 ? `${count} pages selected. Page ${index + 1} is active.` : `Page ${index + 1} of ${state.pages.length}`);
}
function reorderPage(from, to) {
  if (from === to || !Number.isInteger(from) || from < 0 || from >= state.pages.length) return;
  mutate("Reorder page", () => {
    const [moved] = state.pages.splice(from, 1);
    state.pages.splice(to, 0, moved);
    state.current = to;
    selectOnlyPage(to);
  });
  renderAll();
  announce(`Page moved to position ${to + 1}.`);
}
function rotate(delta) {
  const indexes = selectedPageIndexes();
  mutate("Rotate pages", () => indexes.forEach((index) => (state.pages[index].rotation = (state.pages[index].rotation + delta + 360) % 360)));
  renderAll();
  announce(`${indexes.length} ${indexes.length === 1 ? "page" : "pages"} rotated.`);
}
function duplicatePage() {
  const indexes = selectedPageIndexes(),
    insertAt = Math.max(...indexes) + 1;
  mutate("Duplicate pages", () => {
    const copies = indexes.map((index) => {
      const copy = structuredClone(state.pages[index]);
      copy.id = uid();
      copy.annotations.forEach((o) => (o.id = uid()));
      return copy;
    });
    state.pages.splice(insertAt, 0, ...copies);
    state.selectedPageIds = new Set(copies.map((page) => page.id));
    state.current = insertAt;
    state.selectionAnchor = insertAt;
  });
  renderAll();
  announce(`${indexes.length} ${indexes.length === 1 ? "page" : "pages"} duplicated.`);
}
function deletePage() {
  const indexes = selectedPageIndexes();
  if (indexes.length >= state.pages.length) {
    announce("A PDF must contain at least one page. Select fewer pages to delete.");
    return;
  }
  const first = indexes[0];
  mutate("Delete pages", () => {
    const ids = new Set(indexes.map((index) => state.pages[index].id));
    state.pages = state.pages.filter((page) => !ids.has(page.id));
    state.current = Math.min(first, state.pages.length - 1);
    selectOnlyPage(state.current);
    state.selectedId = null;
  });
  renderAll();
  announce(`${indexes.length} ${indexes.length === 1 ? "page" : "pages"} deleted. Undo is available.`);
}
function extractPages() {
  const indexes = selectedPageIndexes(),
    pages = indexes.map((index) => state.pages[index]),
    suffix = indexes.length === 1 ? `-page-${indexes[0] + 1}` : "-selected-pages";
  exportPdf(pages, suffix);
}

function renderAnnotations() {
  els.annotationLayer.replaceChildren();
  const page = currentPage();
  if (!page) return;
  for (const object of page.annotations) {
    if (object.type === "drawing") {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
        path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      svg.classList.add("drawing-object");
      svg.setAttribute("viewBox", "0 0 1000 1000");
      path.setAttribute("points", object.points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(" "));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", object.color);
      path.setAttribute("stroke-width", String(object.width * 1000));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("opacity", String(object.opacity ?? 1));
      svg.append(path);
      els.annotationLayer.append(svg);
      continue;
    }
    const node = object.type === "image" ? document.createElement("img") : document.createElement("div");
    node.className = `editable-object ${object.type}-object${object.cover ? " replacement-object" : ""}${state.selectedId === object.id ? " selected" : ""}`;
    node.dataset.id = object.id;
    node.tabIndex = 0;
    node.setAttribute("aria-label", `${object.type} annotation`);
    if (object.type === "text") {
      node.textContent = object.text;
      node.style.fontSize = `${object.fontSize * state.renderScale}px`;
      node.style.fontFamily = object.fontFamily || "Arial, sans-serif";
      node.style.lineHeight = "1";
      node.style.color = object.color;
      if (object.cover) {
        node.style.background = "#ffffff";
        node.contentEditable = "true";
        node.setAttribute("role", "textbox");
        node.setAttribute("aria-label", "Edit replacement text in place");
        node.onfocus = () => (node.dataset.before = snapshot());
        node.oninput = () => {
          object.text = node.textContent || "";
          els.textValue.value = object.text;
        };
        node.onblur = () => {
          object.text = node.textContent || "";
          syncSize(node, object);
          commit(node.dataset.before || snapshot(), "Edit replacement text");
        };
      }
    } else if (object.type === "image") {
      node.src = state.assets.get(object.assetId)?.url || "";
      node.alt = "";
    } else node.style.background = object.color || "#ffffff";
    Object.assign(node.style, {
      left: `${object.x * 100}%`,
      top: `${object.y * 100}%`,
      width: `${object.w * 100}%`,
      height: `${object.h * 100}%`,
      opacity: object.opacity ?? 1,
    });
    node.onpointerdown = (e) => startDrag(e, node, object);
    node.onclick = (e) => {
      e.stopPropagation();
      if (!object.cover) selectObject(object.id);
    };
    if (!object.cover) node.onblur = () => syncSize(node, object);
    node.onkeydown = (e) => {
      if (object.cover) {
        if (e.key === "Escape") node.blur();
      } else objectKeydown(e, object);
    };
    els.annotationLayer.append(node);
  }
  updateProperties();
}
function selectObject(id) {
  state.selectedId = id;
  setMode("select");
  els.annotationLayer.querySelectorAll(".editable-object").forEach((node) => node.classList.toggle("selected", node.dataset.id === id));
  updateProperties();
}
function updateProperties() {
  const o = selectedObject(),
    isText = o?.type === "text";
  els.textProperties.disabled = !isText;
  els.objectProperties.disabled = !o || o.type === "drawing";
  if (isText) {
    els.textValue.value = o.text;
    els.fontSize.value = o.fontSize;
    els.textColor.value = o.color;
  }
  if (o) els.objectOpacity.value = Math.round((o.opacity ?? 1) * 100);
}
function addText() {
  mutate("Add text", () => {
    const o = {
      id: uid(),
      type: "text",
      text: "Add directions",
      x: 0.12,
      y: 0.12,
      w: 0.32,
      h: 0.08,
      fontSize: 18,
      color: "#172033",
      opacity: 1,
    };
    currentPage().annotations.push(o);
    state.selectedId = o.id;
  });
  renderAnnotations();
  announce("Text box added.");
}
function replaceTextRun(text, bounds) {
  let object;
  mutate("Replace PDF text", () => {
    object = {
      id: uid(),
      type: "text",
      text,
      ...bounds,
      color: "#172033",
      opacity: 1,
      cover: true,
    };
    currentPage().annotations.push(object);
    state.selectedId = object.id;
  });
  setMode("select");
  renderAnnotations();
  requestAnimationFrame(() => {
    const node = els.annotationLayer.querySelector(`[data-id="${object.id}"]`);
    node?.focus();
    if (node) {
      const range = document.createRange(),
        selection = getSelection();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
  announce("PDF text selected. Type directly on the page, then press Tab when finished.");
}
function addHighlight() {
  mutate("Add highlight", () => {
    const o = {
      id: uid(),
      type: "highlight",
      x: 0.18,
      y: 0.2,
      w: 0.45,
      h: 0.045,
      color: "#ffe45c",
      opacity: 0.55,
    };
    currentPage().annotations.push(o);
    state.selectedId = o.id;
  });
  renderAnnotations();
  announce("Highlight added. Drag and resize it over content.");
}
async function addImage(file) {
  if (!file || !["image/png", "image/jpeg"].includes(file.type)) {
    announce("Choose a PNG or JPEG image.");
    return;
  }
  const bytes = new Uint8Array(await file.arrayBuffer()),
    assetId = uid();
  state.assets.set(assetId, {
    bytes,
    type: file.type,
    url: URL.createObjectURL(new Blob([bytes], { type: file.type })),
  });
  mutate("Add image", () => {
    const o = {
      id: uid(),
      type: "image",
      assetId,
      x: 0.2,
      y: 0.2,
      w: 0.3,
      h: 0.25,
      opacity: 1,
    };
    currentPage().annotations.push(o);
    state.selectedId = o.id;
  });
  renderAnnotations();
  announce("Image added.");
  els.imageInput.value = "";
}
function deleteSelected() {
  if (!selectedObject()) return;
  mutate("Delete object", () => {
    currentPage().annotations = currentPage().annotations.filter((o) => o.id !== state.selectedId);
    state.selectedId = null;
  });
  renderAnnotations();
  announce("Object deleted.");
}
function clampObject(o) {
  o.w = Math.min(0.98, Math.max(0.03, o.w));
  o.h = Math.min(0.98, Math.max(0.02, o.h));
  o.x = Math.min(1 - o.w, Math.max(0, o.x));
  o.y = Math.min(1 - o.h, Math.max(0, o.y));
}
function syncSize(node, o) {
  const before = snapshot(),
    rect = node.getBoundingClientRect(),
    parent = els.annotationLayer.getBoundingClientRect();
  o.w = rect.width / parent.width;
  o.h = rect.height / parent.height;
  clampObject(o);
  commit(before, "Resize object");
}
function startDrag(event, node, o) {
  if (event.button !== 0 || state.mode !== "select" || event.target.isContentEditable) return;
  state.selectedId = o.id;
  const before = snapshot(),
    startX = event.clientX,
    startY = event.clientY,
    startLeft = o.x,
    startTop = o.y,
    parent = els.annotationLayer.getBoundingClientRect();
  let moved = false;
  node.setPointerCapture(event.pointerId);
  const move = (e) => {
      if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 2) moved = true;
      o.x = startLeft + (e.clientX - startX) / parent.width;
      o.y = startTop + (e.clientY - startY) / parent.height;
      clampObject(o);
      node.style.left = `${o.x * 100}%`;
      node.style.top = `${o.y * 100}%`;
    },
    up = () => {
      node.removeEventListener("pointermove", move);
      commit(before, "Move object");
      if (moved) renderAnnotations();
    };
  node.addEventListener("pointermove", move);
  node.addEventListener("pointerup", up, { once: true });
}
function objectKeydown(event, o) {
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelected();
    return;
  }
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const before = snapshot(),
    step = event.shiftKey ? 0.01 : 0.002;
  o.x += event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
  o.y += event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
  clampObject(o);
  commit(before, "Move object");
  renderAnnotations();
}
function startDrawing(event) {
  if (state.mode !== "draw" || event.button !== 0) return;
  event.preventDefault();
  const before = snapshot(),
    rect = els.annotationLayer.getBoundingClientRect(),
    drawing = {
      id: uid(),
      type: "drawing",
      points: [],
      color: "#d92d20",
      width: 0.006,
      opacity: 1,
    };
  currentPage().annotations.push(drawing);
  els.annotationLayer.setPointerCapture(event.pointerId);
  const add = (e) => {
      drawing.points.push([Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))]);
      renderAnnotations();
    },
    move = (e) => add(e),
    up = () => {
      els.annotationLayer.removeEventListener("pointermove", move);
      if (drawing.points.length < 2) currentPage().annotations = currentPage().annotations.filter((o) => o.id !== drawing.id);
      commit(before, "Draw");
      setMode("select");
      renderAnnotations();
      announce("Drawing added.");
    };
  add(event);
  els.annotationLayer.addEventListener("pointermove", move);
  els.annotationLayer.addEventListener("pointerup", up, { once: true });
}
function startMask(event) {
  if (state.mode !== "mask" || event.button !== 0) return;
  event.preventDefault();
  const before = snapshot(),
    rect = els.annotationLayer.getBoundingClientRect(),
    startX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    startY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    mask = {
      id: uid(),
      type: "mask",
      x: startX,
      y: startY,
      w: 0.001,
      h: 0.001,
      color: "#ffffff",
      opacity: 1,
    };
  currentPage().annotations.push(mask);
  els.annotationLayer.setPointerCapture(event.pointerId);
  const move = (e) => {
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      mask.x = Math.min(startX, x);
      mask.y = Math.min(startY, y);
      mask.w = Math.max(0.001, Math.abs(x - startX));
      mask.h = Math.max(0.001, Math.abs(y - startY));
      renderAnnotations();
    },
    up = () => {
      els.annotationLayer.removeEventListener("pointermove", move);
      if (mask.w < 0.005 || mask.h < 0.005) currentPage().annotations = currentPage().annotations.filter((o) => o.id !== mask.id);
      else state.selectedId = mask.id;
      commit(before, "Remove area");
      setMode("select");
      renderAnnotations();
      announce("Area visually removed. This is not secure redaction.");
    };
  els.annotationLayer.addEventListener("pointermove", move);
  els.annotationLayer.addEventListener("pointerup", up, { once: true });
}

function hexColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
async function buildPdf(items) {
  const output = await PDFDocument.create(),
    font = await output.embedFont(StandardFonts.Helvetica),
    docs = new Map(),
    images = new Map();
  for (const item of items) {
    if (!docs.has(item.sourceId)) docs.set(item.sourceId, await PDFDocument.load(state.sources.get(item.sourceId).bytes));
    const [page] = await output.copyPages(docs.get(item.sourceId), [item.sourceIndex]);
    output.addPage(page);
    if (item.rotation) page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
    const { width, height } = page.getSize();
    for (const o of item.annotations) {
      if (o.type === "text") {
        if (o.cover)
          page.drawRectangle({
            x: o.x * width,
            y: height - (o.y + o.h) * height,
            width: o.w * width,
            height: Math.max(o.h * height, o.fontSize * 1.25),
            color: rgb(1, 1, 1),
          });
        page.drawText(o.text || " ", {
          x: o.x * width,
          y: height - o.y * height - o.fontSize,
          size: o.fontSize,
          font,
          color: hexColor(o.color),
          opacity: o.opacity ?? 1,
          maxWidth: o.w * width,
          lineHeight: o.fontSize * 1.2,
        });
      } else if (o.type === "mask")
        page.drawRectangle({
          x: o.x * width,
          y: height - (o.y + o.h) * height,
          width: o.w * width,
          height: o.h * height,
          color: rgb(1, 1, 1),
        });
      else if (o.type === "highlight")
        page.drawRectangle({
          x: o.x * width,
          y: height - (o.y + o.h) * height,
          width: o.w * width,
          height: o.h * height,
          color: hexColor(o.color),
          opacity: o.opacity ?? 0.55,
        });
      else if (o.type === "image") {
        if (!images.has(o.assetId)) {
          const a = state.assets.get(o.assetId);
          images.set(o.assetId, a.type === "image/png" ? await output.embedPng(a.bytes) : await output.embedJpg(a.bytes));
        }
        page.drawImage(images.get(o.assetId), {
          x: o.x * width,
          y: height - (o.y + o.h) * height,
          width: o.w * width,
          height: o.h * height,
          opacity: o.opacity ?? 1,
        });
      } else if (o.type === "drawing")
        for (let i = 1; i < o.points.length; i++) {
          const [x1, y1] = o.points[i - 1],
            [x2, y2] = o.points[i];
          page.drawLine({
            start: { x: x1 * width, y: height - y1 * height },
            end: { x: x2 * width, y: height - y2 * height },
            thickness: Math.max(1, o.width * width),
            color: hexColor(o.color),
            opacity: o.opacity ?? 1,
          });
        }
    }
  }
  return output.save();
}
function downloadBytes(bytes, name, type = "application/pdf") {
  const url = URL.createObjectURL(new Blob([bytes], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function exportPdf(items = state.pages, suffix = "-edited") {
  try {
    announce("Exporting PDF…");
    els.exportButton.disabled = true;
    const bytes = await buildPdf(items),
      name = `${state.fileName.replace(/\.pdf$/i, "")}${suffix}.pdf`;
    downloadBytes(bytes, name);
    announce(`${name} downloaded.`);
    return bytes;
  } catch (error) {
    console.error(error);
    announce("Export failed. The source PDF is unchanged.");
    return null;
  } finally {
    els.exportButton.disabled = false;
  }
}
function parseRanges(value) {
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) throw Error("Enter at least one page or page range.");
  return parts.map((part) => {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw Error(`Invalid range: ${part}`);
    const start = Number(m[1]),
      end = Number(m[2] || m[1]);
    if (start < 1 || end < start || end > state.pages.length) throw Error(`Range outside document: ${part}`);
    return state.pages.slice(start - 1, end);
  });
}
async function splitPdf(event) {
  event.preventDefault();
  try {
    const mode = new FormData(els.splitForm).get("splitMode"),
      groups = mode === "every" ? state.pages.map((page) => [page]) : parseRanges(els.splitRanges.value);
    els.splitDialog.close();
    if (groups.length === 1) {
      downloadBytes(await buildPdf(groups[0]), `${state.fileName.replace(/\.pdf$/i, "")}-part-1.pdf`);
      announce("Separated PDF downloaded.");
      return;
    }
    announce(`Creating ${groups.length} PDF files…`);
    const zip = new globalThis.JSZip();
    for (let i = 0; i < groups.length; i++) zip.file(`part-${i + 1}.pdf`, await buildPdf(groups[i]));
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
    });
    downloadBytes(blob, `${state.fileName.replace(/\.pdf$/i, "")}-parts.zip`, "application/zip");
    announce(`${groups.length} separated PDFs downloaded as a ZIP.`);
  } catch (error) {
    announce(error.message || "The PDF could not be separated.");
  }
}
let pendingVaultFile = null;
function openVaultDialog(mode = null, file = null) {
  pendingVaultFile = file;
  els.vaultDialog.dataset.mode = mode || "";
  els.vaultTitle.textContent = mode === "protect" ? "Protect this PDF" : mode === "unlock" ? "Unprotect a PDF" : "Protect or unprotect a PDF";
  els.vaultIntro.hidden = Boolean(mode);
  els.vaultFields.hidden = !mode;
  els.vaultRun.hidden = !mode;
  els.vaultCopy.textContent = mode === "protect" ? "Create an encrypted .csplat copy of the currently open PDF." : "Enter the password used to protect this file. After authentication, its PDF will open in PDFsplat.";
  els.vaultConfirmRow.hidden = mode !== "protect";
  els.vaultPassword.required = Boolean(mode);
  els.vaultConfirm.required = mode === "protect";
  els.vaultRun.textContent = mode === "protect" ? "Protect and download" : "Unprotect and open";
  els.vaultPassword.value = "";
  els.vaultConfirm.value = "";
  if (!els.vaultDialog.open) els.vaultDialog.showModal();
  if (mode) els.vaultPassword.focus();
}
async function runVault(event) {
  event.preventDefault();
  const mode = els.vaultDialog.dataset.mode,
    password = els.vaultPassword.value;
  if (mode === "protect" && password !== els.vaultConfirm.value) {
    announce("Passwords do not match.");
    els.vaultConfirm.focus();
    return;
  }
  try {
    els.vaultRun.disabled = true;
    if (mode === "protect") {
      announce("Preparing edited PDF for CipherSplat…");
      const pdfBytes = await buildPdf(state.pages),
        pdfName = `${state.fileName.replace(/\.pdf$/i, "")}-edited.pdf`,
        blob = await protectPdf(pdfBytes, pdfName, password, announce);
      downloadBytes(blob, `${pdfName}.csplat`, "application/octet-stream");
      announce("Protected CipherSplat PDF downloaded. Test unlocking it before deleting the original.");
    } else {
      const pdfFile = await unlockPdf(pendingVaultFile, password, announce);
      els.vaultDialog.close();
      await openFile(pdfFile);
      announce(`${pdfFile.name} authenticated, decrypted, and opened locally.`);
    }
    els.vaultDialog.close();
  } catch (error) {
    console.error(error);
    announce(error.message || "CipherSplat operation failed.");
  } finally {
    els.vaultPassword.value = "";
    els.vaultConfirm.value = "";
    els.vaultRun.disabled = false;
    pendingVaultFile = null;
  }
}
function undo() {
  const c = state.history.pop();
  if (!c) return;
  state.future.push(c);
  restore(c.before);
  syncHistory();
  announce(`Undid ${c.label}.`);
}
function redo() {
  const c = state.future.pop();
  if (!c) return;
  state.history.push(c);
  restore(c.after);
  syncHistory();
  announce(`Redid ${c.label}.`);
}

els.openButton.onclick = els.chooseButton.onclick = () => els.fileInput.click();
els.pagesButton.onclick = () => {
  const sidebar = $("sidebar"),
    open = sidebar.classList.toggle("open");
  els.pagesButton.setAttribute("aria-expanded", String(open));
};
els.fileInput.onchange = (e) => openFile(e.target.files[0]);
els.mergeButton.onclick = () => els.mergeInput.click();
els.mergeInput.onchange = (e) => mergeFile(e.target.files[0]);
els.exportButton.onclick = () => exportPdf();
els.protectButton.onclick = () => openVaultDialog();
els.unlockButton.onclick = () => els.vaultInput.click();
els.vaultProtectChoice.onclick = () => {
  if (!state.pages.length) {
    announce("Open a PDF before protecting it.");
    els.vaultDialog.close();
    els.fileInput.click();
    return;
  }
  openVaultDialog("protect");
};
els.vaultUnlockChoice.onclick = () => els.vaultInput.click();
els.vaultInput.onchange = (e) => {
  const file = e.target.files[0];
  if (file) openVaultDialog("unlock", file);
  els.vaultInput.value = "";
};
els.vaultForm.onsubmit = runVault;
els.vaultCancel.onclick = () => {
  pendingVaultFile = null;
  els.vaultDialog.close();
};
els.undoButton.onclick = undo;
els.redoButton.onclick = redo;
els.editTextButton.onclick = () => {
  setMode(state.mode === "edit-text" ? "select" : "edit-text");
  announce(state.mode === "edit-text" ? "Click detected PDF text to replace it." : "PDF text editing cancelled.");
};
els.removeAreaButton.onclick = () => {
  setMode(state.mode === "mask" ? "select" : "mask");
  announce(state.mode === "mask" ? "Drag over any area to visually remove it." : "Remove area cancelled.");
};
els.addTextButton.onclick = addText;
els.highlightButton.onclick = addHighlight;
els.drawButton.onclick = () => {
  setMode(state.mode === "draw" ? "select" : "draw");
  announce(state.mode === "draw" ? "Draw on the page. Release to finish." : "Drawing cancelled.");
};
els.addImageButton.onclick = () => els.imageInput.click();
els.imageInput.onchange = (e) => addImage(e.target.files[0]);
els.rotateLeftButton.onclick = () => rotate(-90);
els.rotateRightButton.onclick = () => rotate(90);
els.duplicatePageButton.onclick = duplicatePage;
els.deletePageButton.onclick = deletePage;
els.extractPageButton.onclick = extractPages;
els.splitButton.onclick = () => els.splitDialog.showModal();
els.splitForm.onsubmit = splitPdf;
els.splitDialog.querySelector('[value="cancel"]').onclick = () => els.splitDialog.close();
els.deleteTextButton.onclick = deleteSelected;
els.deleteObjectButton.onclick = deleteSelected;
els.annotationLayer.onclick = () => {
  state.selectedId = null;
  renderAnnotations();
};
els.annotationLayer.addEventListener("pointerdown", startDrawing);
els.annotationLayer.addEventListener("pointerdown", startMask);
els.textValue.onfocus = () => (els.textValue.dataset.before = snapshot());
els.textValue.oninput = () => {
  const o = selectedObject();
  if (!o) return;
  o.text = els.textValue.value;
  const node = els.annotationLayer.querySelector(`[data-id="${o.id}"]`);
  if (node) node.textContent = o.text;
};
els.textValue.onchange = () => {
  commit(els.textValue.dataset.before || snapshot(), "Edit text");
  announce("Text updated.");
};
els.fontSize.onchange = () => {
  const o = selectedObject();
  if (o) {
    mutate("Change text size", () => (o.fontSize = Number(els.fontSize.value)));
    renderAnnotations();
  }
};
els.textColor.onchange = () => {
  const o = selectedObject();
  if (o) {
    mutate("Change text color", () => (o.color = els.textColor.value));
    renderAnnotations();
  }
};
els.objectOpacity.onchange = () => {
  const o = selectedObject();
  if (o) {
    mutate("Change opacity", () => (o.opacity = Number(els.objectOpacity.value) / 100));
    renderAnnotations();
  }
};
els.zoomInButton.onclick = () => {
  state.zoom = Math.min(3, state.zoom + 0.1);
  renderCurrent();
};
els.zoomOutButton.onclick = () => {
  state.zoom = Math.max(0.5, state.zoom - 0.1);
  renderCurrent();
};
els.fitButton.onclick = () => {
  state.zoom = 1;
  renderCurrent();
};
els.privacyButton.onclick = () => els.privacyDialog.showModal();
for (const name of ["dragenter", "dragover"])
  els.dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    els.dropZone.classList.add("dragover");
  });
for (const name of ["dragleave", "drop"])
  els.dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    els.dropZone.classList.remove("dragover");
  });
els.dropZone.addEventListener("drop", (e) => openFile(e.dataTransfer.files[0]));
window.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey,
    key = e.key.toLowerCase();
  if (mod && key === "o") {
    e.preventDefault();
    els.fileInput.click();
  }
  if (mod && key === "s" && state.pages.length) {
    e.preventDefault();
    exportPdf();
  }
  if (mod && key === "z") {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
  }
  if (mod && key === "y") {
    e.preventDefault();
    redo();
  }
  if (!mod && e.key === "+" && state.pages.length) els.zoomInButton.click();
  if (!mod && e.key === "-" && state.pages.length) els.zoomOutButton.click();
  if (!mod && e.key === "0" && state.pages.length) els.fitButton.click();
  if (e.key === "Escape" && state.mode === "draw") setMode("select");
});
window.addEventListener("resize", () => {
  if (state.pages.length) renderCurrent();
});
window.addEventListener("beforeunload", () => {
  for (const asset of state.assets.values()) URL.revokeObjectURL(asset.url);
});
