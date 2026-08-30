import { extractZipEntry } from './importDocx';

const TEXT_NS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
const TABLE_NS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

export async function odtToHtml(buffer: ArrayBuffer): Promise<string> {
  const xml = await extractZipEntry(buffer, 'content.xml');
  if (!xml) throw new Error('This does not look like an OpenDocument .odt file.');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('The OpenDocument file contains invalid XML.');
  const officeText = Array.from(doc.getElementsByTagNameNS('*', 'text'))
    .find((node) => node.namespaceURI?.includes('office'));
  if (!officeText) throw new Error('The OpenDocument file does not contain a text document.');
  const html = Array.from(officeText.childNodes).map(blockToHtml).join('');
  return html || '<p></p>';
}

function blockToHtml(node: ChildNode): string {
  if (!(node instanceof Element)) return '';
  if (node.namespaceURI === TEXT_NS && node.localName === 'h') {
    const level = Math.min(6, Math.max(1, Number(node.getAttributeNS(TEXT_NS, 'outline-level')) || 1));
    return `<h${level}>${inlineToHtml(node)}</h${level}>`;
  }
  if (node.namespaceURI === TEXT_NS && node.localName === 'p') {
    const style = node.getAttributeNS(TEXT_NS, 'style-name') || '';
    if (/pagebreak/i.test(style)) return '<div data-page-break="true"></div>';
    const tag = /code/i.test(style) ? 'pre' : /blockquote|quote/i.test(style) ? 'blockquote' : 'p';
    return `<${tag}>${inlineToHtml(node)}</${tag}>`;
  }
  if (node.namespaceURI === TEXT_NS && node.localName === 'list') {
    const items = Array.from(node.children).filter((child) => child.localName === 'list-item');
    return `<ul>${items.map((item) => `<li>${Array.from(item.childNodes).map(listItemContent).join('')}</li>`).join('')}</ul>`;
  }
  if (node.namespaceURI === TABLE_NS && node.localName === 'table') return tableToHtml(node);
  return Array.from(node.childNodes).map(blockToHtml).join('');
}

function listItemContent(node: ChildNode): string {
  if (!(node instanceof Element)) return escapeHtml(node.textContent || '');
  if (node.localName === 'p' || node.localName === 'h') return inlineToHtml(node);
  if (node.localName === 'list') return blockToHtml(node);
  return inlineToHtml(node);
}

function tableToHtml(table: Element): string {
  const rows = Array.from(table.children).filter((child) => child.localName === 'table-row');
  return `<table><tbody>${rows.map((row) => `<tr>${Array.from(row.children).filter((cell) => cell.localName === 'table-cell').map((cell) => {
    const colSpan = Number(cell.getAttributeNS(TABLE_NS, 'number-columns-spanned')) || 1;
    const rowSpan = Number(cell.getAttributeNS(TABLE_NS, 'number-rows-spanned')) || 1;
    const attrs = `${colSpan > 1 ? ` colspan="${colSpan}"` : ''}${rowSpan > 1 ? ` rowspan="${rowSpan}"` : ''}`;
    return `<td${attrs}>${Array.from(cell.childNodes).map((child) => child instanceof Element ? inlineToHtml(child) : escapeHtml(child.textContent || '')).join('')}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table>`;
}

function inlineToHtml(element: Element): string {
  return Array.from(element.childNodes).map((node) => {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent || '');
    if (!(node instanceof Element)) return '';
    if (node.namespaceURI === TEXT_NS && node.localName === 'line-break') return '<br>';
    if (node.namespaceURI === TEXT_NS && node.localName === 'tab') return '&emsp;';
    if (node.namespaceURI === TEXT_NS && node.localName === 's') return ' '.repeat(Number(node.getAttributeNS(TEXT_NS, 'c')) || 1);
    const inner = inlineToHtml(node);
    if (node.namespaceURI === TEXT_NS && node.localName === 'a') {
      const href = node.getAttributeNS(XLINK_NS, 'href') || '';
      return /^https?:|^mailto:/i.test(href) ? `<a href="${escapeAttribute(href)}">${inner}</a>` : inner;
    }
    if (node.namespaceURI === TEXT_NS && node.localName === 'span') {
      const style = node.getAttributeNS(TEXT_NS, 'style-name') || '';
      let output = inner;
      if (/bold|strong/i.test(style)) output = `<strong>${output}</strong>`;
      if (/italic|emphasis/i.test(style)) output = `<em>${output}</em>`;
      if (/underline/i.test(style)) output = `<u>${output}</u>`;
      if (/strike/i.test(style)) output = `<s>${output}</s>`;
      return output;
    }
    return inner;
  }).join('');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
