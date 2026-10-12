// Static-host fallback; keep query parameters and fragments on old bookmarks.
const target = new URL('../gifsplat/', location.href);
target.search = location.search;
target.hash = location.hash;
location.replace(target.href);
