const REGISTRY_URL = "/data/drawsplat-tools.json?v=3";
let registryPromise;

function validate(registry) {
  if (
    registry?.version !== 1 ||
    !Array.isArray(registry.categories) ||
    !Array.isArray(registry.tools)
  )
    throw Error("The DrawSplat tool registry has an unsupported format.");
  const categories = new Set(
    registry.categories.map((category) => category.id),
  );
  const ids = new Set();
  for (const tool of registry.tools) {
    for (const field of ["id", "name", "description", "url", "icon", "type"])
      if (!tool[field]) throw Error(`Registry tool is missing ${field}.`);
    if (ids.has(tool.id)) throw Error(`Duplicate tool ID: ${tool.id}`);
    ids.add(tool.id);
    if (
      !Array.isArray(tool.categories) ||
      tool.categories.some((id) => !categories.has(id))
    )
      throw Error(`Invalid category on ${tool.id}.`);
  }
  for (const tool of registry.tools)
    for (const related of tool.related || [])
      if (!ids.has(related))
        throw Error(`Unknown related tool ${related} on ${tool.id}.`);
  return registry;
}

export async function getRegistry() {
  registryPromise ||= fetch(REGISTRY_URL, {
    credentials: "same-origin",
    cache: "no-cache",
  })
    .then((response) => {
      if (!response.ok)
        throw Error(`Could not load DrawSplat tools (${response.status}).`);
      return response.json();
    })
    .then(validate);
  return registryPromise;
}

export async function getAll() {
  return (await getRegistry()).tools;
}
export async function getById(id) {
  return (await getAll()).find((tool) => tool.id === id);
}
export async function getByCategory(category) {
  return (await getAll()).filter((tool) => tool.categories.includes(category));
}
export async function getRelated(id) {
  const tools = await getAll(),
    lookup = new Map(tools.map((tool) => [tool.id, tool]));
  return (lookup.get(id)?.related || [])
    .map((related) => lookup.get(related))
    .filter(Boolean);
}
