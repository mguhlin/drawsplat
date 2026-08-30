import { getRegistry } from "./tool-registry.js?v=2";
import { searchTools } from "./tool-search.js";
import {
  addRecent,
  getFavorites,
  getRecents,
  toggleFavorite,
} from "./tool-preferences.js";

const $ = (selector, root = document) => root.querySelector(selector);
const state = { registry: null, category: "all", query: "", type: "all" };

function toolCard(tool, compact = false) {
  const article = document.createElement("article");
  article.className = `ds-tool-card${compact ? " compact" : ""}`;
  article.dataset.id = tool.id;
  const favorite = document.createElement("button");
  favorite.className = "ds-favorite";
  favorite.type = "button";
  favorite.setAttribute(
    "aria-label",
    `${getFavorites().includes(tool.id) ? "Remove" : "Add"} ${tool.name} ${getFavorites().includes(tool.id) ? "from" : "to"} favorites`,
  );
  favorite.setAttribute(
    "aria-pressed",
    String(getFavorites().includes(tool.id)),
  );
  favorite.textContent = getFavorites().includes(tool.id) ? "★" : "☆";
  favorite.onclick = () => {
    toggleFavorite(tool.id);
    render();
  };
  const link = document.createElement("a");
  link.href = tool.url;
  link.className = "ds-tool-link";
  link.onclick = () => addRecent(tool.id);
  const image = document.createElement("img");
  image.src = tool.icon;
  image.alt = "";
  image.loading = "lazy";
  const heading = document.createElement("h3");
  heading.textContent = tool.name;
  const description = document.createElement("p");
  description.textContent = tool.description;
  const badge = document.createElement("span");
  badge.className = "ds-tool-badge";
  badge.textContent =
    state.registry.categories.find(
      (category) => category.id === tool.categories[0],
    )?.name || tool.type;
  link.append(image, heading, description, badge);
  article.append(favorite, link);
  return article;
}

function renderShelf(selector, ids) {
  const section = $(selector),
    grid = $(".ds-shelf-grid", section),
    tools = ids
      .map((id) => state.registry.tools.find((tool) => tool.id === id))
      .filter(Boolean);
  section.hidden = !tools.length;
  grid.replaceChildren(...tools.map((tool) => toolCard(tool, true)));
}

function renderRecents(ids) {
  const section = $("#recentsShelf"),
    list = $(".ds-recent-links", section),
    tools = ids
      .map((id) => state.registry.tools.find((tool) => tool.id === id))
      .filter(Boolean);
  section.hidden = !tools.length;
  list.replaceChildren(
    ...tools.map((tool) => {
      const link = document.createElement("a");
      link.href = tool.url;
      link.textContent = tool.name;
      link.onclick = () => addRecent(tool.id);
      return link;
    }),
  );
}

function render() {
  const categoryLookup = new Map(
    state.registry.categories.map((category) => [category.id, category]),
  );
  let tools = searchTools(
    state.registry.tools,
    state.query,
    state.category === "all" ? [] : [state.category],
    categoryLookup,
  );
  if (state.type !== "all")
    tools = tools.filter((tool) => tool.type === state.type);
  const grid = $("#toolGrid");
  grid.replaceChildren(...tools.map((tool) => toolCard(tool)));
  $("#resultStatus").textContent =
    `${tools.length} ${tools.length === 1 ? "result" : "results"}`;
  renderShelf("#favoritesShelf", getFavorites());
  renderRecents(getRecents());
}

async function init() {
  try {
    state.registry = await getRegistry();
    const params = new URLSearchParams(location.search),
      requestedCategory = params.get("category"),
      requestedQuery = params.get("q");
    if (
      requestedCategory &&
      state.registry.categories.some(
        (category) => category.id === requestedCategory,
      )
    )
      state.category = requestedCategory;
    if (requestedQuery) state.query = requestedQuery;
    const filters = $("#categoryFilters");
    for (const category of state.registry.categories) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.category = category.id;
      button.setAttribute("aria-pressed", "false");
      button.textContent = `${category.icon} ${category.shortName}`;
      filters.append(button);
    }
    filters.onclick = (event) => {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      state.category = button.dataset.category;
      filters
        .querySelectorAll("button")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      render();
    };
    $("#toolSearch").value = state.query;
    if (state.category !== "all")
      filters
        .querySelector(`[data-category="${state.category}"]`)
        ?.setAttribute("aria-pressed", "true");
    filters
      .querySelector('[data-category="all"]')
      .setAttribute("aria-pressed", String(state.category === "all"));
    $("#toolSearch").oninput = (event) => {
      state.query = event.target.value;
      render();
    };
    $("#typeFilter").onchange = (event) => {
      state.type = event.target.value;
      render();
    };
    render();
  } catch (error) {
    $("#resultStatus").textContent = error.message;
    console.error(error);
  }
}
init();
