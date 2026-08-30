const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);

function joinRuns(items) {
  const runs = items.filter((item) => item.str?.trim()).map((item) => ({
    text: item.str.trim(),
    x: item.transform[4],
    y: item.transform[5],
    width: item.width || 0,
    size: Math.max(1, Math.hypot(item.transform[0], item.transform[1])),
  })).sort((a, b) => Math.abs(a.y - b.y) > Math.max(a.size, b.size) * .45 ? b.y - a.y : a.x - b.x);
  const lines = [];
  for (const run of runs) {
    let line = lines.find((candidate) => Math.abs(candidate.y - run.y) <= Math.max(candidate.size, run.size) * .45);
    if (!line) {
      line = { runs: [], y: run.y, size: run.size };
      lines.push(line);
    }
    line.runs.push(run);
    line.size = Math.max(line.size, run.size);
  }
  return lines.sort((a, b) => b.y - a.y).map((line) => {
    line.runs.sort((a, b) => a.x - b.x);
    let text = "", right = -Infinity;
    for (const run of line.runs) {
      const gap = run.x - right;
      if (text && gap > line.size * .12 && !/[\s\u2010-\u2014-]$/.test(text)) text += " ";
      text += run.text;
      right = Math.max(right, run.x + run.width);
    }
    return { text: text.replace(/\s+/g, " ").trim(), size: line.size, y: line.y };
  }).filter((line) => line.text);
}

function linesToHtml(lines) {
  if (!lines.length) return '<p class="empty">No extractable text was found on this page.</p>';
  const sizes = lines.map((line) => line.size).sort((a, b) => a - b);
  const median = sizes[Math.floor((sizes.length - 1) / 2)] || 12;
  const blocks = [];
  let paragraph = "";
  const flush = () => {
    if (paragraph) blocks.push(`<p>${esc(paragraph)}</p>`);
    paragraph = "";
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index], next = lines[index + 1];
    const heading = line.size >= median * 1.35 && line.text.length < 140;
    if (heading) {
      flush();
      blocks.push(`<h2>${esc(line.text)}</h2>`);
      continue;
    }
    paragraph += `${paragraph && !/[\u2010-\u2014-]$/.test(paragraph) ? " " : ""}${line.text}`;
    if (/[\u2010-\u2014-]$/.test(paragraph)) paragraph = paragraph.slice(0, -1);
    const gap = next ? line.y - next.y : Infinity;
    if (!next || gap > Math.max(line.size, next.size) * 1.65 || /[.!?…”’)]$/.test(line.text)) flush();
  }
  flush();
  return blocks.join("\n");
}

const xhtml = (title, body, language) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${esc(language)}" lang="${esc(language)}"><head><meta charset="utf-8"/><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="styles.css"/></head><body>${body}</body></html>`;

export async function createEpub({ pdfjs, pdfBytes, title, author, publisher = "", description = "", rights = "", language = "en", pageChapters = true, coverFile = null, coverAlt = "", onProgress = () => {} }) {
  const document = await pdfjs.getDocument({ data: pdfBytes.slice() }).promise;
  const pages = [];
  let emptyPages = 0;
  for (let number = 1; number <= document.numPages; number++) {
    onProgress(number, document.numPages);
    const page = await document.getPage(number);
    const lines = joinRuns((await page.getTextContent()).items);
    if (!lines.length) emptyPages++;
    const sizes = lines.map((line) => line.size).sort((a, b) => a - b), median = sizes[Math.floor((sizes.length - 1) / 2)] || 12;
    const heading = lines.find((line) => line.size >= median * 1.35 && line.text.length < 140)?.text;
    pages.push({ number, title: heading || `Page ${number}`, html: linesToHtml(lines) });
    page.cleanup();
  }
  await document.destroy();

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
  const manifest = sections.map((_, index) => `<item id="chapter-${index + 1}" href="chapter-${index + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("");
  const spine = sections.map((_, index) => `<itemref idref="chapter-${index + 1}"/>`).join("");
  const optionalMetadata = `${publisher ? `<dc:publisher>${esc(publisher)}</dc:publisher>` : ""}${description ? `<dc:description>${esc(description)}</dc:description>` : ""}${rights ? `<dc:rights>${esc(rights)}</dc:rights>` : ""}`;
  const accessibilitySummary = emptyPages ? `${emptyPages} PDF page${emptyPages === 1 ? " has" : "s have"} no extractable text. Complex visual content may not be represented.` : "Text is reflowable and includes structural navigation. Visual content from the source PDF may not be represented.";
  zip.file("EPUB/package.opf", `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${esc(language)}" prefix="schema: http://schema.org/"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${identifier}</dc:identifier><dc:title>${esc(title)}</dc:title><dc:creator>${esc(author || "Unknown author")}</dc:creator><dc:language>${esc(language)}</dc:language>${optionalMetadata}<meta property="dcterms:modified">${modified}</meta>${coverMetadata}<meta property="schema:accessMode">textual</meta><meta property="schema:accessibilityFeature">structuralNavigation</meta><meta property="schema:accessibilityFeature">readingOrder</meta><meta property="schema:accessibilityHazard">none</meta><meta property="schema:accessibilitySummary">${esc(accessibilitySummary)}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="styles.css" media-type="text/css"/>${coverManifest}${manifest}</manifest><spine toc="ncx">${coverSpine}${spine}</spine></package>`);
  const links = sections.map((section, index) => `<li><a href="chapter-${index + 1}.xhtml">${esc(section.title)}</a></li>`).join("");
  const pageLinks = pages.map((page, index) => pageChapters ? `<li><a href="chapter-${index + 1}.xhtml">${page.number}</a></li>` : `<li><a href="chapter-1.xhtml#page-${page.number}">${page.number}</a></li>`).join("");
  zip.file("EPUB/nav.xhtml", xhtml("Contents", `<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><h1>Contents</h1><ol>${links}</ol></nav><nav epub:type="page-list" xmlns:epub="http://www.idpf.org/2007/ops"><h2>Pages</h2><ol>${pageLinks}</ol></nav><nav epub:type="landmarks" xmlns:epub="http://www.idpf.org/2007/ops" hidden="hidden"><ol>${coverFile ? '<li><a epub:type="cover" href="cover.xhtml">Cover</a></li>' : ""}<li><a epub:type="bodymatter" href="chapter-1.xhtml">Start reading</a></li><li><a epub:type="toc" href="nav.xhtml">Table of contents</a></li></ol></nav>`, language));
  const navPoints = sections.map((section, index) => `<navPoint id="navPoint-${index + 1}" playOrder="${index + 1}"><navLabel><text>${esc(section.title)}</text></navLabel><content src="chapter-${index + 1}.xhtml"/></navPoint>`).join("");
  zip.file("EPUB/toc.ncx", `<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${identifier}"/></head><docTitle><text>${esc(title)}</text></docTitle><navMap>${navPoints}</navMap></ncx>`);
  zip.file("EPUB/styles.css", "body{font-family:serif;line-height:1.55;margin:5%;max-width:42em}h1,h2{line-height:1.2;break-after:avoid}p{margin:.65em 0;text-indent:1.2em}.empty{font-style:italic;text-indent:0;color:#666}section+section{break-before:page}.cover{display:block;max-width:100%;height:auto;margin:auto}");
  sections.forEach((section, index) => zip.file(`EPUB/chapter-${index + 1}.xhtml`, xhtml(section.title, `<h1>${esc(section.title)}</h1>${section.html}`, language)));
  const checks = [
    { level: "pass", message: "EPUB 3 package, reading order, table of contents, and page navigation created." },
    { level: "pass", message: "Title, creator, language, and accessibility-discovery metadata included." },
    ...(coverFile && !coverAlt ? [{ level: "warning", message: "The cover has no description; leave it blank only when the artwork is decorative." }] : []),
    ...(emptyPages ? [{ level: "warning", message: `${emptyPages} of ${pages.length} page(s) had no extractable text and may require OCR.` }] : []),
    { level: "warning", message: "Automated preflight cannot certify EPUB Accessibility 1.1 or preserve every complex PDF layout; validate a publication copy with EPUBCheck and an accessibility checker before distribution." },
  ];
  return { blob: await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip", compression: "DEFLATE", compressionOptions: { level: 6 } }), emptyPages, pageCount: pages.length, checks };
}
