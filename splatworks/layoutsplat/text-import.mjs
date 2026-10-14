import { parseXml, fontFamily } from './compatibility.mjs';
import { readZip } from './desktop-formats.mjs';
import { writeSplatText } from './suite-interchange.mjs';
const elements = (el, name) => [...el.getElementsByTagNameNS('*', name)];
const attr = (el, name) => [...(el?.attributes || [])].find(a => a.localName === name)?.value;
export const TEXT_ACCEPT = '.txt,.md,.markdown,.csv,.tsv,.html,.htm,.docx,.odt,.json,text/plain,text/markdown';
export async function importText(file) {
  if (!file.size || file.size > 20000000) throw Error('Choose a text/document file under 20 MB.');
  const ext = file.name.split('.').at(-1).toLowerCase(); let text = '', marks = [], notes = [];
  if (ext === 'json') return writeSplatText(JSON.parse(await file.text()));
  if (ext === 'docx') {
    const zip = await readZip(file), entry = zip.file('word/document.xml'); if (!entry || entry._data?.uncompressedSize > 24000000) throw Error('Invalid Word document.'); const parsed = parseXml(await entry.async('string'));
    for (const p of elements(parsed, 'p')) {
      if (text) text += '\n';
      for (const run of elements(p, 'r')) { const from = text.length; for (const el of run.children) { if (el.localName === 't') text += el.textContent; if (el.localName === 'tab') text += '\t'; if (el.localName === 'br') text += '\n'; }
        if (text.length === from) continue; const props = elements(run, 'rPr')[0], m = { from, to: text.length };
        if (props) {
          for (const [name, key] of [['b', 'bold'], ['i', 'italic'], ['u', 'underline']]) { const el = elements(props, name)[0]; if (el) m[key] = !['0', 'false', 'off', 'none'].includes(attr(el, 'val')); }
          const size = Number(attr(elements(props, 'sz')[0], 'val')) / 2, color = attr(elements(props, 'color')[0], 'val'), font = attr(elements(props, 'rFonts')[0], 'ascii'); if (size >= 6 && size <= 120) m.size = size; if (/^[0-9a-f]{6}$/i.test(color || '')) m.color = '#' + color; if (font) m.font = fontFamily(font);
        }
        if (Object.keys(m).length > 2) marks.push(m);
      }
    }
    notes.push('Word text and direct character formatting imported. Images, tables, headers, footers, and document page layout are not placed in this text frame.');
  } else if (ext === 'odt') {
    const zip = await readZip(file), entry = zip.file('content.xml'); if (!entry || entry._data?.uncompressedSize > 24000000) throw Error('Invalid OpenDocument text.'); const parsed = parseXml(await entry.async('string'));
    const paragraphs = [...parsed.getElementsByTagName('*')].filter(el => ['p', 'h'].includes(el.localName) && /opendocument.*text/.test(el.namespaceURI || ''));
    text = paragraphs.map(p => { const copy = p.cloneNode(true); elements(copy, 'line-break').forEach(el => el.replaceWith(parsed.createTextNode('\n'))); elements(copy, 'tab').forEach(el => el.replaceWith(parsed.createTextNode('\t'))); return copy.textContent; }).join('\n'); notes.push('OpenDocument text imported as plain text. Use LayoutSplat formatting after import.');
  } else if (['html', 'htm'].includes(ext)) {
    const parsed = new DOMParser().parseFromString(await file.text(), 'text/html'); parsed.querySelectorAll('script,style,iframe,object,template').forEach(el => el.remove()); const blocks = [...parsed.body.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,pre')]; text = blocks.length ? blocks.map(el => el.textContent).join('\n') : parsed.body.textContent; notes.push('HTML text imported without scripts or external resources.');
  } else if (['txt', 'md', 'markdown', 'csv', 'tsv'].includes(ext) || file.type.startsWith('text/')) text = await file.text();
  else throw Error('Choose TXT, Markdown, CSV, TSV, HTML, DOCX, or ODT. Export older Word/RTF files to TXT or DOCX first.');
  text = text.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n'); if (text.length > 100000 || marks.length > 10000) throw Error('A story supports up to 100,000 characters and 10,000 formatting ranges.');
  return { text, marks, notes };
}
