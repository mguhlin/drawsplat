import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist']);
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(filePath);
    }
  }
}

function webPath(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function relativeHref(fromFile, assetPath) {
  const href = path.relative(path.dirname(fromFile), path.join(root, assetPath)).replaceAll(path.sep, '/');
  return href || path.basename(assetPath);
}

function iconFor(filePath) {
  const file = webPath(filePath);
  if (file === 'games/squirrel-run-game/index.html') return 'assets/favicons/squirrel-run.svg';
  if (file.startsWith('solutions/splatimage-studio/')) return 'assets/favicons/splatimage-studio.svg';
  if (file.startsWith('solutions/markdown-studio/')) return 'assets/favicons/markdown.svg';
  if (file.startsWith('games/') || file.startsWith('solutions/dotsboxes/')) return 'assets/favicons/games.svg';
  if (file.startsWith('solutions/')) return 'assets/favicons/tools.svg';
  if (file.startsWith('app/') || file.endsWith('/whiteboard.html')) return 'assets/favicons/whiteboard.svg';
  if (file.startsWith('admin/')) return 'assets/favicons/admin.svg';
  if (file.startsWith('hub/')) return 'assets/favicons/hub.svg';
  if (file.startsWith('blog/')) return 'assets/favicons/blog.svg';
  if (file.startsWith('guides/') || file.startsWith('legal/') || file.startsWith('docs/')) return 'assets/favicons/docs.svg';
  return 'assets/favicons/drawsplat.svg';
}

function faviconBlock(filePath) {
  const icon = relativeHref(filePath, iconFor(filePath));
  const apple = relativeHref(filePath, 'assets/brand/DrawSplat_logo.png');
  const manifest = relativeHref(filePath, 'site.webmanifest');
  return `
<!-- DrawSplat favicons -->
<link rel="icon" href="${icon}" type="image/svg+xml" />
<link rel="apple-touch-icon" href="${apple}" />
<link rel="manifest" href="${manifest}" />
<meta name="theme-color" content="#7c3aed" />
<!-- /DrawSplat favicons -->`;
}

function apply(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  if (!/<head[\s>]/i.test(original)) return false;

  let html = original
    .replace(/\n?<!-- DrawSplat favicons -->[\s\S]*?<!-- \/DrawSplat favicons -->\n?/g, '\n')
    .replace(/\n<link\s+rel=["'](?:icon|alternate icon|apple-touch-icon|manifest)["'][^>]*>\s*/gi, '\n')
    .replace(/\n<meta\s+name=["']theme-color["'][^>]*>\s*/gi, '\n');

  html = html.replace(/<head([^>]*)>/i, `<head$1>${faviconBlock(filePath)}`);
  if (html === original) return false;
  fs.writeFileSync(filePath, html);
  return true;
}

walk(root);
const changed = htmlFiles.filter(apply).length;
console.log(JSON.stringify({ htmlFiles: htmlFiles.length, changed }, null, 2));
