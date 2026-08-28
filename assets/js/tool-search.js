const normalize = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const words = (value) => normalize(value).split(/\s+/).filter(Boolean);

export function scoreTool(tool, query, categoryNames = []) {
  const q = normalize(query);
  if (!q) return 1;
  const name = normalize(tool.name), aliases = (tool.aliases || []).map(normalize), keywords = (tool.keywords || []).map(normalize), description = normalize(tool.description), categories = categoryNames.map(normalize);
  let score = 0;
  if (name === q) score += 100;
  if (name.startsWith(q)) score += 80;
  if (aliases.includes(q)) score += 75;
  if (keywords.includes(q)) score += 60;
  if (name.includes(q)) score += 50;
  if (aliases.some((alias) => alias.includes(q) || q.includes(alias))) score += 45;
  if (keywords.some((keyword) => keyword.includes(q) || q.includes(keyword))) score += 35;
  if (description.includes(q)) score += 20;
  if (categories.some((category) => category.includes(q))) score += 10;
  for (const token of words(q)) {
    if (words(name).includes(token)) score += 12;
    if (aliases.some((alias) => words(alias).includes(token))) score += 9;
    if (keywords.some((keyword) => words(keyword).includes(token))) score += 7;
    if (words(description).includes(token)) score += 3;
  }
  return score;
}

export function searchTools(tools, query, categories = [], categoryLookup = new Map()) {
  return tools.map((tool, index) => ({ tool, index, score: scoreTool(tool, query, tool.categories.map((id) => categoryLookup.get(id)?.name || id)) }))
    .filter((result) => result.score > 0 && (!categories.length || categories.some((category) => result.tool.categories.includes(category))))
    .sort((a, b) => b.score - a.score || Number(b.tool.featured) - Number(a.tool.featured) || a.index - b.index)
    .map((result) => result.tool);
}
