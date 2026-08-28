const FAVORITES_KEY = "drawsplat.favorites", RECENTS_KEY = "drawsplat.recents", MAX_RECENTS = 8;
function read(key) { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value.filter((id) => typeof id === "string") : []; } catch { return []; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} return value; }
export function getFavorites() { return read(FAVORITES_KEY); }
export function isFavorite(id) { return getFavorites().includes(id); }
export function toggleFavorite(id) { const values = getFavorites(), next = values.includes(id) ? values.filter((value) => value !== id) : [...values, id]; return write(FAVORITES_KEY, next); }
export function getRecents() { return read(RECENTS_KEY); }
export function addRecent(id) { return write(RECENTS_KEY, [id, ...getRecents().filter((value) => value !== id)].slice(0, MAX_RECENTS)); }
