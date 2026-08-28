import { getRegistry } from "./tool-registry.js";
import { searchTools } from "./tool-search.js";
import { addRecent, getFavorites, getRecents } from "./tool-preferences.js";

let launcher;
function toolLink(tool) { const link = document.createElement("a"); link.href = tool.url; link.onclick = () => addRecent(tool.id); const image = document.createElement("img"); image.src = tool.icon; image.alt = ""; const label = document.createElement("span"); label.textContent = tool.name; link.append(image, label); return link; }
async function createLauncher() {
  if (launcher) return launcher;
  const registry = await getRegistry(), lookup = new Map(registry.tools.map((tool) => [tool.id, tool])), categoryLookup = new Map(registry.categories.map((category) => [category.id, category]));
  launcher = document.createElement("dialog"); launcher.className = "ds-launcher"; launcher.setAttribute("aria-labelledby", "dsLauncherTitle");
  launcher.innerHTML = `<div class="ds-launcher-head"><div><small>DRAWsPLAT APPS</small><h2 id="dsLauncherTitle">What do you want to do?</h2></div><button type="button" class="ds-launcher-close" aria-label="Close apps launcher">×</button></div><label class="ds-launcher-search"><span>Search tools</span><input type="search" placeholder="Try “slides” or “picture graph”"></label><div class="ds-launcher-personal"></div><div class="ds-launcher-results"></div><a class="ds-launcher-all" href="/studio/">View all DrawSplat tools →</a>`;
  document.body.append(launcher);
  const input = launcher.querySelector("input"), results = launcher.querySelector(".ds-launcher-results"), personal = launcher.querySelector(".ds-launcher-personal");
  const render = () => {
    const query = input.value, tools = searchTools(registry.tools, query, [], categoryLookup).slice(0, 12); results.replaceChildren(...tools.map(toolLink));
    const personalTools = [...new Set([...getFavorites(), ...getRecents()])].map((id) => lookup.get(id)).filter(Boolean).slice(0, 4);
    personal.hidden = Boolean(query) || !personalTools.length; personal.replaceChildren(...personalTools.map(toolLink));
  };
  input.oninput = render; launcher.querySelector(".ds-launcher-close").onclick = () => launcher.close(); launcher.onclick = (event) => { if (event.target === launcher) launcher.close(); }; render();
  launcher.openLauncher = () => { input.value = ""; render(); launcher.showModal(); requestAnimationFrame(() => input.focus()); };
  return launcher;
}
for (const trigger of document.querySelectorAll("[data-ds-app-launcher]")) trigger.addEventListener("click", async () => (await createLauncher()).openLauncher());
