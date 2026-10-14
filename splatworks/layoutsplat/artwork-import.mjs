import { newPublication, uid, validatePublication } from './engine.mjs';
import { loadScript } from './media.mjs';
export async function importArtwork(file, { signal, onProgress = () => {} } = {}) {
  let bytes = new Uint8Array(await file.arrayBuffer()); signal?.throwIfAborted();
  const illustrator = /\.ai$/i.test(file.name);
  if (/\.(eps|ps)$/i.test(file.name) || new TextDecoder().decode(bytes.slice(0, 20)).trimStart().startsWith('%!PS')) {
    const { convertPostscript } = await import('./postscript.mjs'); const converted = await convertPostscript(file, { kind: 'pdf', signal, onStatus: onProgress }); bytes = new Uint8Array(await converted.blob.arrayBuffer());
  }
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes('%PDF-')) throw Error('This Illustrator file has no PDF-compatible artwork. Save with Create PDF Compatible File enabled, or export SVG/PDF/EPS.');
  await loadScript('../../vendor/pdf.min.js', 'pdfjsLib'); pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.min.js', location.href).href;
  const pdf = await pdfjsLib.getDocument({ data: bytes, isEvalSupported: false }).promise;
  const doc = newPublication(true); doc.title = file.name.replace(/\.(ai|pdf)$/i, ''); doc.pages = []; doc.importedFrom = illustrator ? 'Adobe Illustrator (PDF-compatible artwork)' : 'PDF artwork';
  const warnings = [`${illustrator ? 'Illustrator' : 'PDF'} pages imported as high-resolution artwork, not editable text or vector paths. Use SVG for editable Illustrator objects. Review colors before commercial printing.`];
  try {
    if (pdf.numPages > 100) throw Error('Artwork import supports up to 100 pages.');
    for (let number = 1; number <= pdf.numPages; number++) {
      signal?.throwIfAborted(); onProgress(`Rendering artwork page ${number} of ${pdf.numPages}…`);
      const page = await pdf.getPage(number), base = page.getViewport({ scale: 1 });
      if (base.width < 72 || base.height < 72 || base.width > 2000 || base.height > 2000) throw Error('Artwork page size must be between 1 inch and 27.7 inches per side.');
      if (number === 1) { doc.width = base.width; doc.height = base.height; doc.margin = 0; doc.bleed = 0; doc.safeArea = 0; }
      else if (Math.abs(base.width - doc.width) > .1 || Math.abs(base.height - doc.height) > .1) warnings.push('Mixed artwork page sizes are fitted to the first page size.');
      const scale = Math.min(300 / 72, 6000 / Math.max(base.width, base.height), Math.sqrt(40000000 / (base.width * base.height))), viewport = page.getViewport({ scale }), canvas = document.createElement('canvas'); canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport }), abort = () => task.cancel(); signal?.addEventListener('abort', abort, { once: true });
      try { await task.promise; } finally { signal?.removeEventListener('abort', abort); }
      const id = uid(), src = canvas.toDataURL('image/png'); if (src.length > 64000000) throw Error('Rendered artwork is too large.');
      doc.assets[id] = { name: `${file.name} — page ${number}`, alt: `Imported artwork page ${number}`, width: canvas.width, height: canvas.height, src }; canvas.width = canvas.height = 1;
      doc.pages.push({ id: uid(), objects: [{ id: uid(), type: 'image', assetId: id, x: 0, y: 0, w: doc.width, h: doc.height, rotation: 0, fit: 'contain', locked: false }] });
    }
  } finally { await pdf.destroy(); }
  return { doc: validatePublication(doc), warnings: [...new Set(warnings)] };
}
