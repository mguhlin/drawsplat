import { blocksFor, xml, safeLink } from './rich-text.js?v=20260914-formatting';

const EMPTY = 'No selectable text on this page. Scanned images require OCR.';
const point = value => Math.round(Math.max(1, Math.min(144, value || 12)) * 2);
const color = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value.slice(1) : '';
const fallback = text => ({ type: 'paragraph', spans: [{ text, size: 12 }] });
const pageBlocks = page => blocksFor(page).length ? blocksFor(page) : [fallback(EMPTY)];

export async function createOfficeFile(format, document, mime) {
  const zip = new globalThis.JSZip();
  const appearance = document.layout === 'appearance';
  if (format === 'docx') {
    const relationships = [
      '<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
      '<Relationship Id="numbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>',
    ];
    let linkId = 0, numId = 1, lastList = '', currentNum = 0;
    const nums = [];
    const run = span => {
      const properties = `${span.font ? `<w:rFonts w:ascii="${xml(span.font)}" w:hAnsi="${xml(span.font)}"/>` : ''}${span.bold ? '<w:b/>' : ''}${span.italic ? '<w:i/>' : ''}${color(span.color) ? `<w:color w:val="${color(span.color)}"/>` : ''}<w:sz w:val="${point(span.size)}"/><w:lang w:val="${xml(document.language)}"/>`;
      const content = `<w:r><w:rPr>${properties}</w:rPr><w:t xml:space="preserve">${xml(span.text)}</w:t></w:r>`;
      if (!safeLink(span.link)) return content;
      const id = `link${++linkId}`;
      relationships.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xml(span.link)}" TargetMode="External"/>`);
      return `<w:hyperlink r:id="${id}">${content}</w:hyperlink>`;
    };
    const paragraph = block => {
      const heading = block.type === 'heading';
      let list = '';
      if (block.type === 'list-item') {
        const type = block.ordered ? 'decimal' : 'bullet';
        if (lastList !== type) {
          currentNum = ++numId;
          nums.push(`<w:num w:numId="${currentNum}"><w:abstractNumId w:val="${block.ordered ? 1 : 0}"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="${block.ordered ? block.start : 1}"/></w:lvlOverride></w:num>`);
        }
        lastList = type;
        list = `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${currentNum}"/></w:numPr>`;
      } else lastList = '';
      const alignment = ['left', 'center', 'right'].includes(block.alignment) ? block.alignment : 'left';
      return `<w:p><w:pPr>${heading ? `<w:pStyle w:val="Heading${block.level}"/><w:keepNext/>` : ''}${list}<w:spacing w:before="${Math.round((block.spaceBefore || 0) * 20)}" w:after="120"/>${!list && block.indent ? `<w:ind w:left="${Math.round(Math.min(100, block.indent) * 20)}"/>` : ''}<w:jc w:val="${alignment}"/></w:pPr>${block.spans.map(run).join('')}</w:p>`;
    };
    let body = '';
    if (appearance) {
      for (const [index, page] of document.pages.entries()) {
        zip.file(`word/media/page-${index + 1}.png`, page.image);
        relationships.push(`<Relationship Id="image${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/page-${index + 1}.png"/>`);
        const scale = Math.min(451 / page.width, 680 / page.height), cx = Math.round(page.width * scale * 12700), cy = Math.round(page.height * scale * 12700);
        body += `${index ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : ''}<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${index + 1}" name="Page ${index + 1}" descr="Page image from ${xml(document.title)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${index + 1}" name="Page ${index + 1}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="image${index + 1}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
      }
    } else {
      body = blocksFor(document.pages[0])[0]?.type === 'heading' ? '' : paragraph({ type: 'heading', level: 1, spans: [{ text: document.title, bold: true, size: 24 }] });
      for (const [index, page] of document.pages.entries()) {
        lastList = '';
        if (index) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        body += pageBlocks(page).map(paragraph).join('');
      }
    }
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`);
    zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="document" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join('')}</Relationships>`);
    zip.file('word/styles.xml', `<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${Array.from({ length: 6 }, (_, i) => `<w:style w:type="paragraph" w:styleId="Heading${i + 1}"><w:name w:val="heading ${i + 1}"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="${i}"/></w:pPr><w:rPr><w:b/></w:rPr></w:style>`).join('')}</w:styles>`);
    zip.file('word/numbering.xml', `<?xml version="1.0"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${['bullet', 'decimal'].map((type, i) => `<w:abstractNum w:abstractNumId="${i}"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="${type}"/><w:lvlText w:val="${i ? '%1.' : '•'}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr></w:lvl></w:abstractNum>`).join('')}${nums.join('')}</w:numbering>`);
    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);
  } else {
    zip.file('mimetype', mime, { compression: 'STORE' });
    const styles = [], entries = ['content.xml', 'meta.xml', 'styles.xml'].map(name => `<manifest:file-entry manifest:full-path="${name}" manifest:media-type="text/xml"/>`);
    let styleIndex = 0;
    const span = item => {
      const name = `T${++styleIndex}`;
      styles.push(`<style:style style:name="${name}" style:family="text"><style:text-properties fo:font-size="${point(item.size) / 2}pt"${item.font ? ` fo:font-family="${xml(item.font)}"` : ''}${item.bold ? ' fo:font-weight="bold"' : ''}${item.italic ? ' fo:font-style="italic"' : ''}${color(item.color) ? ` fo:color="#${color(item.color)}"` : ''}/></style:style>`);
      let content = `<text:span text:style-name="${name}">${xml(item.text).replace(/ {2,}/g, spaces => `<text:s text:c="${spaces.length}"/>`)}</text:span>`;
      if (safeLink(item.link)) content = `<text:a xlink:type="simple" xlink:href="${xml(item.link)}">${content}</text:a>`;
      return content;
    };
    const paragraph = (block, pageBreak = false) => {
      const name = `P${++styleIndex}`, align = ['left', 'right', 'center'].includes(block.alignment) ? block.alignment : 'left';
      styles.push(`<style:style style:name="${name}" style:family="paragraph"><style:paragraph-properties fo:text-align="${align}" fo:margin-top="${block.spaceBefore || 0}pt" fo:margin-bottom="6pt" fo:margin-left="${Math.min(100, block.indent || 0)}pt"${pageBreak ? ' fo:break-before="page"' : ''}/></style:style>`);
      const tag = block.type === 'heading' ? 'text:h' : 'text:p';
      return `<${tag} text:style-name="${name}"${block.type === 'heading' ? ` text:outline-level="${block.level}"` : ''}>${block.spans.map(span).join('')}</${tag}>`;
    };
    let body = '';
    if (appearance) {
      styles.push('<style:style style:name="PageImage" style:family="paragraph"><style:paragraph-properties fo:break-before="page" fo:margin-top="0pt" fo:margin-bottom="0pt"/></style:style>');
      for (const [index, page] of document.pages.entries()) {
        const name = `Pictures/page-${index + 1}.png`, scale = Math.min(451 / page.width, 680 / page.height);
        zip.file(name, page.image); entries.push(`<manifest:file-entry manifest:full-path="${name}" manifest:media-type="image/png"/>`);
        body += `<text:p${index ? ' text:style-name="PageImage"' : ''}><draw:frame draw:name="Page ${index + 1}" text:anchor-type="as-char" svg:width="${page.width * scale}pt" svg:height="${page.height * scale}pt"><draw:image xlink:href="${name}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/><svg:title>Page ${index + 1}</svg:title></draw:frame></text:p>`;
      }
    } else {
      body = blocksFor(document.pages[0])[0]?.type === 'heading' ? '' : paragraph({ type: 'heading', level: 1, spans: [{ text: document.title, bold: true, size: 24 }] });
      for (const [pageIndex, page] of document.pages.entries()) {
        let list = '';
        for (const [index, block] of pageBlocks(page).entries()) {
          const type = block.type === 'list-item' ? block.ordered ? 'Numbered' : 'Bulleted' : '';
          if (list && list !== type) { body += '</text:list>'; list = ''; }
          if (type && !list) { body += `<text:list text:style-name="${type}">`; list = type; }
          const content = paragraph(block, pageIndex > 0 && index === 0);
          body += type ? `<text:list-item${block.ordered ? ` text:start-value="${block.start}"` : ''}>${content}</text:list-item>` : content;
        }
        if (list) body += '</text:list>';
      }
    }
    const namespaces = 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"';
    styles.push('<text:list-style style:name="Bulleted"><text:list-level-style-bullet text:level="1" text:bullet-char="•"><style:list-level-properties text:space-before="0pt" text:min-label-width="18pt" text:min-label-distance="6pt"/></text:list-level-style-bullet></text:list-style>', '<text:list-style style:name="Numbered"><text:list-level-style-number text:level="1" style:num-format="1" style:num-suffix="."><style:list-level-properties text:space-before="0pt" text:min-label-width="18pt" text:min-label-distance="6pt"/></text:list-level-style-number></text:list-style>');
    zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?><office:document-content ${namespaces} office:version="1.3"><office:automatic-styles>${styles.join('')}</office:automatic-styles><office:body><office:text>${body}</office:text></office:body></office:document-content>`);
    zip.file('styles.xml', `<?xml version="1.0"?><office:document-styles ${namespaces} office:version="1.3"><office:styles/><office:automatic-styles><style:page-layout style:name="Page"><style:page-layout-properties fo:page-width="595.3pt" fo:page-height="841.9pt" fo:margin="72pt"/></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="Page"/></office:master-styles></office:document-styles>`);
    zip.file('meta.xml', `<?xml version="1.0" encoding="UTF-8"?><office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" office:version="1.3"><office:meta><dc:title>${xml(document.title)}</dc:title><dc:language>${xml(document.language)}</dc:language></office:meta></office:document-meta>`);
    zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="${mime}"/>${entries.join('')}</manifest:manifest>`);
  }
  return zip.generateAsync({ type: 'blob', mimeType: mime, compression: 'DEFLATE' });
}
