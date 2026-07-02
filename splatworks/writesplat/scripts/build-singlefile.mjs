import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const htmlPath = join(dist, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const iconPng = readFileSync(join(dist, 'writesplat_icon.png'));
const iconDataUrl = `data:image/png;base64,${Buffer.from(iconPng).toString('base64')}`;
const scriptMatch = /<script type="module" crossorigin src="([^"]+)"><\/script>/u.exec(html);
const styleMatch = /<link rel="stylesheet" crossorigin href="([^"]+)">/u.exec(html);

if (!scriptMatch || !styleMatch) {
  throw new Error('Could not locate built WriteSplat JS/CSS assets to inline.');
}

const scriptPath = distAssetPath(scriptMatch[1]);
const stylePath = distAssetPath(styleMatch[1]);
const script = readFileSync(scriptPath, 'utf8').replaceAll('writesplat_icon.png', iconDataUrl);
const style = readFileSync(stylePath, 'utf8');
const singleFileHtml = html
  .replace(/<link rel="icon" href="[^"]+" type="image\/png">/u, () => `<link rel="icon" href="${iconDataUrl}" type="image/png">`)
  .replace(/<link rel="apple-touch-icon" href="[^"]+">/u, () => `<link rel="apple-touch-icon" href="${iconDataUrl}">`)
  .replace(scriptMatch[0], () => `<script type="module">\n${script}\n</script>`)
  .replace(styleMatch[0], () => `<style>\n${style}\n</style>`);

writeFileSync(join(dist, 'writesplat-singlefile.html'), singleFileHtml);
console.log('Built dist/writesplat-singlefile.html');

function distAssetPath(assetUrl) {
  const relative = assetUrl.replace(/^\/splatworks\/writesplat\//u, '').replace(/^\//u, '');
  return join(dist, relative);
}
