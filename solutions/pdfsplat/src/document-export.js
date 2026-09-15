import { createOfficeFile } from './office-export.js?v=20260914-formatting';
import { formattedLines, structureLines, blocksFor, safeLink } from './rich-text.js?v=20260914-formatting';

export const formats = {
  markdown: { label: 'Markdown', extension: 'md', mime: 'text/markdown;charset=utf-8' },
  docx: { label: 'Word (DOCX)', extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  odt: { label: 'OpenDocument Text (ODF)', extension: 'odt', mime: 'application/vnd.oasis.opendocument.text' },
  json: { label: 'JSON', extension: 'json', mime: 'application/json;charset=utf-8' },
};
const markdown = value => String(value).replace(/[\\`*_{}\[\]()#+.!|>~-]/g, '\\$&').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const emptyText = 'No selectable text on this page. Scanned images require OCR.';

// Extract from the current page model, rather than the flattened PDF: visual
// replacements in that PDF still have the original text underneath them.
export async function collectTextDocument({ pages, sources, title, language, sourceName, onProgress = () => {} }) {
  const result = { schemaVersion: 1, title, language, sourceName, pages: [], warnings: [
    'Formatting is reconstructed from PDF font and position information. Review headings, paragraphs, columns, and tables. Images and exact layout require Keep page appearance. No OCR is performed.',
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
    await page.getOperatorList(); // Resolve font names and bold/italic metadata.
    const content = await page.getTextContent();
    const links = (await page.getAnnotations()).filter(annotation => annotation.subtype === 'Link' && safeLink(annotation.url));
    const runs = content.items.filter(run => {
      if (!run.str) return false;
      const size = Math.hypot(run.transform[2], run.transform[3]) || 12;
      return visible({ x: (run.transform[4] - left) / width, y: (top - run.transform[5] - size * .8) / height, w: run.width / width, h: size / height });
    }).map(run => {
      let font = {};
      try { font = page.commonObjs.get(run.fontName) || {}; } catch { /* Unknown font: retain its generic family. */ }
      const name = font.name || '';
      const link = links.find(link => run.transform[4] >= link.rect[0] - 2 && run.transform[4] <= link.rect[2] + 2 && run.transform[5] >= link.rect[1] - 2 && run.transform[5] <= link.rect[3] + 2);
      return { ...run, bold: font.bold || /bold|black|heavy|semibold/i.test(name), italic: font.italic || /italic|oblique/i.test(name),
        fontFamily: name.replace(/^[A-Z]{6}\+/, '').replace(/[-,](?:Bold|Italic|Oblique|Regular|Roman).*/i, '') || content.styles?.[run.fontName]?.fontFamily || 'serif', link: link?.url };
    });
    for (const o of item.annotations) {
      if (o.type !== 'text' || o.opacity === 0) continue;
      for (const [lineIndex, str] of (o.text || '').split('\n').entries()) {
        const y = o.y + lineIndex * o.fontSize * 1.2 / height;
        if (o.x < crop.left || o.x >= 1 - crop.right || y < crop.top || y >= 1 - crop.bottom) continue;
        runs.push({ str, transform: [o.fontSize, 0, 0, o.fontSize, left + o.x * width, top - y * height - o.fontSize], width: o.w * width, fontFamily: o.fontFamily, color: o.color });
      }
    }
    const lines = formattedLines(runs, width);
    result.pages.push({ number: index + 1, width, height, text: lines.map(line => line.text).join('\n'), lines, blocks: structureLines(lines, width) });
  }
  const empty = result.pages.filter(page => !page.text).length;
  if (empty) result.warnings.push(`${empty} of ${pages.length} pages have no selectable text. Scanned images require OCR.`);
  return result;
}

function markdownSpans(spans) {
  return spans.map(span => {
    // Keep surrounding whitespace outside emphasis delimiters.
    const leading = span.text.match(/^\s*/)[0], trailing = span.text.trim() ? span.text.match(/\s*$/)[0] : '';
    let text = markdown(span.text.trim());
    if (!text) return span.text;
    if (span.bold && span.italic) text = `***${text}***`;
    else if (span.bold) text = `**${text}**`;
    else if (span.italic) text = `*${text}*`;
    if (safeLink(span.link)) text = `[${text}](<${span.link.replace(/[<>\s]/g, character => encodeURIComponent(character))}>)`;
    return leading + text + trailing;
  }).join('');
}
function markdownBlocks(blocks) {
  return blocks.map((block, index) => {
    const text = markdownSpans(block.spans);
    const prefix = block.type === 'heading' ? '#'.repeat(Math.min(6, block.level + 2)) + ' ' : block.type === 'list-item' ? `${block.ordered ? block.start + '.' : '-'} ` : '';
    return `${index && block.type === 'list-item' && blocks[index - 1].type === 'list-item' && blocks[index - 1].ordered === block.ordered ? '\n' : index ? '\n\n' : ''}${prefix}${text}`;
  }).join('');
}

export async function createTextFile(format, document) {
  const info = formats[format];
  if (!info) throw new Error('Choose a supported file format.');
  if (format === 'json') {
    const data = { ...document, pageCount: document.pages.length, pages: document.pages.map(({ number, text, width, height, blocks }) => ({ number, text, width, height, blocks })) };
    return new Blob([JSON.stringify(data, null, 2) + '\n'], { type: info.mime });
  }
  if (format === 'markdown') {
    const text = `# ${markdown(document.title)}\n\n` + document.pages.map(page => `## Page ${page.number}\n\n${page.text ? markdownBlocks(blocksFor(page)) : `*${emptyText}*`}`).join('\n\n') + '\n';
    return new Blob([text], { type: info.mime });
  }
  return createOfficeFile(format, document, info.mime);
}
