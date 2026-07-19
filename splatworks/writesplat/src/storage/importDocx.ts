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
    chunks.push(value);
    total += value.length;
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
async function extractZipEntry(buffer: ArrayBuffer, name: string): Promise<string | null> {
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

// Convert the subset of WordprocessingML we care about into HTML.
function documentXmlToHtml(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const paragraphs = Array.from(doc.getElementsByTagName('w:p'));
  const blocks: string[] = [];
  const local = (element: Element, tag: string) => Array.from(element.getElementsByTagName(tag));
  for (const p of paragraphs) {
    const styleEl = p.getElementsByTagName('w:pStyle')[0];
    const style = styleEl?.getAttribute('w:val') ?? '';
    const listEl = p.getElementsByTagName('w:numPr')[0];
    let inner = '';
    for (const run of local(p, 'w:r')) {
      const texts = local(run, 'w:t').map((t) => t.textContent ?? '').join('');
      if (!texts) continue;
      let piece = escapeHtml(texts);
      if (run.getElementsByTagName('w:b').length) piece = `<strong>${piece}</strong>`;
      if (run.getElementsByTagName('w:i').length) piece = `<em>${piece}</em>`;
      if (run.getElementsByTagName('w:u').length) piece = `<u>${piece}</u>`;
      inner += piece;
    }
    if (!inner.trim() && !listEl) {
      blocks.push('<p></p>');
      continue;
    }
    const headingMatch = /Heading(\d)/i.exec(style);
    if (headingMatch) {
      const level = Math.min(6, Number(headingMatch[1]));
      blocks.push(`<h${level}>${inner}</h${level}>`);
    } else if (listEl) {
      blocks.push(`<ul><li>${inner}</li></ul>`);
    } else {
      blocks.push(`<p>${inner}</p>`);
    }
  }
  // Merge consecutive single-item lists into one list.
  return blocks.join('').replace(/<\/ul><ul>/g, '');
}

export async function docxToHtml(buffer: ArrayBuffer): Promise<string> {
  const xml = await extractZipEntry(buffer, 'word/document.xml');
  if (!xml) {
    throw new Error('This does not look like a Word .docx file.');
  }
  const html = documentXmlToHtml(xml);
  return html || '<p></p>';
}
