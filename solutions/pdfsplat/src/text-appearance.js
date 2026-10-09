// Reuse PDF.js's loaded font in the editor; export with the closest standard family.
export function textAppearance(font = {}, fallback = 'sans-serif') {
  const name = font.name || '', family = /courier|mono|consolas/i.test(name + ' ' + fallback) ? 'Courier' : /times|georgia|serif/i.test(name + ' ' + fallback.replace(/sans-serif/gi, '')) ? 'Times' : 'Helvetica';
  const css = family === 'Times' ? '"Times New Roman", Times, serif' : family === 'Courier' ? '"Courier New", Courier, monospace' : 'Arial, Helvetica, sans-serif';
  const bold = !!font.bold || /bold|black|heavy|semibold/i.test(name), italic = !!font.italic || /italic|oblique/i.test(name);
  const embedded = !!font.loadedName && !font.missingFile;
  return {sourceBold:bold, sourceItalic:italic, exactFont:embedded, fallbackFontFamily:css, fontFamily: font.loadedName && !font.missingFile ? `"${font.loadedName}", ${css}` : css,
    pdfFontFamily: family, bold, italic};
}
export function standardTextFont(object) {
  const family = object.pdfFontFamily || 'Helvetica';
  if (family === 'Times') return object.bold && object.italic ? 'TimesRomanBoldItalic' : object.bold ? 'TimesRomanBold' : object.italic ? 'TimesRomanItalic' : 'TimesRoman';
  if (family === 'Courier') return object.bold && object.italic ? 'CourierBoldOblique' : object.bold ? 'CourierBold' : object.italic ? 'CourierOblique' : 'Courier';
  return object.bold && object.italic ? 'HelveticaBoldOblique' : object.bold ? 'HelveticaBold' : object.italic ? 'HelveticaOblique' : 'Helvetica';
}
// Sample only the original rendered PDF, not editable overlays. Quantized groups
// consolidate antialiasing; contrast separates ink from the dominant background.
export function textInkAppearance(canvas, bounds, viewport) {
  const sx = canvas.width / viewport.width, sy = canvas.height / viewport.height;
  const x = Math.max(0, Math.floor(bounds.left * sx)), y = Math.max(0, Math.floor(bounds.top * sy));
  const w = Math.min(canvas.width - x, Math.ceil(bounds.width * sx)), h = Math.min(canvas.height - y, Math.ceil(bounds.height * sy));
  if (w <= 0 || h <= 0) return {color:'#172033',coverColor:'#ffffff'};
  const pixels = canvas.getContext('2d').getImageData(x, y, w, h).data, groups = new Map();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i+3] < 128) continue;
    const rgb = [pixels[i],pixels[i+1],pixels[i+2]], key = rgb.map(v => v >> 3).join(',');
    if (!groups.has(key)) groups.set(key,{count:0, colors:new Map(),rgb});
    const group = groups.get(key), exact = rgb.join(','); group.count++; group.colors.set(exact,(group.colors.get(exact)||0)+1);
  }
  const sorted = [...groups.values()].sort((a,b)=>b.count-a.count), background = sorted[0];
  if (!background) return {color:'#172033',coverColor:'#ffffff'};
  let ink, best = 0;
  for (const group of sorted.slice(1)) {
    const contrast = Math.hypot(...group.rgb.map((v,i)=>v-background.rgb[i]));
    const score = contrast * Math.sqrt(group.count);
    if (group.count >= 3 && contrast > 30 && score > best) {ink=group;best=score;}
  }
  const hex = group => '#'+[...group.colors].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(v=>Number(v).toString(16).padStart(2,'0')).join('');
  return {color:ink ? hex(ink) : '#172033',coverColor:hex(background)};
}
