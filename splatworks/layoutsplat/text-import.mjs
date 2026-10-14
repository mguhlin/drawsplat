import { parseXml, fontFamily } from './compatibility.mjs';
import { readZip } from './desktop-formats.mjs';
import { writeSplatText } from './suite-interchange.mjs';
const elements = (el, name) => [...el.getElementsByTagNameNS('*', name)];
const attr = (el, name) => [...(el?.attributes || [])].find(a => a.localName === name)?.value;
export const TEXT_ACCEPT = '.txt,.md,.markdown,.csv,.tsv,.html,.htm,.doc,.docx,.odt,.json,text/plain,text/markdown';
export async function importText(file,customFonts={}) {
  if (!file.size || file.size > 20000000) throw Error('Choose a text/document file under 20 MB.');
  const ext = file.name.split('.').at(-1).toLowerCase(); let text = '', marks = [], notes = [];
  if (ext === 'json') return writeSplatText(JSON.parse(await file.text()));
  if (ext === 'doc') {
    const { decodeLegacyWord } = await import('../shared/word-legacy/import.mjs');
    const { legacyWordXmlToHtml } = await import('../shared/office-text.mjs');
    const { officeHtmlToStory } = await import('./office-story.mjs');
    const story = officeHtmlToStory(legacyWordXmlToHtml(await decodeLegacyWord(file)),customFonts);
    notes.push('Binary Word decoded locally in a browser worker. Text, supported run styles, font sizes/colors/families, list counters and paragraph indents/spacing are editable. Source line leading, fields, floating objects and advanced layout need review.');
    if(story.substitutedFonts.length)notes.push('Unavailable source fonts were matched to built-in families: '+story.substitutedFonts.join(', ')+'.');
    return {...story,notes};
  }
  if (['docx','odt'].includes(ext)) {
    const zip = await readZip(file);
    const read = async path => { const entry = zip.file(path); if (!entry) return null; if (entry._data?.uncompressedSize > 8000000) throw Error('Document XML exceeds 8 MB.'); const value = await entry.async('string'); if(value.length > 8000000) throw Error('Document XML exceeds 8 MB.'); return value; };
    const { wordXmlToHtml, odtXmlToHtml } = await import('../shared/office-text.mjs');
    const { officeHtmlToStory } = await import('./office-story.mjs');
    let html;
    if(ext === 'docx') { const xml = await read('word/document.xml'); if(!xml) throw Error('Invalid Word document.'); html = wordXmlToHtml(xml, await read('word/styles.xml'), await read('word/numbering.xml'), await read('word/_rels/document.xml.rels')); }
    else { const xml = await read('content.xml'); if(!xml) throw Error('Invalid OpenDocument text.'); html = odtXmlToHtml(xml, await read('styles.xml')); }
    const story = officeHtmlToStory(html,customFonts);
    notes.push('Imported document text with supported inline formatting, list numbering, paragraph spacing and indents.');
    if(html.includes('<table'))notes.push('Table cell text becomes paragraphs; table geometry is not placed in this frame.');
    if(/background-color|line-through/.test(html))notes.push('This document uses highlights or strike-through that LayoutSplat stories do not yet retain.');
    if(story.substitutedFonts.length)notes.push('Unavailable source fonts were matched to built-in families: '+story.substitutedFonts.join(', ')+'. Import the original font files first for closer metrics.');
    if(Object.keys(zip.files).some(path=>/^(word\/(media|header|footer)|Pictures\/)/.test(path)))notes.push('Document images, headers and footers are not inserted into the selected text frame.');
    return { ...story, notes };
  } else if (['html', 'htm'].includes(ext)) {
    const parsed = new DOMParser().parseFromString(await file.text(), 'text/html'); parsed.querySelectorAll('script,style,iframe,object,template').forEach(el => el.remove()); const blocks = [...parsed.body.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,pre')]; text = blocks.length ? blocks.map(el => el.textContent).join('\n') : parsed.body.textContent; notes.push('HTML text imported without scripts or external resources.');
  } else if (['txt', 'md', 'markdown', 'csv', 'tsv'].includes(ext) || file.type.startsWith('text/')) text = await file.text();
  else throw Error('Choose TXT, Markdown, CSV, TSV, HTML, DOC, DOCX, or ODT. Export RTF files to DOCX or ODT first.');
  text = text.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n'); if (text.length > 100000 || marks.length > 10000) throw Error('A story supports up to 100,000 characters and 10,000 formatting ranges.');
  return { text, marks, notes };
}
