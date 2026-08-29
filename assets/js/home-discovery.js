import { getRegistry } from "./tool-registry.js";
import { searchTools } from "./tool-search.js";
import { addRecent, getFavorites, getRecents } from "./tool-preferences.js";
const $ = (selector, root = document) => root.querySelector(selector);
let registry, categoryLookup;
function resultLink(tool, card = false) { const link = document.createElement("a"); link.href = tool.url; link.className = card ? "home-tool-card" : "home-search-result"; link.onclick = () => addRecent(tool.id); const image = document.createElement("img"); image.src = tool.icon; image.alt = ""; const text = document.createElement("div"), name = document.createElement(card ? "h3" : "strong"), description = document.createElement("p"); name.textContent = tool.name; description.textContent = tool.description; text.append(name, description); link.append(image, text); return link; }
function renderShelf(selector, ids) { const section = $(selector), tools = ids.map((id) => registry.tools.find((tool) => tool.id === id)).filter(Boolean).slice(0, 5); section.hidden = !tools.length; $("div", section).replaceChildren(...tools.map((tool) => resultLink(tool))); return tools.length; }
async function init() {
  registry = await getRegistry(); categoryLookup = new Map(registry.categories.map((category) => [category.id, category]));
  const preferred = ["concept-map", "splatimage", "graphsplat", "quiz-flashcards", "videosplat", "markdown-studio"];
  $("#homeFeatured").replaceChildren(...preferred.map((id) => registry.tools.find((tool) => tool.id === id)).filter(Boolean).map((tool) => resultLink(tool, true)));
  const search = $("#homeSearch"), results = $("#homeSearchResults");
  search.oninput = () => { const query = search.value.trim(); if (!query) { results.hidden = true; results.replaceChildren(); return; } const tools = searchTools(registry.tools, query, [], categoryLookup).slice(0, 7); results.replaceChildren(...tools.map((tool) => resultLink(tool))); results.hidden = false; };
  search.onkeydown = (event) => { if (event.key === "Escape") { search.value = ""; results.hidden = true; } };
  const personalCount = renderShelf("#homeFavorites", getFavorites()) + renderShelf("#homeRecents", getRecents()); $("#yourDrawSplat").hidden = !personalCount;
}
init().catch((error) => console.error(error));
