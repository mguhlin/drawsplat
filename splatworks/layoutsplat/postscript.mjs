export async function convertPostscript(file, { kind = 'png', signal, onStatus = () => {} } = {}) {
  if (!file.size || file.size > 32000000) throw Error('Choose an EPS/PostScript file smaller than 32 MB.');
  const bytes = await file.arrayBuffer(); signal?.throwIfAborted(); onStatus('Converting PostScript locally…');
  // Bound raster dimensions from the declared EPS box before starting the interpreter.
  const header = new TextDecoder('latin1').decode(new Uint8Array(bytes).slice(0, 64000)), box = /%%(?:HiRes)?BoundingBox:\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/.exec(header);
  if (!box && kind !== 'pdf') throw Error('EPS needs a numeric BoundingBox for safe raster sizing.');
  const width = box ? Math.abs(Number(box[3]) - Number(box[1])) : 612, height = box ? Math.abs(Number(box[4]) - Number(box[2])) : 792;
  if (!width || !height || width > 10000 || height > 10000) throw Error('EPS artwork bounds are invalid or too large.');
  const ppi = Math.max(36, Math.min(300, 6000 * 72 / Math.max(width, height), Math.sqrt(40000000 / (width * height)) * 72));
  const worker = new Worker(new URL('./postscript-worker.mjs', import.meta.url), { type: 'module' });
  return await new Promise((resolve, reject) => {
    const finish = error => { clearTimeout(timer); signal?.removeEventListener('abort', abort); worker.terminate(); if (error) reject(error); }, abort = () => finish(Error('PostScript conversion cancelled.')), timer = setTimeout(() => finish(Error('PostScript conversion timed out.')), 90000);
    signal?.addEventListener('abort', abort, { once: true }); worker.onerror = e => finish(Error(e.message || 'PostScript decoder failed.'));
    worker.onmessage = ({ data }) => { finish(); data.error ? reject(Error(data.error)) : resolve({ blob: new Blob([data.bytes], { type: data.mime }), widthPt: width, heightPt: height, ppi }); };
    worker.postMessage({ bytes, kind, ppi }, [bytes]);
  });
}
