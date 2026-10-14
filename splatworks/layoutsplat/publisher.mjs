import { newPublication, uid, frame, shape, textStyle, validatePublication } from './engine.mjs';
import { color, length } from './compatibility.mjs';
import { importMedia, readData } from './media.mjs';
import { matchImportedFont } from './font-matching.mjs';
const value = (p, key, fallback = '') => p?.[key]?.value ?? p?.[key] ?? fallback;
const measure = (p, key, fallback = 0) => { const item = p?.[key]; if (!item) return fallback; if (typeof item === 'object' && Number.isFinite(item.number)) { if (item.unit === 0) return item.number * 72; if (item.unit === 2) return item.number; if (item.unit === 3) return item.number / 20; if (item.unit === 4) return item.number; } return length(value(p, key), fallback); };
const numeric = (p, key, fallback = 0) => { const n = Number.parseFloat(value(p, key)); return Number.isFinite(n) ? n : fallback; };
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const opacity = (p, key) => { const raw = value(p, key, '100%'); return clamp(parseFloat(raw) / (String(raw).endsWith('%') ? 100 : 1), 0, 1); };
function pathGeometry(data) {
  const segments = data['svg:d'] || data['svg:points'] || data['librevenge:path'] || [], commands = [];
  for (const s of segments) {
    const action = value(s, 'librevenge:path-action', value(s, 'svg:command', 'L')).toUpperCase(), x = measure(s, 'svg:x'), y = measure(s, 'svg:y');
    if (action === 'M' || action === 'L') commands.push(`${action}${x} ${y}`);
    if (action === 'C') commands.push(`C${measure(s, 'svg:x1')} ${measure(s, 'svg:y1')} ${measure(s, 'svg:x2')} ${measure(s, 'svg:y2')} ${x} ${y}`);
    if (action === 'Q') commands.push(`Q${measure(s, 'svg:x1')} ${measure(s, 'svg:y1')} ${x} ${y}`);
    if (action === 'A') commands.push(`A${measure(s, 'svg:rx')} ${measure(s, 'svg:ry')} ${numeric(s, 'librevenge:rotate')} ${value(s, 'librevenge:large-arc') === 'true' ? 1 : 0} ${value(s, 'librevenge:sweep') === 'true' ? 1 : 0} ${x} ${y}`);
    if (action === 'Z') commands.push('Z');
  }
  if (!commands.length) return null; if (commands[0][0] !== 'M') commands[0] = 'M' + commands[0].slice(1); const path = commands.join(' '); if (path.length > 64000) throw Error('Publisher path is too complex.');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), el = document.createElementNS(svg.namespaceURI, 'path'); el.setAttribute('d', path); svg.style.cssText = 'position:fixed;left:-30000px;top:0;visibility:hidden'; svg.append(el); document.body.append(svg);
  try { const box = el.getBBox(); return { path, box: { x: box.x, y: box.y, w: Math.max(6, box.width), h: Math.max(6, box.height) } }; } finally { svg.remove(); }
}
export async function publicationFromPublisher(events, filename = 'Publisher publication', {customFonts={}} = {}) {
  if (!Array.isArray(events) || events.length > 100000) throw Error('Invalid Publisher drawing data.');
  const d = newPublication(true); if(Object.keys(customFonts).length)d.customFonts=structuredClone(customFonts); d.pages = []; d.title = filename.replace(/\.pub$/i, '').slice(0, 200); const warnings = ['Native Publisher decoded inside this browser. Text and supported objects remain editable; verify fonts, text flow, effects, and page appearance before printing.'], fonts = new Set();
  let page, style = {}, text, paragraph = {}, span = {}, table, cell, groups = [], paragraphCount = 0, masterMode = false, paragraphStart = 0;
  const pictures = new Map(), substitutedFonts = new Map();
  function pictureCrop(p) {
    const top=numeric(p,'layoutsplat:crop-top'),bottom=numeric(p,'layoutsplat:crop-bottom'),left=numeric(p,'layoutsplat:crop-left'),right=numeric(p,'layoutsplat:crop-right');
    if(![top,bottom,left,right].some(Boolean))return undefined;
    const w=1-left-right,h=1-top-bottom,crop={x:-left/w,y:-top/h,w:1/w,h:1/h};
    if(w<=0||h<=0||Object.values(crop).some(n=>!Number.isFinite(n)||Math.abs(n)>40)){warnings.push('A Publisher picture has unsupported crop bounds. Review its framing.');return undefined;}return crop;
  }
  async function picture(binary, mime) {
    if (typeof binary !== 'string' || binary.length > 64000000 || !/^[A-Za-z0-9+/=\s]*$/.test(binary)) throw Error('Invalid embedded Publisher picture.');
    const encoded = binary.replace(/\s/g, ''), key = `${mime}:${encoded}`;
    if (pictures.has(key)) return pictures.get(key);
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0)), ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/bmp': 'bmp', 'image/tiff': 'tiff', 'image/x-emf': 'emf', 'image/x-wmf': 'wmf' }[mime] || 'bin';
    let asset;
    if (['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      const image = new Image(), src = `data:${mime};base64,${encoded}`; image.src = src; await image.decode();
      if (!image.naturalWidth || image.naturalWidth > 20000 || image.naturalHeight > 20000 || image.naturalWidth * image.naturalHeight > 40000000) throw Error('Publisher picture exceeds the image size limit.');
      asset = { name: `Publisher picture.${ext}`, alt: '', width: image.naturalWidth, height: image.naturalHeight, src };
    } else { asset = await importMedia(new File([bytes], `Publisher picture.${ext}`, { type: mime })); warnings.push(...(asset.notes || [])); delete asset.notes; }
    const id = uid(); d.assets[id] = asset; pictures.set(key, id); return id;
  }
  function closeParagraph() {
    if (!text) return; const story = d.stories[text.storyId];
    const size = story.marks.find(m => m.from <= paragraphStart && m.to > paragraphStart)?.size || story.style.size;
    const raw = value(paragraph, 'fo:line-height'), relative = paragraph['fo:line-height']?.unit === 1 || String(raw).endsWith('%');
    const multiple = relative ? clamp(parseFloat(raw) / 100, .5, 6) : undefined;
    story.paragraphs.push({ from: paragraphStart, to: story.text.length, leading: clamp(relative ? size * multiple : measure(paragraph, 'fo:line-height', size * 1.15), 6, 360), ...(relative ? { lineMultiple: multiple } : {}), align: ['left', 'center', 'right', 'justify'].includes(value(paragraph, 'fo:text-align')) ? value(paragraph, 'fo:text-align') : 'left', spaceBefore: clamp(measure(paragraph, 'fo:margin-top'), 0, 360), spaceAfter: clamp(measure(paragraph, 'fo:margin-bottom'), 0, 360), indentLeft: clamp(measure(paragraph, 'fo:margin-left'), 0, 360), indentRight: clamp(measure(paragraph, 'fo:margin-right'), 0, 360), firstLineIndent: clamp(measure(paragraph, 'fo:text-indent'), -360, 360) });
  }
  const geometry = p => ({ x: measure(p, 'svg:x'), y: measure(p, 'svg:y'), w: clamp(measure(p, 'svg:width', 200), 6, 2000), h: clamp(measure(p, 'svg:height', 100), 6, 2000), rotation: clamp(numeric(p, 'librevenge:rotate', numeric(p, 'draw:rotate')), -360, 360) });
  const add = o => { if (!page || page.objects.length >= 200) throw Error('Publisher pages support up to 200 objects.'); o.groupIds = [...groups]; page.objects.push(o); };
  function append(words) {
    // libmspub includes the paragraph terminator in text and also emits paragraph events.
    words = words.replace(/\r/g, '');
    if (table && cell) { cell.text += words; return; } if (!text) return;
    const story = d.stories[text.storyId], from = story.text.length; story.text += words; if (story.text.length > 100000) throw Error('Publisher story is too long.'); if (story.text.length === from) return;
    const originalFont = value(span, 'style:font-name', value(span, 'fo:font-family', story.style.font)), font = matchImportedFont(originalFont, customFonts, /bold|[6-9]00/.test(value(span,'fo:font-weight'))?700:400, value(span,'fo:font-style')==='italic'); fonts.add(originalFont); if(!Object.hasOwn(customFonts,font)&&originalFont!==font)substitutedFonts.set(originalFont,font);
    const mark = { from, to: story.text.length, font, size: clamp(measure(span, 'fo:font-size', story.style.size), 6, 120), color: color(value(span, 'fo:color'), story.style.color), bold: /bold|[6-9]00/.test(value(span, 'fo:font-weight')), italic: value(span, 'fo:font-style') === 'italic', underline: value(span, 'style:text-underline-style', 'none') !== 'none' };
    story.marks.push(mark); if (from === 0) { story.style.font = font; story.style.size = mark.size; story.style.color = mark.color; story.style.weight = mark.bold ? 'bold' : 'normal'; const rawLeading = value(paragraph, 'fo:line-height'), relativeLeading = paragraph['fo:line-height']?.unit === 1 || String(rawLeading).endsWith('%'); story.style.lineHeight = clamp(relativeLeading ? parseFloat(rawLeading) / 100 : measure(paragraph, 'fo:line-height', mark.size * 1.15) / mark.size, 1, 3); const rawScale = numeric(span, 'fo:text-scale', 100); story.style.textScale = clamp(rawScale > 1000 ? rawScale / 10000 : rawScale / 100, .5, 2); }
  }
  for (const event of events) {
    const p = event.data || {};
    if (event.op === 'startMasterPage') { masterMode = true; warnings.push('Publisher master-page objects are not applied. Review recurring headers, footers, and backgrounds.'); continue; }
    if (event.op === 'endMasterPage') { masterMode = false; continue; }
    if (masterMode) continue;
    switch (event.op) {
      case 'startPage': {
        if (d.pages.length >= 500) throw Error('Publisher publications support up to 500 pages.'); const width = measure(p, 'svg:width', 612), height = measure(p, 'svg:height', 792);
        if (!d.pages.length) { d.width = width; d.height = height; d.margin = Math.min(36, Math.min(width, height) / 8); }
        else if (Math.abs(width - d.width) > .1 || Math.abs(height - d.height) > .1) warnings.push('Mixed Publisher page sizes use the first page size. Review page edges.');
        page = { id: uid(), objects: [] }; d.pages.push(page); groups = []; break;
      }
      case 'setStyle': style = p; break;
      case 'openGroup': groups.push(uid()); break;
      case 'closeGroup': groups.pop(); break;
      case 'startTextObject': {
        const g = geometry(p), key = uid(); text = frame(key, g.x, g.y, g.w, g.h); text.rotation = g.rotation; text.padding = clamp(measure(p, 'fo:padding-left'), 0, 36);
        text.insets = Object.fromEntries(['left', 'right', 'top', 'bottom'].map(edge => [edge, clamp(measure(p, `fo:padding-${edge}`, text.padding), 0, 36)]));
        text.columns = clamp(Math.round(numeric(p, 'fo:column-count', 1)), 1, 6); text.columnGap = clamp(measure(p, 'fo:column-gap', 12), 0, 72);
        d.stories[key] = { text: '', style: { ...textStyle(), lineHeight: 1.15 }, marks: [], paragraphs: [], frames: [text.id] }; add(text); paragraphCount = 0; paragraphStart = 0; break;
      }
      case 'endTextObject': { const story = d.stories[text?.storyId]; if (story?.paragraphs.length === 1 && story.paragraphs[0].leading > text.h - 2 * text.padding && story.paragraphs[0].leading <= text.h) { text.padding = 0; text.insets = { left: 0, right: 0, top: 0, bottom: 0 }; warnings.push('A tight Publisher headline uses zero frame padding to preserve its original leading.'); } text = null; break; }
      case 'openParagraph': case 'openListElement': {
        paragraph = p; if (paragraphCount++ && (text || cell?.text)) append('\n'); if (text) { const s = d.stories[text.storyId].style, align = value(p, 'fo:text-align'); if (['left', 'center', 'right', 'justify'].includes(align)) s.align = align; if (value(p, 'style:writing-mode') === 'rl-tb' || value(p, 'fo:direction') === 'rtl') s.direction = 'rtl'; }
        if (text) paragraphStart = d.stories[text.storyId].text.length;
        if (event.op === 'openListElement') append('• '); break;
      }
      case 'closeParagraph': case 'closeListElement': closeParagraph(); break;
      case 'openSpan': span = p; break;
      case 'closeSpan': span = {}; break;
      case 'insertText': append(typeof p === 'string' ? p : ''); break;
      case 'insertSpace': append(' '); break;
      case 'insertTab': append('\t'); break;
      case 'insertLineBreak': append('\n'); break;
      case 'insertField': append(value(p, 'librevenge:field-type', '[field]')); warnings.push('Review dynamic Publisher fields after conversion.'); break;
      case 'drawRectangle': case 'drawEllipse': case 'drawPolygon': case 'drawPolyline': case 'drawPath': case 'drawConnector': {
        let g = geometry(p), path;
        if (['drawPath', 'drawPolygon', 'drawPolyline'].includes(event.op)) { path = pathGeometry(p); if (path) g = { ...path.box, rotation: 0 }; }
        if (event.op === 'drawEllipse' && p['svg:cx']) { const rx = measure(p, 'svg:rx'), ry = measure(p, 'svg:ry'); g = { x: measure(p, 'svg:cx') - rx, y: measure(p, 'svg:cy') - ry, w: Math.max(6, rx * 2), h: Math.max(6, ry * 2), rotation: 0 }; }
        if (value(style, 'draw:fill') === 'bitmap') {
          const mime = value(style, 'librevenge:mime-type', 'image/png');
          try { const assetId = await picture(value(style, 'draw:fill-image'), mime),crop=pictureCrop(style); add({ id: uid(), type: 'image', assetId, ...g, fit: 'stretch', opacity: opacity(style, 'draw:opacity'), locked: false, ...(crop?{crop}:{}), ...(path ? { path: path.path, pathViewBox: [path.box.x, path.box.y, path.box.w, path.box.h] } : {}) }); if (value(style, 'style:repeat', 'stretch') !== 'stretch') warnings.push('A repeated Publisher bitmap fill is stretched; review its appearance.'); }
          catch { warnings.push(`An embedded ${mime} bitmap fill could not be decoded. Replace its placeholder; the original PUB is preserved.`); add(shape(g.x, g.y, g.w, g.h, '#eeeaf6')); } break;
        }
        const o = shape(g.x, g.y, g.w, g.h, color(value(style, 'draw:fill-color'), '#ede7fb'), path ? 'path' : event.op === 'drawEllipse' ? 'ellipse' : 'rect'); o.rotation = g.rotation; o.noFill = value(style, 'draw:fill') === 'none'; o.stroke = color(value(style, 'svg:stroke-color'), '#25304b'); o.strokeWidth = value(style, 'draw:stroke') === 'none' ? 0 : clamp(measure(style, 'svg:stroke-width'), 0, 20); o.opacity = opacity(style, 'draw:opacity');
        if (path) { o.path = path.path; o.pathViewBox = [path.box.x, path.box.y, path.box.w, path.box.h]; }
        const stops = style['svg:linearGradient'];
        if (value(style, 'draw:fill') === 'gradient' && Array.isArray(stops) && stops.length >= 2 && stops.length <= 100) { o.gradient = { type: value(style, 'libmspub:shade') === 'center' ? 'radial' : 'linear', angle: clamp(numeric(style, 'draw:angle') - 90, -360, 360), stops: stops.map(s => ({ offset: clamp(numeric(s, 'svg:offset') / 100, 0, 1), color: color(value(s, 'svg:stop-color')), opacity: opacity(s, 'svg:stop-opacity') })) }; }
        else if (value(style, 'draw:fill') && !['none', 'solid'].includes(value(style, 'draw:fill'))) warnings.push('A Publisher gradient/pattern has no usable color stops and uses a placeholder fill.'); add(o); break;
      }
      case 'drawGraphicObject': {
        const g = geometry(p), binary = value(p, 'office:binary-data'), mime = value(p, 'librevenge:mime-type', 'image/png');
        try { const assetId = await picture(binary, mime); add({ id: uid(), type: 'image', assetId, ...g, fit: 'stretch', locked: false }); }
        catch { warnings.push(`An embedded ${mime} picture could not be decoded. Replace its placeholder; the original PUB is preserved.`); add(shape(g.x, g.y, g.w, g.h, '#eeeaf6')); }
        break;
      }
      case 'startTableObject': table = { ...geometry(p), id: uid(), type: 'table', cells: [], header: false, fontSize: 10, locked: false }; break;
      case 'openTableRow': if (table) table.cells.push([]); break;
      case 'openTableCell': if (table) { if (!table.cells.length) table.cells.push([]); cell = { text: '' }; paragraphCount = 0; } break;
      case 'closeTableCell': if (table && cell) table.cells.at(-1).push(cell.text); cell = null; break;
      case 'endTableObject': if (table?.cells.length) { const cols = Math.max(...table.cells.map(r => r.length)); table.cells.forEach(r => { while (r.length < cols) r.push(''); }); if (cols) add(table); } table = null; cell = null; break;
      case 'defineEmbeddedFont': warnings.push('Embedded Publisher font data is not decoded. Matching imported font files are used when available.'); break;
    }
  }
  if (!d.pages.length) throw Error('The Publisher decoder produced no pages.'); d.importedFrom = 'Microsoft Publisher'; d.sourceFonts = [...fonts].filter(Boolean); if(substitutedFonts.size)warnings.push('Unavailable Publisher fonts were substituted: '+[...substitutedFonts].map(([source,target])=>source+' → '+target).join(', ')+'. Import original font files before opening the PUB for closer metrics.'); warnings.push('Matching imported font families and style variants are retained. Older files may require a legacy text encoding. Linked frames and advanced Publisher effects should be reviewed.');
  return { doc: validatePublication(d), warnings: [...new Set(warnings)] };
}
export async function importPublisher(file, { signal, onProgress = () => {}, encoding = 'auto', customFonts = {} } = {}) {
  if (!file.size || file.size > 32000000) throw Error('Choose a Publisher document smaller than 32 MB.');
  const bytes = await file.arrayBuffer(); signal?.throwIfAborted(); onProgress('Loading the local Publisher decoder…');
  const worker = new Worker(new URL('./publisher/worker.mjs', import.meta.url), { type: 'module' });
  const data = await new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); worker.terminate(); }, abort = () => { cleanup(); reject(Error('Publisher import cancelled.')); }, timer = setTimeout(() => { cleanup(); reject(Error('Publisher decoding timed out. Try a smaller publication.')); }, 45000);
    signal?.addEventListener('abort', abort, { once: true }); worker.onmessage = event => { cleanup(); event.data.error ? reject(Error(event.data.error)) : resolve(event.data); }; worker.onerror = event => { cleanup(); reject(Error(event.message || 'Publisher decoding failed.')); }; worker.postMessage({ bytes, encoding }, [bytes]);
  });
  signal?.throwIfAborted(); onProgress('Building editable Publisher pages…'); const result = await publicationFromPublisher(data.events, file.name, {customFonts});
  result.doc.originalPublisher = { name: file.name.slice(0, 200), src: await readData(new Blob([file], { type: 'application/octet-stream' })) }; return result;
}
