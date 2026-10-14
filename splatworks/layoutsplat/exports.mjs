import { publicationPage, exportHtml } from './render.mjs';
import { exportSvg } from './compatibility.mjs';
import { loadScript } from './media.mjs';
import { exportDesktop } from './desktop-formats.mjs';
import { portableHtml } from './fonts.mjs';
import { exportSuite } from './suite-interchange.mjs';
import {readingObjects} from './publication-fields.mjs';
import {appendRich} from './rich.mjs';
import {applyTextStyle} from './layout.mjs';
const pt = n => `${n}pt`;
export function pageRange(value, total) {
  if (!value.trim()) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set();
  for (const part of value.split(',')) { const match = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(part); if (!match) throw Error('Use page numbers or ranges, such as 1, 3-5.'); const a = Number(match[1]), b = Number(match[2] || a); if (a < 1 || b < a || b > total) throw Error('Page range is outside this publication.'); for (let i = a; i <= b; i++) pages.add(i - 1); }
  return [...pages].sort((a, b) => a - b);
}
export async function pageCanvas(doc, page, layout, ppi = 300, bleed = 0) {
  await document.fonts.ready;
  const width = doc.width + 2 * bleed, height = doc.height + 2 * bleed;
  if (width * ppi / 72 * height * ppi / 72 > 60000000) throw Error('This page exceeds 60 megapixels. Choose a lower resolution.');
  const holder = document.createElement('div'); Object.assign(holder.style, { position: 'fixed', left: '-30000px', top: '0', width: pt(width), height: pt(height), background: '#ffffff', overflow: 'hidden' });
  const rendered = publicationPage(doc, page, layout); Object.assign(rendered.style, { position: 'absolute', margin: '0', left: pt(bleed), top: pt(bleed), overflow: 'visible' }); holder.append(rendered); document.body.append(holder);
  try { await Promise.all([...holder.querySelectorAll('img')].map(image => image.decode().catch(() => {}))); return await html2canvas(holder, { scale: ppi / 96, backgroundColor: '#ffffff', logging: false, useCORS: false, windowWidth: Math.max(1200, Math.ceil(width * 96 / 72)), windowHeight: Math.max(1200, Math.ceil(height * 96 / 72)) }); }
  finally { holder.remove(); }
}
export const canvasBlob = (canvas, type = 'image/png') => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('Image export failed.')), type, .95));
export async function pdfProof(doc, layout, { pages = doc.pages.map((_, i) => i), ppi = 300, bleed = 0, cropMarks = false, profile, onProgress = () => {} } = {}) {
  await loadScript('vendor/pdf-lib.min.js', 'PDFLib'); const { PDFDocument, rgb, PDFName, PDFString } = PDFLib, pdf = await PDFDocument.create(), marks = cropMarks ? 18 : 0, inset = bleed + marks;
  pdf.setTitle(doc.title); pdf.setCreator('LayoutSplat'); pdf.setSubject('High-resolution flattened proof; use Print / Save as PDF for selectable text and vector objects.');
  for (let index = 0; index < pages.length; index++) {
    onProgress(index + 1, pages.length); const canvas = await pageCanvas(doc, doc.pages[pages[index]], layout, ppi, bleed), image = await pdf.embedPng(await (await canvasBlob(canvas)).arrayBuffer()), page = pdf.addPage([doc.width + 2 * inset, doc.height + 2 * inset]);
    page.drawImage(image, { x: marks, y: marks, width: doc.width + 2 * bleed, height: doc.height + 2 * bleed }); canvas.width = canvas.height = 1;
    page.setTrimBox(inset, inset, doc.width, doc.height); page.setBleedBox(marks, marks, doc.width + 2 * bleed, doc.height + 2 * bleed);
    if (cropMarks) { const line = (x1, y1, x2, y2) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: .5, color: rgb(0, 0, 0) }), left = inset, right = inset + doc.width, bottom = inset, top = inset + doc.height; for (const x of [left, right]) { line(x, 2, x, marks - 3); line(x, top + bleed + 3, x, top + bleed + marks - 2); } for (const y of [bottom, top]) { line(2, y, marks - 3, y); line(right + bleed + 3, y, right + bleed + marks - 2, y); } }
  }
  if (profile) {
    const bytes = new Uint8Array(await profile.arrayBuffer()); if (bytes.length < 128 || new TextDecoder().decode(bytes.slice(36, 40)) !== 'acsp' || !['RGB ', 'CMYK'].includes(new TextDecoder().decode(bytes.slice(16, 20)))) throw Error('Choose a valid RGB or CMYK ICC profile.');
    const components = new TextDecoder().decode(bytes.slice(16, 20)) === 'CMYK' ? 4 : 3, stream = pdf.context.flateStream(bytes, { N: components }), ref = pdf.context.register(stream);
    const intent = pdf.context.obj({ Type: PDFName.of('OutputIntent'), S: PDFName.of('GTS_PDFX'), OutputConditionIdentifier: PDFString.of(profile.name.slice(0, 200)), Info: PDFString.of('Printer-supplied ICC profile. Pixels remain sRGB; output intent alone does not constitute PDF/X conformance.'), DestOutputProfile: ref }); pdf.catalog.set(PDFName.of('OutputIntents'), pdf.context.obj([intent]));
  }
  return new Blob([await pdf.save()], { type: 'application/pdf' });
}
function readingColor(color){const channels=(color.match(/[\da-f]{2}/gi)||[]).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);const luminance=(channels[0]||0)*.2126+(channels[1]||0)*.7152+(channels[2]||0)*.0722;return 1.05/(luminance+.05)>=4.5?color:'#25304b';}
export function readingHtml(doc) {
  const out = document.implementation.createHTMLDocument(doc.title), css = out.createElement('style'); css.textContent = 'body{max-width:70ch;margin:2rem auto;padding:0 1rem;font:18px/1.6 system-ui;color:#25304b}img,video{max-width:100%;height:auto}p{white-space:pre-wrap}table{border-collapse:collapse}td,th{padding:.5rem;border:1px solid #aaa}section{margin-block:3rem}'; out.head.append(css); const viewport = out.createElement('meta'); viewport.name = 'viewport'; viewport.content = 'width=device-width,initial-scale=1'; out.head.append(viewport); const charset = out.createElement('meta'); charset.setAttribute('charset', 'utf-8'); out.head.prepend(charset); const title = out.createElement('h1'); title.textContent = doc.title; out.body.append(title); const seen = new Set();
  doc.pages.forEach((page, index) => { const section = out.createElement('section'); section.setAttribute('aria-label', `Page ${index + 1}`);
    const ordered = readingObjects(page).filter(o=>!o.readingExcluded);
    for (const o of ordered) {
      if (o.type === 'text' && !seen.has(o.storyId)) { seen.add(o.storyId); const article=out.createElement('article'),original=doc.stories[o.storyId],story={...original,style:{...original.style,color:readingColor(original.style.color)},marks:(original.marks||[]).map(mark=>({...mark,...(mark.color?{color:readingColor(mark.color)}:{})}))},style={...story.style,wordArt:'none',dropCap:0};article.className='reading-story';applyTextStyle(article,style);if(story.paragraphs?.length){appendRich(article,story,0,story.text.length,{first:true,style});for(const block of [...article.children])if(block.tagName==='DIV'){const p=out.createElement('p');p.style.cssText=block.style.cssText;p.append(...block.childNodes);block.replaceWith(p);}}else{const p=out.createElement('p');appendRich(p,story,0,story.text.length,{first:true,style});article.append(p);}section.append(article); }
      if (o.type === 'image') { const a = doc.assets[o.assetId], el = out.createElement(a.media?.kind === 'video' ? 'video' : 'img'); el.src = a.media?.src || a.src; if (el.tagName === 'VIDEO') { el.controls = true; el.poster = a.src; } else el.alt = a.alt || a.name; section.append(el); }
      if (o.type === 'table') { const table = out.createElement('table'); o.cells.forEach((row, i) => { const tr = out.createElement('tr'); row.forEach(text => { const cell = out.createElement(o.header && !i ? 'th' : 'td'); cell.textContent = text; if (cell.tagName === 'TH') cell.scope = 'col'; tr.append(cell); }); table.append(tr); }); section.append(table); }
    }
    out.body.append(section);
  });
  return '<!doctype html>\n' + out.documentElement.outerHTML;
}
export async function exportPublication(kind, doc, layout, options = {}) {
  const pages = options.pages || doc.pages.map((_, i) => i), onProgress = options.onProgress || (() => {});
  if (['writesplat', 'showsplat', 'gridsplat', 'listsplat'].includes(kind)) return exportSuite(kind, doc, layout);
  if (kind === 'json') return { blob: new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }), extension: '.layoutsplat.json' };
  if (kind === 'pdf') return { blob: await pdfProof(doc, layout, options), extension: '.pdf' };
  if (kind === 'reading') return { blob: new Blob([await portableHtml(readingHtml({ ...doc, pages: pages.map(i => doc.pages[i]) }), doc)], { type: 'text/html;charset=utf-8' }), extension: '.reading.html' };
  if (kind === 'html') return { blob: new Blob([await portableHtml(exportHtml({ ...doc, pages: pages.map(i => doc.pages[i]) }, layout, { interactive: true, nativeDoc: doc }), doc)], { type: 'text/html;charset=utf-8' }), extension: '.html' };
  if (kind === 'idml' || kind === 'sla') return exportDesktop(kind, doc, layout);
  const zip = new JSZip();
  for (let index = 0; index < pages.length; index++) { onProgress(index + 1, pages.length); const page = pages[index], suffix = String(page + 1).padStart(3, '0');
    if (kind === 'svg') zip.file(`page-${suffix}.svg`, await exportSvg(doc, doc.pages[page], layout));
    if (kind === 'png' || kind === 'jpeg') { const canvas = await pageCanvas(doc, doc.pages[page], layout, options.ppi || 300, options.bleed || 0); zip.file(`page-${suffix}.${kind === 'jpeg' ? 'jpg' : 'png'}`, await canvasBlob(canvas, `image/${kind}`)); canvas.width = canvas.height = 1; }
  }
  if (kind === 'svg' && pages.length === 1) return { blob: await zip.file(`page-${String(pages[0] + 1).padStart(3, '0')}.svg`).async('blob'), extension: '.svg' };
  if (['png', 'jpeg'].includes(kind) && pages.length === 1) return { blob: await Object.values(zip.files)[0].async('blob'), extension: kind === 'jpeg' ? '.jpg' : '.png' };
  if (kind === 'pack') {
    zip.file('publication.layoutsplat.json', JSON.stringify(doc, null, 2)); zip.file('publication.html', await portableHtml(exportHtml(doc, layout, { interactive: true }), doc)); zip.file('reading.html', await portableHtml(readingHtml(doc), doc));
    if (doc.originalPublisher) zip.file('original/source.pub', doc.originalPublisher.src.split(',')[1], { base64: true });
    zip.file('proof.pdf', await pdfProof(doc, layout, options)); zip.file('preflight.json', JSON.stringify(options.issues || [], null, 2));
    for (const [id, a] of Object.entries(doc.assets)) { const ext = /^data:image\/jpeg/.test(a.src) ? 'jpg' : /^data:image\/webp/.test(a.src) ? 'webp' : 'png'; zip.file(`assets/${id}.${ext}`, a.src.split(',')[1], { base64: true }); if (a.media) zip.file(`assets/${id}.${a.media.mime.split('/')[1]}`, a.media.src.split(',')[1], { base64: true }); }
    zip.file('printer-specifications.json', JSON.stringify({ app: 'LayoutSplat', title: doc.title, units: 'pt', trim: [doc.width, doc.height], bleed: options.bleed || 0, cropMarks: !!options.cropMarks, proofPpi: options.ppi || 300, pages: pages.map(p => p + 1), color: 'sRGB source; printer profile required for press conversion', fonts: [...new Set(Object.values(doc.stories).map(s => s.style.font))], warnings: 'Proof PDF is flattened. For selectable text/vector proof use Print / Save as PDF. PDF/X is not certified by this package.' }, null, 2));
    if (options.profile) zip.file(`profiles/${options.profile.name.replace(/[^\w.-]/g, '_')}`, options.profile);
    const manifest = await fetch('fonts/manifest.json').then(r => r.ok ? r.json() : null).catch(() => null);
    if (manifest) { zip.file('fonts/manifest.json', JSON.stringify(manifest, null, 2)); for (const file of manifest.files) { const response = await fetch(`fonts/${file}`); if (!response.ok) throw Error(`Font asset missing: ${file}`); zip.file(`fonts/${file}`, await response.arrayBuffer()); } }
    for(const[id,f]of Object.entries(doc.customFonts||{}))zip.file(`fonts/imported/${id}.${f.format}`,f.src.split(',')[1],{base64:true});
    const helper = await fetch('printer/pdfx.py'); if (helper.ok) zip.file('printer/pdfx.py', await helper.text());
    zip.file('README.txt', 'LayoutSplat Pack and Go\nOpen publication.layoutsplat.json for editable content. The HTML edition plays imported motion media; printed proofs contain posters.\nThe proof PDF preserves appearance as high-resolution pixels; it is not PDF/X certified. For selectable text/vector output, open the project and use Print / Save as PDF.\nUse a printer-provided ICC profile and printer/pdfx.py with Ghostscript for PDF/X-3 preparation; review the report and obtain printer approval. No fonts from the operating system are redistributed. Bundled fonts have their own licenses in fonts/.\n');
  } else if (!['svg', 'png', 'jpeg'].includes(kind)) throw Error('Unknown export format.');
  return { blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), extension: kind === 'pack' ? '.print-package.zip' : `.${kind}.zip` };
}
