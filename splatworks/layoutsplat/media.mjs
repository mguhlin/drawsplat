// Local media import: browser decoders first, then bundled HEIF/FFmpeg/PDF decoders.
// A raster poster always accompanies motion media so print never has an empty frame.
export const MEDIA_ACCEPT = 'image/*,video/*,.tif,.tiff,.heic,.heif,.avif,.psd,.psb,.tga,.dds,.exr,.hdr,.jp2,.j2k,.jxl,.ico,.pcx,.ppm,.pgm,.pbm,.pdf,.mov,.mkv,.avi,.mpg,.mpeg,.m4v,.wmv,.flv,.mts,.m2ts,.ogv,.3gp';
export const readData = blob => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
export const loadScript = (src, global) => window[global] ? Promise.resolve() : new Promise((resolve, reject) => { const el = document.createElement('script'); el.src = src; el.onload = resolve; el.onerror = () => reject(Error('The local decoder could not load.')); document.head.append(el); });
const extension = file => file.name.split('.').at(-1).toLowerCase();
const VIDEO = new Set('mp4 webm mov mkv avi mpg mpeg m4v wmv flv mts m2ts ogv ogg 3gp'.split(' '));
const mime = ext => ({ mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', ogv: 'video/ogg', ogg: 'video/ogg' }[ext] || 'application/octet-stream');
let engine, loading, queue = Promise.resolve();
async function getEngine() {
  if (engine) return engine;
  if (!loading) loading = (async () => {
    const { FFmpeg } = await import('./vendor/ffmpeg/index.js');
    const responses = await Promise.all([1, 2].map(part => fetch(`../../solutions/mediasplat/ffmpeg/ffmpeg-core.part-0${part}`)));
    if (responses.some(r => !r.ok)) throw Error('The local format converter is unavailable.');
    const parts = await Promise.all(responses.map(r => r.arrayBuffer()));
    if (new DataView(parts[0]).getUint32(0) !== 0x0061736d) throw Error('Invalid local decoder.');
    const wasmURL = URL.createObjectURL(new Blob(parts, { type: 'application/wasm' }));
    const instance = new FFmpeg();
    try { await instance.load({ coreURL: new URL('../../solutions/mediasplat/ffmpeg/ffmpeg-core.js', location.href).href, wasmURL }); engine = instance; }
    finally { URL.revokeObjectURL(wasmURL); }
    return instance;
  })().finally(() => loading = null);
  return loading;
}
async function convert(file, video, onStatus, signal) {
  const work = async () => {
    signal?.throwIfAborted(); onStatus('Loading local format converter…'); const ff = await getEngine();
    const input = `input.${extension(file).replace(/[^a-z0-9]/g, '') || 'bin'}`, output = video ? 'output.mp4' : 'output.png';
    const abort = () => { ff.terminate(); engine = null; }, progress = ({ progress }) => onStatus(`Converting locally… ${Math.round(Math.max(0, Math.min(.99, progress || 0)) * 100)}%`);
    signal?.addEventListener('abort', abort, { once: true }); ff.on('progress', progress);
    const timer = setTimeout(abort, 180000);
    try {
      await ff.writeFile(input, new Uint8Array(await file.arrayBuffer())); signal?.throwIfAborted();
      const args = video ? ['-map', '0:v:0', '-map', '0:a?', '-vf', "scale=w='min(1920,iw)':h=-2", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart'] : ['-frames:v', '1', '-vf', "scale=w='min(6000,iw)':h=-1"];
      const code = await ff.exec(['-i', input, ...args, output]);
      if (code !== 0) throw Error('This variant is not supported by the local converter.');
      const bytes = await ff.readFile(output); if (typeof bytes === 'string' || !bytes.length || bytes.length > 96000000) throw Error('The converted media is too large.');
      return new Blob([bytes], { type: video ? 'video/mp4' : 'image/png' });
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); ff.off('progress', progress); for (const name of [input, output]) try { await ff.deleteFile(name); } catch { /* terminated */ } }
  };
  const result = queue.then(work); queue = result.catch(() => {}); return result;
}
function checkDimensions(w, h) { if (!w || !h || w > 20000 || h > 20000 || w * h > 40000000) throw Error('Images are limited to 40 megapixels and 20,000 pixels per side.'); }
async function raster(blob) {
  const url = URL.createObjectURL(blob), image = new Image(); image.src = url;
  try { await image.decode(); checkDimensions(image.naturalWidth, image.naturalHeight); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; canvas.getContext('2d').drawImage(image, 0, 0); return { width: canvas.width, height: canvas.height, src: canvas.toDataURL('image/png') }; }
  finally { URL.revokeObjectURL(url); }
}
async function heif(file) {
  const { default: createHeif } = await import('./vendor/libheif-bundle.mjs'), libheif = await createHeif(); const decoder = new libheif.HeifDecoder(), images = decoder.decode(new Uint8Array(await file.arrayBuffer()));
  if (!images.length) throw Error('No decodable HEIF image.');
  try { const image = images[0], width = image.get_width(), height = image.get_height(); checkDimensions(width, height); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'), data = ctx.createImageData(width, height);
    await new Promise((resolve, reject) => image.display(data, result => result ? resolve() : reject(Error('HEIF decode failed.')))); ctx.putImageData(data, 0, 0); return { width, height, src: canvas.toDataURL('image/png'), notes: ['HEIC/HEIF converted to a PNG picture. Only the first image is placed.'] };
  } finally { images.forEach(image => image.free()); }
}
async function photoshop(file) {
  const bytes = await file.arrayBuffer(), view = new DataView(bytes); if (bytes.byteLength < 26 || new TextDecoder().decode(new Uint8Array(bytes, 0, 4)) !== '8BPS') throw Error('Invalid Photoshop image.'); checkDimensions(view.getUint32(18), view.getUint32(14));
  await loadScript('vendor/ag-psd.js', 'agPsd'); const psd = agPsd.readPsd(bytes, { skipLayerImageData: true, skipThumbnail: true, useImageData: true });
  if (!psd.imageData) throw Error('Save this Photoshop document with a merged composite preview before importing.'); const canvas = document.createElement('canvas'); canvas.width = psd.width; canvas.height = psd.height; canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(psd.imageData.data), psd.width, psd.height), 0, 0);
  return { width: canvas.width, height: canvas.height, src: canvas.toDataURL('image/png'), notes: ['Photoshop composite imported as a picture. Layers, masks, and adjustment settings are flattened. Keep the original PSD/PSB for layer editing.'] };
}
function sanitizedSvg(text) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw Error('Unsupported SVG declaration.'); const xml = new DOMParser().parseFromString(text, 'image/svg+xml'); if (xml.querySelector('parsererror') || xml.documentElement.localName !== 'svg') throw Error('Invalid SVG.');
  const tags = new Set('svg g path rect circle ellipse line polyline polygon text tspan defs linearGradient radialGradient stop clipPath mask title desc image use symbol'.split(' '));
  for (const el of [...xml.querySelectorAll('*')]) {
    if (!tags.has(el.localName)) { el.remove(); continue; }
    for (const attr of [...el.attributes]) if (/^on/i.test(attr.name) || /javascript:|https?:|\/\/|@import|@font-face/i.test(attr.value) || /url\((?!\s*#)/i.test(attr.value) || /href$/i.test(attr.name) && !/^(#|data:image\/(png|jpeg|webp);base64,)/.test(attr.value)) el.removeAttribute(attr.name);
  }
  return new Blob([new XMLSerializer().serializeToString(xml)], { type: 'image/svg+xml' });
}
async function pdfPicture(file, choosePage) {
  await loadScript('../../vendor/pdf.min.js', 'pdfjsLib'); pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.min.js', location.href).href;
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  try { const number = pdf.numPages > 1 ? await choosePage(pdf.numPages) : 1; if (!Number.isInteger(number) || number < 1 || number > pdf.numPages) throw Error('Choose a valid PDF page.'); const page = await pdf.getPage(number), base = page.getViewport({ scale: 1 }), scale = Math.min(300 / 72, 6000 / Math.max(base.width, base.height)), viewport = page.getViewport({ scale }), canvas = document.createElement('canvas'); checkDimensions(Math.ceil(viewport.width), Math.ceil(viewport.height)); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return { width: canvas.width, height: canvas.height, src: canvas.toDataURL('image/png'), notes: [`PDF page ${number} of ${pdf.numPages} placed as a picture at up to 300 ppi. Text is not editable.`] };
  } finally { await pdf.destroy(); }
}
async function videoPoster(blob, signal) {
  const url = URL.createObjectURL(blob), video = document.createElement('video'); video.preload = 'auto'; video.muted = true; video.src = url;
  const wait = event => new Promise((resolve, reject) => { const cleanup = () => { clearTimeout(timer); video.removeEventListener(event, success); video.removeEventListener('error', failure); signal?.removeEventListener('abort', failure); }, success = () => { cleanup(); resolve(); }, failure = () => { cleanup(); reject(Error('This video codec could not be opened.')); }, timer = setTimeout(failure, 15000); video.addEventListener(event, success, { once: true }); video.addEventListener('error', failure, { once: true }); signal?.addEventListener('abort', failure, { once: true }); });
  try { await wait('loadeddata'); checkDimensions(video.videoWidth, video.videoHeight); if (video.duration > .2) { const seeking = wait('seeked'); video.currentTime = Math.min(1, video.duration / 2); await seeking; } const scale = Math.min(1, 3000 / Math.max(video.videoWidth, video.videoHeight)), canvas = document.createElement('canvas'); canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale); canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); return { width: canvas.width, height: canvas.height, src: canvas.toDataURL('image/png'), duration: Number.isFinite(video.duration) ? video.duration : 0 }; }
  finally { video.pause(); video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
}
export async function importMedia(file, { onStatus = () => {}, signal, choosePage = count => Promise.resolve(Number(prompt(`PDF has ${count} pages. Which page should be placed?`, '1'))) } = {}) {
  if (!file.size || file.size > 96000000) throw Error('Choose a file smaller than 96 MB.'); signal?.throwIfAborted(); const ext = extension(file), video = file.type.startsWith('video/') || VIDEO.has(ext); let result, notes = [];
  if (video) {
    let playable = new Blob([file], { type: file.type || mime(ext) });
    try { if (!['mp4', 'webm', 'ogv', 'ogg'].includes(ext)) throw Error('Convert container.'); result = await videoPoster(playable, signal); }
    catch { signal?.throwIfAborted(); playable = await convert(file, true, onStatus, signal); result = await videoPoster(playable, signal); notes.push('Converted locally to MP4/H.264 for wider playback compatibility.'); }
    result.media = { kind: 'video', mime: playable.type, src: await readData(playable), duration: result.duration }; delete result.duration; notes.push('Videos play in HTML. Print, PDF, SVG, and layout exchange use the poster picture.');
  } else if (ext === 'pdf' || file.type === 'application/pdf') result = await pdfPicture(file, choosePage);
  else if (['heic', 'heif'].includes(ext)) { onStatus('Decoding HEIC locally…'); result = await heif(file); }
  else if (['psd', 'psb'].includes(ext)) result = await photoshop(file);
  else if (ext === 'svg' || file.type === 'image/svg+xml') { result = await raster(sanitizedSvg(await file.text())); notes.push('SVG placed as a picture. Use Open for editable SVG objects.'); }
  else {
    try { result = await raster(file); }
    catch { signal?.throwIfAborted(); result = await raster(await convert(file, false, onStatus, signal)); notes.push('Converted to a PNG picture locally. Layers, additional pages, animation, and HDR/color profiles are flattened.'); }
    if (ext === 'gif' || ['image/gif', 'image/apng'].includes(file.type)) { result.media = { kind: 'animation', mime: file.type || 'image/gif', src: await readData(file) }; notes.push('Animation plays in HTML; printing uses its first frame.'); }
  }
  if (result.src.length > 64000000) throw Error('The decoded picture is too large; resize it first.');
  return { name: file.name.slice(0, 200), alt: '', ...result, notes: [...notes, ...(result.notes || [])] };
}
