import { joinRuns } from './epub-export.js?v=20260914-save-as';

export const formats = {
  markdown: { label: 'Markdown', extension: 'md', mime: 'text/markdown;charset=utf-8' },
  docx: { label: 'Word (DOCX)', extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  odt: { label: 'OpenDocument Text (ODF)', extension: 'odt', mime: 'application/vnd.oasis.opendocument.text' },
  json: { label: 'JSON', extension: 'json', mime: 'application/json;charset=utf-8' },
};
const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const markdown = value => String(value).replace(/[\\`*_{}\[\]()#+.!|>~-]/g, '\\$&').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const emptyText = 'No selectable text on this page. Scanned images require OCR.';

// Extract from the current page model, rather than the flattened PDF: visual
// replacements in that PDF still have the original text underneath them.
export async function collectTextDocument({ pages, sources, title, language, sourceName, onProgress = () => {} }) {
  const result = { schemaVersion: 1, title, language, sourceName, pages: [], warnings: [
    'Text conversion does not preserve images, drawings, exact layout, or table structure. Review reading order. No OCR is performed.',
  ] };
  for (const [index, item] of pages.entries()) {
    onProgress(index + 1, pages.length);
    const page = await sources.get(item.sourceId).pdf.getPage(item.sourceIndex + 1);
    const [left, bottom, right, top] = page.view, width = right - left, height = top - bottom;
    const crop = item.crop || { left: 0, right: 0, top: 0, bottom: 0 };
    const covers = item.annotations.filter(o => o.type === 'mask' || (o.type === 'text' && o.cover));
    const visible = box => {
      if (box.x < crop.left || box.x + box.w > 1 - crop.right + .001 || box.y < crop.top || box.y + box.h > 1 - crop.bottom + .001) return false;
      return !covers.some(o => box.x < o.x + o.w && box.x + box.w > o.x && box.y < o.y + Math.max(o.h, (o.fontSize || 0) * 1.25 / height) && box.y + box.h > o.y);
    };
    const content = await page.getTextContent();
    const runs = content.items.filter(run => {
      if (!run.str) return false;
      const size = Math.hypot(run.transform[2], run.transform[3]) || 12;
      return visible({ x: (run.transform[4] - left) / width, y: (top - run.transform[5] - size * .8) / height, w: run.width / width, h: size / height });
    });
    for (const o of item.annotations) {
      if (o.type !== 'text' || o.opacity === 0) continue;
      for (const [lineIndex, str] of (o.text || '').split('\n').entries()) {
        const y = o.y + lineIndex * o.fontSize * 1.2 / height;
        if (o.x < crop.left || o.x >= 1 - crop.right || y < crop.top || y >= 1 - crop.bottom) continue;
        runs.push({ str, transform: [o.fontSize, 0, 0, o.fontSize, left + o.x * width, top - y * height - o.fontSize], width: o.w * width });
      }
    }
    const lines = joinRuns(runs);
    result.pages.push({ number: index + 1, text: lines.map(line => line.text).join('\n'), lines });
  }
  const empty = result.pages.filter(page => !page.text).length;
  if (empty) result.warnings.push(`${empty} of ${pages.length} pages have no selectable text. Scanned images require OCR.`);
  return result;
}

export async function createTextFile(format, document) {
  const info = formats[format];
  if (!info) throw new Error('Choose a supported file format.');
  if (format === 'json') {
    const data = { ...document, pageCount: document.pages.length, pages: document.pages.map(({ number, text }) => ({ number, text })) };
    return new Blob([JSON.stringify(data, null, 2) + '\n'], { type: info.mime });
  }
  if (format === 'markdown') {
    const text = `# ${markdown(document.title)}\n\n` + document.pages.map(page => `## Page ${page.number}\n\n${page.text ? page.lines.map(line => markdown(line.text)).join('  \n') : `*${emptyText}*`}`).join('\n\n') + '\n';
    return new Blob([text], { type: info.mime });
  }
  const zip = new globalThis.JSZip();
  if (format === 'docx') {
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    const paragraph = (text, bold = false) => `<w:p><w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:lang w:val="${xml(document.language)}"/></w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
    const body = paragraph(document.title, true) + document.pages.map((page, index) => `${index ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : ''}${paragraph(`Page ${page.number}`, true)}${(page.text ? page.lines.map(line => line.text) : [emptyText]).map(text => paragraph(text)).join('')}`).join('');
    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);
  } else {
    zip.file('mimetype', info.mime, { compression: 'STORE' });
    zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="${info.mime}"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/></manifest:manifest>`);
    zip.file('meta.xml', `<?xml version="1.0" encoding="UTF-8"?><office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" office:version="1.3"><office:meta><dc:title>${xml(document.title)}</dc:title><dc:language>${xml(document.language)}</dc:language></office:meta></office:document-meta>`);
    const body = `<text:h text:outline-level="1">${xml(document.title)}</text:h>` + document.pages.map(page => `<text:h text:outline-level="2">Page ${page.number}</text:h>${(page.text ? page.lines.map(line => line.text) : [emptyText]).map(text => `<text:p>${xml(text).replace(/ {2,}/g, spaces => `<text:s text:c="${spaces.length}"/>`)}</text:p>`).join('')}`).join('');
    zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.3"><office:body><office:text>${body}</office:text></office:body></office:document-content>`);
  }
  return zip.generateAsync({ type: 'blob', mimeType: info.mime, compression: 'DEFLATE' });
}
