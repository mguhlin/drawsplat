import { buildStoredZip } from './zip';

export function htmlToOdtBlob(title: string, html: string): Blob {
  const host = document.createElement('div');
  host.innerHTML = html;
  const contentXml = createContentXml(title, host);
  const zip = buildStoredZip([
    { name: 'mimetype', data: 'application/vnd.oasis.opendocument.text' },
    { name: 'META-INF/manifest.xml', data: manifestXml() },
    { name: 'content.xml', data: contentXml },
    { name: 'styles.xml', data: stylesXml() },
    { name: 'meta.xml', data: metaXml(title) },
  ]);

  const payload = new ArrayBuffer(zip.byteLength);
  new Uint8Array(payload).set(zip);
  return new Blob([payload], { type: 'application/vnd.oasis.opendocument.text' });
}

function createContentXml(title: string, host: HTMLElement): string {
  const body = Array.from(host.childNodes).map(nodeToOdt).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.2">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">${escapeXml(title || 'Untitled Document')}</text:h>
      ${body || '<text:p />'}
    </office:text>
  </office:body>
</office:document-content>`;
}

function nodeToOdt(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? `<text:p>${escapeXml(text)}</text:p>` : '';
  }

  if (!(node instanceof HTMLElement)) {
    return '';
  }

  const tag = node.tagName.toLowerCase();

  if (/^h[1-6]$/u.test(tag)) {
    return `<text:h text:outline-level="${tag.slice(1)}">${inlineOdt(node)}</text:h>`;
  }

  if (tag === 'p') {
    return `<text:p>${inlineOdt(node)}</text:p>`;
  }

  if (tag === 'blockquote') {
    return `<text:p text:style-name="Blockquote">${inlineOdt(node)}</text:p>`;
  }

  if (tag === 'pre' || tag === 'code') {
    return `<text:p text:style-name="Code">${escapeXml(node.textContent ?? '')}</text:p>`;
  }

  if (tag === 'hr') {
    return '<text:p>---</text:p>';
  }

  if (node.dataset.pageBreak === 'true') {
    return '<text:p text:style-name="PageBreak" />';
  }

  if (tag === 'ul' || tag === 'ol') {
    return `<text:list>${Array.from(node.children)
      .map((child) => `<text:list-item>${nodeToOdt(child)}</text:list-item>`)
      .join('')}</text:list>`;
  }

  if (tag === 'li') {
    return `<text:p>${inlineOdt(node)}</text:p>`;
  }

  if (tag === 'table') {
    return tableToOdt(node);
  }

  if (tag === 'img') {
    return `<text:p>[Image: ${escapeXml(node.getAttribute('alt') || 'embedded image')}]</text:p>`;
  }

  return `<text:p>${inlineOdt(node)}</text:p>`;
}

function tableToOdt(table: HTMLElement): string {
  return `<table:table>${Array.from(table.querySelectorAll('tr'))
    .map(
      (row) =>
        `<table:table-row>${Array.from(row.children)
          .map((cell) => {
            const element = cell as HTMLTableCellElement;
            const spanAttrs = [
              element.colSpan > 1 ? `table:number-columns-spanned="${element.colSpan}"` : '',
              element.rowSpan > 1 ? `table:number-rows-spanned="${element.rowSpan}"` : '',
            ]
              .filter(Boolean)
              .join(' ');
            return `<table:table-cell office:value-type="string"${spanAttrs ? ` ${spanAttrs}` : ''}><text:p>${inlineOdt(element)}</text:p></table:table-cell>`;
          })
          .join('')}</table:table-row>`,
    )
    .join('')}</table:table>`;
}

function inlineOdt(element: HTMLElement): string {
  return Array.from(element.childNodes)
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return escapeXml(node.textContent ?? '');
      }

      if (!(node instanceof HTMLElement)) {
        return '';
      }

      const tag = node.tagName.toLowerCase();
      const text = inlineOdt(node);

      if (tag === 'a') {
        return `<text:a xlink:type="simple" xlink:href="${escapeXml(node.getAttribute('href') ?? '')}">${text}</text:a>`;
      }

      if (tag === 'strong') {
        return `<text:span text:style-name="Bold">${text}</text:span>`;
      }

      if (tag === 'em') {
        return `<text:span text:style-name="Italic">${text}</text:span>`;
      }

      if (tag === 'u') {
        return `<text:span text:style-name="Underline">${text}</text:span>`;
      }

      if (tag === 's') {
        return `<text:span text:style-name="Strike">${text}</text:span>`;
      }

      if (tag === 'br') {
        return '<text:line-break />';
      }

      if (tag === 'img') {
        return `[Image: ${escapeXml(node.getAttribute('alt') || 'embedded image')}]`;
      }

      return text;
    })
    .join('');
}

function manifestXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;
}

function stylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.2">
  <office:styles>
    <style:style style:name="Bold" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>
    <style:style style:name="Italic" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>
    <style:style style:name="Underline" style:family="text"><style:text-properties style:text-underline-style="solid"/></style:style>
    <style:style style:name="Strike" style:family="text"><style:text-properties style:text-line-through-style="solid"/></style:style>
    <style:style style:name="Blockquote" style:family="paragraph"><style:paragraph-properties fo:margin-left="0.3in"/></style:style>
    <style:style style:name="Code" style:family="paragraph"><style:text-properties style:font-name="monospace"/></style:style>
    <style:style style:name="PageBreak" style:family="paragraph"><style:paragraph-properties fo:break-before="page"/></style:style>
  </office:styles>
</office:document-styles>`;
}

function metaXml(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" office:version="1.2">
  <office:meta><dc:title>${escapeXml(title || 'Untitled Document')}</dc:title></office:meta>
</office:document-meta>`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/gu, (char) => {
    const escapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return escapes[char] ?? char;
  });
}
