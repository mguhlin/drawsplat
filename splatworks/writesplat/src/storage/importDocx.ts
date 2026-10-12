// Minimal .docx importer: reads word/document.xml out of the zip (using the
// browser's native DecompressionStream for deflated entries) and converts the
// common WordprocessingML paragraphs/runs into HTML the editor can load.

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const inflated = source.pipeThrough(
    new DecompressionStream('deflate-raw') as unknown as ReadableWritablePair<Uint8Array, Uint8Array>,
  );
  const reader = inflated.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if(total>8_000_000)throw new Error('The document XML is too large.');
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}
function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

// Extract a single file from a ZIP archive by name (supports stored + deflate).
export async function extractZipEntry(buffer: ArrayBuffer, name: string): Promise<string | null> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  // Find End Of Central Directory record (signature 0x06054b50) scanning from the end.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (readUint32(view, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  const entries = readUint16(view, eocd + 10);
  let pointer = readUint32(view, eocd + 16); // start of central directory
  for (let e = 0; e < entries; e += 1) {
    if (readUint32(view, pointer) !== 0x02014b50) break;
    const method = readUint16(view, pointer + 10);
    const compressedSize = readUint32(view, pointer + 20);
    const nameLen = readUint16(view, pointer + 28);
    const extraLen = readUint16(view, pointer + 30);
    const commentLen = readUint16(view, pointer + 32);
    const localOffset = readUint32(view, pointer + 42);
    const entryName = new TextDecoder().decode(bytes.subarray(pointer + 46, pointer + 46 + nameLen));
    if (entryName === name) {
      // Read the local file header to find the real data offset.
      const localNameLen = readUint16(view, localOffset + 26);
      const localExtraLen = readUint16(view, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
      const raw = method === 0 ? compressed : await inflateRaw(compressed);
      return new TextDecoder().decode(raw);
    }
    pointer += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

function documentXmlToHtml(xml: string, relationships?: string | null, numbering?:string | null): string {
  if (xml.length > 8_000_000 || /<!DOCTYPE/i.test(xml)) throw new Error('This Word document is too large or contains an unsupported document type.');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('This Word document contains invalid XML.');
  const lists=new Map<string,string>();
  if(numbering){
    const definitions=new DOMParser().parseFromString(numbering,'application/xml');
    const abstracts=new Map<string,string>();
    for(const node of definitions.getElementsByTagNameNS(WORD_NS,'abstractNum'))abstracts.set(node.getAttributeNS(WORD_NS,'abstractNumId') || '',node.getElementsByTagNameNS(WORD_NS,'numFmt')[0]?.getAttributeNS(WORD_NS,'val')==='bullet'?'ul':'ol');
    for(const node of definitions.getElementsByTagNameNS(WORD_NS,'num'))lists.set(node.getAttributeNS(WORD_NS,'numId') || '',abstracts.get(node.getElementsByTagNameNS(WORD_NS,'abstractNumId')[0]?.getAttributeNS(WORD_NS,'val') || '') || 'ul');
  }
  const links = new Map<string,string>();
  if (relationships) {
    const rels = new DOMParser().parseFromString(relationships, 'application/xml');
    for (const rel of rels.getElementsByTagName('Relationship')) {
      const target=rel.getAttribute('Target') || '';
      if (/^(https?:|mailto:)/i.test(target) && rel.getAttribute('Type')?.endsWith('/hyperlink')) links.set(rel.getAttribute('Id') || '',target);
    }
  }
  const attr=(node:Element,key:string)=>node.getAttributeNS(WORD_NS,key) || '';
  const properties=(node:Element,name:string)=>Array.from(node.getElementsByTagNameNS(WORD_NS,name));
  const enabled=(node:Element,name:string)=>{const prop=properties(node,name)[0];return !!prop && !['0','false','off'].includes(attr(prop,'val'));};
  function inline(node:Element):string {
    if(node.namespaceURI!==WORD_NS)return '';
    if(node.localName==='r'){
      let text=Array.from(node.children).map(child=>child.localName==='t'?escapeHtml(child.textContent || ''):child.localName==='tab'?'&#9;':child.localName==='br'||child.localName==='cr'?'<br>':'').join('');
      if(enabled(node,'b'))text='<strong>'+text+'</strong>';
      if(enabled(node,'i'))text='<em>'+text+'</em>';
      if(enabled(node,'u') && attr(properties(node,'u')[0],'val')!=='none')text='<u>'+text+'</u>';
      if(enabled(node,'strike'))text='<s>'+text+'</s>';
      return text;
    }
    const text=Array.from(node.children).map(inline).join('');
    if(node.localName==='hyperlink'){
      const url=links.get(node.getAttributeNS(REL_NS,'id') || '');
      return url?'<a href="'+escapeHtml(url).replace(/"/g,'&quot;')+'">'+text+'</a>':text;
    }
    return text;
  }
  function block(node:Element):string {
    if(node.namespaceURI!==WORD_NS)return '';
    if(node.localName==='p'){
      const style=attr(properties(node,'pStyle')[0] || node,'val');
      const heading=/Heading(\d)/i.exec(style);
      const inner=Array.from(node.children).filter(child=>child.localName!=='pPr').map(inline).join('');
      if(heading){const level=Math.max(1,Math.min(6,Number(heading[1])));return `<h${level}>${inner}</h${level}>`;}
      if(properties(node,'numPr').length){const kind=lists.get(attr(properties(node,'numId')[0] || node,'val')) || 'ul';return '<'+kind+'><li>'+inner+'</li></'+kind+'>';}
      return '<p>'+inner+'</p>';
    }
    if(node.localName==='tbl'){
      return '<table><tbody>'+Array.from(node.children).filter(row=>row.localName==='tr').map(row=>'<tr>'+Array.from(row.children).filter(cell=>cell.localName==='tc').map(cell=>{
        const span=Number(attr(properties(cell,'gridSpan')[0] || cell,'val')) || 1;
        const cols=Math.max(1,Math.min(100,span));
        return '<td'+(cols>1?' colspan="'+cols+'"':'')+'>'+Array.from(cell.children).filter(child=>child.localName!=='tcPr').map(block).join('')+'</td>';
      }).join('')+'</tr>').join('')+'</tbody></table>';
    }
    return '';
  }
  const body=doc.getElementsByTagNameNS(WORD_NS,'body')[0];
  if(!body)throw new Error('This Word document has no document body.');
  return Array.from(body.children).map(block).join('').replace(/<\/ul><ul>/g,'').replace(/<\/ol><ol>/g,'');
}

export async function docxToHtml(buffer: ArrayBuffer): Promise<string> {
  if(buffer.byteLength>20_000_000)throw new Error('Word imports are limited to 20 MB.');
  const xml = await extractZipEntry(buffer, 'word/document.xml');
  if (!xml) {
    throw new Error('This does not look like a Word .docx file.');
  }
  const relationships=await extractZipEntry(buffer,'word/_rels/document.xml.rels');
  const numbering=await extractZipEntry(buffer,'word/numbering.xml');
  const html = documentXmlToHtml(xml,relationships,numbering);
  return html || '<p></p>';
}
