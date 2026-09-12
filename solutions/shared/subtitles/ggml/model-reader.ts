export interface WorkerFileSystem {
  reader: { readAsArrayBuffer(blob: Blob): ArrayBuffer };
  stream_ops: { read(stream: { node: { contents: Blob; size: number } }, buffer: Uint8Array, offset: number, length: number, position: number): number };
}
/** Cache small stdio reads without making a complete in-memory copy of a model. */
export function cacheModelReads(fs: WorkerFileSystem, progress: (percent: number) => void): () => void {
  const original = fs.stream_ops.read;
  const blockSize = 8 * 1024 * 1024;
  let cached = new Uint8Array(0), cachedStart = -1;
  let cachedFile: Blob | undefined;
  let lastPercent = -1;
  fs.stream_ops.read = (stream, buffer, offset, length, position) => {
    const file = stream.node.contents;
    const count = Math.max(0, Math.min(length, file.size - position));
    let copied = 0;
    while (copied < count) {
      const at = position + copied;
      if (cachedFile !== file || at < cachedStart || at >= cachedStart + cached.length) {
        cachedStart = Math.floor(at / blockSize) * blockSize;
        cached = new Uint8Array(fs.reader.readAsArrayBuffer(file.slice(cachedStart, cachedStart + blockSize)));
        cachedFile = file;
        if (!cached.length) throw new Error('The selected model file could not be read. Select it again.');
      }
      const take = Math.min(count - copied, cached.length - (at - cachedStart));
      buffer.set(cached.subarray(at - cachedStart, at - cachedStart + take), offset + copied);
      copied += take;
    }
    const percent = Math.floor((position + copied) / file.size * 100);
    if (percent > lastPercent) { lastPercent = percent; progress(percent); }
    return copied;
  };
  return () => { fs.stream_ops.read = original; cached = new Uint8Array(0); cachedFile = undefined; };
}
