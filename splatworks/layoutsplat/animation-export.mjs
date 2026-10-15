export async function exportAnimation(doc, options, renderCanvas) {
  const { pages, gifDelayMs = 2000, gifMaxSize = 1080, onProgress = () => {} } = options;
  if (!Number.isFinite(gifDelayMs) || gifDelayMs < 100 || gifDelayMs > 60000) throw Error('GIF page duration must be between 0.1 and 60 seconds.');
  if (!Number.isInteger(gifMaxSize) || gifMaxSize < 128 || gifMaxSize > 1600) throw Error('GIF maximum dimension must be between 128 and 1600 pixels.');
  const ppi = gifMaxSize * 72 / Math.max(doc.width, doc.height);
  if (Math.ceil(doc.width * ppi / 72) * Math.ceil(doc.height * ppi / 72) * pages.length > 24000000) throw Error('GIF export is limited to 24 million total frame pixels. Select fewer pages or a smaller GIF size.');
  const frames = [], worker = new Worker(new URL('./gif-export-worker.js', import.meta.url));
  // Attach handlers before rendering so a missing/offline worker fails cleanly.
  let failure;
  worker.onerror = event => { event.preventDefault(); failure = Error('The local GIF encoder could not load. Reload and try again.'); };
  try {
    for (const [i, page] of pages.entries()) {
      if (failure) throw failure;
      onProgress(i + 1, pages.length);
      const canvas = await renderCanvas(page, ppi);
      try { frames.push(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)); }
      finally { canvas.width = canvas.height = 1; }
    }
    if (failure) throw failure;
    const blob = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('GIF encoding timed out. Select fewer pages or a smaller GIF size.')), 120000);
      worker.onerror = event => { event.preventDefault(); clearTimeout(timer); reject(Error('The local GIF encoder failed. Reload and try again.')); };
      worker.onmessage = ({ data }) => { clearTimeout(timer); data.error ? reject(Error(data.error)) : resolve(data.blob); };
      worker.postMessage({ frames, delayMs: gifDelayMs }, frames.map(frame => frame.data.buffer));
    });
    return { blob, extension: '.gif' };
  } finally { worker.terminate(); }
}
