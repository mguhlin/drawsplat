import type { ResultFile } from "./processor";

const encoder = new TextEncoder();
const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value; for (let bit = 0; bit < 8; bit++) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1; return crc >>> 0;
});
const crc32 = (data: Uint8Array) => { let crc = 0xffffffff; for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; };
const header = (size: number) => { const bytes = new Uint8Array(size); return { bytes, view: new DataView(bytes.buffer) }; };
const blobBytes = (blob: Blob) => new Promise<Uint8Array>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer)); reader.onerror = () => reject(new Error("An output file could not be read for ZIP packaging.")); reader.readAsArrayBuffer(blob); });

export async function createZip(files: ResultFile[]): Promise<Blob> {
  if (!files.length) throw new Error("There are no output files to download.");
  const locals: Uint8Array[] = []; const centrals: Uint8Array[] = []; let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name); const data = await blobBytes(file.blob); const checksum = crc32(data);
    const local = header(30 + name.length); local.view.setUint32(0, 0x04034b50, true); local.view.setUint16(4, 20, true); local.view.setUint16(6, 0x0800, true); local.view.setUint32(14, checksum, true); local.view.setUint32(18, data.length, true); local.view.setUint32(22, data.length, true); local.view.setUint16(26, name.length, true); local.bytes.set(name, 30); locals.push(local.bytes, data);
    const central = header(46 + name.length); central.view.setUint32(0, 0x02014b50, true); central.view.setUint16(4, 20, true); central.view.setUint16(6, 20, true); central.view.setUint16(8, 0x0800, true); central.view.setUint32(16, checksum, true); central.view.setUint32(20, data.length, true); central.view.setUint32(24, data.length, true); central.view.setUint16(28, name.length, true); central.view.setUint32(42, offset, true); central.bytes.set(name, 46); centrals.push(central.bytes); offset += local.bytes.length + data.length;
  }
  const centralSize = centrals.reduce((sum, value) => sum + value.length, 0); const end = header(22); end.view.setUint32(0, 0x06054b50, true); end.view.setUint16(8, files.length, true); end.view.setUint16(10, files.length, true); end.view.setUint32(12, centralSize, true); end.view.setUint32(16, offset, true);
  const parts = [...locals, ...centrals, end.bytes].map(bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  return new Blob(parts, { type: "application/zip" });
}
