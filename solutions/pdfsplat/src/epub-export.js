import { formattedLines, structureLines, blocksHtml } from './rich-text.js?v=20260914-formatting';
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);

export function joinRuns(items) { return formattedLines(items); }

const xhtml = (title, body, language) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${esc(language)}" lang="${esc(language)}"><head><meta charset="utf-8"/><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="styles.css"/></head><body>${body}</body></html>`;

export async function createEpub({ pdfjs, pdfBytes, title, author, publisher = "", description = "", rights = "", language = "en", pageChapters = true, coverFile = null, coverAlt = "", textDocument = null, onProgress = () => {} }) {
  const appearance = textDocument?.layout === "appearance";
  if (appearance) pageChapters = true;
  const document = textDocument ? null : await pdfjs.getDocument({ data: pdfBytes.slice() }).promise;
  const pages = [];
  let emptyPages = 0;
  for (let number = 1; number <= (textDocument?.pages.length ?? document.numPages); number++) {
    onProgress(number, textDocument?.pages.length ?? document.numPages);
    const page = document ? await document.getPage(number) : null;
    const lines = textDocument ? textDocument.pages[number - 1].lines : joinRuns((await page.getTextContent()).items);
    if (!lines.length && !appearance) emptyPages++;
    const blocks = textDocument?.pages[number - 1].blocks || structureLines(lines);
    const heading = blocks.find(block => block.type === "heading")?.text;
    pages.push({ number, title: heading || `Page ${number}`, html: appearance
      ? `<img class="page-image" src="page-${number}.png" alt="Page ${number} of ${esc(title)}. Page image; text is not selectable."/>`
      : blocksHtml(blocks) || '<p class="empty">No extractable text was found on this page.</p>' });
    page?.cleanup();
  }
  await document?.destroy();

  const marker = (number) => `<span id="page-${number}" epub:type="pagebreak" role="doc-pagebreak" aria-label="Page ${number}" xmlns:epub="http://www.idpf.org/2007/ops"></span>`;
  const sections = pageChapters ? pages.map((page) => ({ title: page.title, html: `${marker(page.number)}${page.html}`, page: page.number })) : [{ title, html: pages.map((page) => `<section aria-label="PDF page ${page.number}">${marker(page.number)}${page.html}</section>`).join("\n"), page: 1 }];
  const identifier = `urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-pdfsplat`}`;
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const zip = new globalThis.JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  let coverManifest = "", coverSpine = "", coverMetadata = "";
  if (coverFile) {
    const isPng = coverFile.type === "image/png", extension = isPng ? "png" : "jpg", mediaType = isPng ? "image/png" : "image/jpeg";
    zip.file(`EPUB/cover.${extension}`, new Uint8Array(await coverFile.arrayBuffer()));
    zip.file("EPUB/cover.xhtml", xhtml("Cover", `<section epub:type="cover" xmlns:epub="http://www.idpf.org/2007/ops"><img class="cover" src="cover.${extension}" alt="${esc(coverAlt)}"/></section>`, language));
    coverManifest = `<item id="cover-image" href="cover.${extension}" media-type="${mediaType}" properties="cover-image"/><item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`;
    coverSpine = '<itemref idref="cover" linear="no"/>';
    coverMetadata = '<meta name="cover" content="cover-image"/>';
  }
  const pageImages = appearance ? textDocument.pages.map((page, index) => {
    zip.file(`EPUB/page-${index + 1}.png`, page.image);
    return `<item id="page-image-${index + 1}" href="page-${index + 1}.png" media-type="image/png"/>`;
  }).join("") : "";
  const manifest = pageImages + sections.map((_, index) => `<item id="chapter-${index + 1}" href="chapter-${index + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("");
  const spine = sections.map((_, index) => `<itemref idref="chapter-${index + 1}"/>`).join("");
  const optionalMetadata = `${publisher ? `<dc:publisher>${esc(publisher)}</dc:publisher>` : ""}${description ? `<dc:description>${esc(description)}</dc:description>` : ""}${rights ? `<dc:rights>${esc(rights)}</dc:rights>` : ""}`;
  const accessibilitySummary = appearance ? "Pages are preserved as images. Text is not selectable or reflowable and page images need descriptions for accessibility." : emptyPages ? `${emptyPages} PDF page${emptyPages === 1 ? " has" : "s have"} no extractable text. Complex visual content may not be represented.` : "Text is reflowable and includes structural navigation. Visual content from the source PDF may not be represented.";
  zip.file("EPUB/package.opf", `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${esc(language)}" prefix="schema: http://schema.org/"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${identifier}</dc:identifier><dc:title>${esc(title)}</dc:title><dc:creator>${esc(author || "Unknown author")}</dc:creator><dc:language>${esc(language)}</dc:language>${optionalMetadata}<meta property="dcterms:modified">${modified}</meta>${coverMetadata}<meta property="schema:accessMode">${appearance ? "visual" : "textual"}</meta><meta property="schema:accessibilityFeature">structuralNavigation</meta><meta property="schema:accessibilityFeature">readingOrder</meta><meta property="schema:accessibilityHazard">none</meta><meta property="schema:accessibilitySummary">${esc(accessibilitySummary)}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="styles.css" media-type="text/css"/>${coverManifest}${manifest}</manifest><spine toc="ncx">${coverSpine}${spine}</spine></package>`);
  const links = sections.map((section, index) => `<li><a href="chapter-${index + 1}.xhtml">${esc(section.title)}</a></li>`).join("");
  const pageLinks = pages.map((page, index) => pageChapters ? `<li><a href="chapter-${index + 1}.xhtml">${page.number}</a></li>` : `<li><a href="chapter-1.xhtml#page-${page.number}">${page.number}</a></li>`).join("");
  zip.file("EPUB/nav.xhtml", xhtml("Contents", `<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><h1>Contents</h1><ol>${links}</ol></nav><nav epub:type="page-list" xmlns:epub="http://www.idpf.org/2007/ops"><h2>Pages</h2><ol>${pageLinks}</ol></nav><nav epub:type="landmarks" xmlns:epub="http://www.idpf.org/2007/ops" hidden="hidden"><ol>${coverFile ? '<li><a epub:type="cover" href="cover.xhtml">Cover</a></li>' : ""}<li><a epub:type="bodymatter" href="chapter-1.xhtml">Start reading</a></li><li><a epub:type="toc" href="nav.xhtml">Table of contents</a></li></ol></nav>`, language));
  const navPoints = sections.map((section, index) => `<navPoint id="navPoint-${index + 1}" playOrder="${index + 1}"><navLabel><text>${esc(section.title)}</text></navLabel><content src="chapter-${index + 1}.xhtml"/></navPoint>`).join("");
  zip.file("EPUB/toc.ncx", `<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${identifier}"/></head><docTitle><text>${esc(title)}</text></docTitle><navMap>${navPoints}</navMap></ncx>`);
  zip.file("EPUB/styles.css", "body{font-family:serif;line-height:1.55;margin:5%;max-width:42em}h1,h2,h3,h4,h5,h6{line-height:1.2;break-after:avoid}p{margin:.65em 0}.align-center{text-align:center}.align-right{text-align:right}.align-left{text-align:left}ul,ol{padding-left:1.5em}.page-image{display:block;width:100%;height:auto}.empty{font-style:italic;text-indent:0;color:#666}section+section{break-before:page}.cover{display:block;max-width:100%;height:auto;margin:auto}");
  sections.forEach((section, index) => zip.file(`EPUB/chapter-${index + 1}.xhtml`, xhtml(section.title, `${appearance || /<h[1-6]\b/.test(section.html) ? "" : `<h1>${esc(section.title)}</h1>`}${section.html}`, language)));
  const checks = [
    { level: "pass", message: "EPUB 3 package, reading order, table of contents, and page navigation created." },
    ...(appearance ? [{ level: "warning", message: "Page appearance is preserved as images. Text is not selectable or reflowable." }] : []),
    { level: "pass", message: "Title, creator, language, and accessibility-discovery metadata included." },
    ...(coverFile && !coverAlt ? [{ level: "warning", message: "The cover has no description; leave it blank only when the artwork is decorative." }] : []),
    ...(emptyPages ? [{ level: "warning", message: `${emptyPages} of ${pages.length} page(s) had no extractable text and may require OCR.` }] : []),
    { level: "warning", message: "Automated preflight cannot certify EPUB Accessibility 1.1 or preserve every complex PDF layout; validate a publication copy with EPUBCheck and an accessibility checker before distribution." },
  ];
  return { blob: await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip", compression: "DEFLATE", compressionOptions: { level: 6 } }), emptyPages, pageCount: pages.length, checks };
}
