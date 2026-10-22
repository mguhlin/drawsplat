// SPDX-License-Identifier: AGPL-3.0-or-later
import { colorCutout, validateDimensions } from './pixels.mjs';

const MODELS = {
  fast: { id: 'onnx-community/ormbg-ONNX', revision: '034e2d884afbab897e10e78fc5bb566b29533fd6', device: 'wasm', dtype: 'q8' },
  best: { id: 'onnx-community/BEN2-ONNX', revision: 'c552aa82688edce09f0ac9d2e31ad53d9d629010', device: 'webgpu', dtype: 'fp16' }
};
let library, engine, engineKey, requestId, allowRemote = false;
const fetchOriginal = globalThis.fetch.bind(globalThis);
// The shared window privacy wrapper does not run inside a worker. Enforce the
// same optional-network choice here and keep destinations limited to assets.
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
  if (url.origin !== location.origin && (!allowRemote || url.protocol !== 'https:' || !/(^|\.)(huggingface\.co|hf\.co)$/.test(url.hostname)))
    return Promise.reject(new Error('Model downloads are disabled or the model host is unavailable. White and color removal still work locally.'));
  return fetchOriginal(input, init);
};

function progress(text) { self.postMessage({ id: requestId, type: 'progress', text }); }

async function getEngine(key) {
  if (engine && engineKey === key) return engine;
  if (engine) { await engine.dispose(); engine = null; engineKey = null; }
  progress('Loading the photo engine on this device…');
  library ||= await import('./vendor/transformers.min.js');
  library.env.allowLocalModels = false;
  library.env.useBrowserCache = true;
  library.env.backends.onnx.wasm.numThreads = 1;
  library.env.backends.onnx.wasm.proxy = false;
  library.env.backends.onnx.wasm.wasmPaths = new URL('./vendor/', import.meta.url).href;
  const model = MODELS[key];
  progress(`Preparing ${key === 'best' ? 'Best quality' : 'Fast'} photo cutout…`);
  const candidate = await library.pipeline('background-removal', model.id, {
    revision: model.revision, device: model.device, dtype: model.dtype,
    progress_callback: event => {
      if (event.status === 'progress' && event.total)
        progress(`Downloading photo model: ${(event.loaded / 1e6).toFixed(1)} of ${(event.total / 1e6).toFixed(1)} MB`);
      else if (event.status === 'done') progress('Model downloaded. Preparing local processing…');
    }
  });
  engine = candidate; engineKey = key;
  return engine;
}

self.onmessage = async ({ data: message }) => {
  const { id, width, height, options } = message;
  requestId = id; allowRemote = message.allowRemote === true;
  try {
    validateDimensions(width, height);
    const original = new Uint8ClampedArray(message.pixels);
    let result, usedModel = null, note = '';
    if (options.mode !== 'photo') {
      result = colorCutout(original, width, height, options);
    } else {
      let key = options.model === 'best' ? 'best' : 'fast';
      if (key === 'best') {
        let supported = false;
        try {
          const adapter = await navigator.gpu?.requestAdapter();
          supported = Boolean(adapter?.features.has('shader-f16'));
        } catch { /* The Fast model works without a graphics adapter. */ }
        if (!supported) { key = 'fast'; note = 'Best quality is unavailable on this device. Used Fast locally.'; }
      }
      let pipeline;
      try { pipeline = await getEngine(key); }
      catch (error) {
        if (key !== 'best') throw error;
        engine = null; engineKey = null;
        note = 'Best quality could not start on this device. Used Fast locally.';
        key = 'fast'; pipeline = await getEngine(key);
      }
      progress('Removing the background on this device…');
      let output;
      try { output = await pipeline(new library.RawImage(original, width, height, 4)); }
      catch (error) {
        if (key !== 'best') throw error;
        await engine?.dispose(); engine = null; engineKey = null;
        key = 'fast'; note = 'Best quality ran out of support on this device. Used Fast locally.';
        output = await (await getEngine(key))(new library.RawImage(original, width, height, 4));
      }
      const image = output[0];
      if (image.width !== width || image.height !== height || image.channels !== 4)
        throw new Error('The model returned an incomplete cutout. Try Fast or a smaller image.');
      result = new Uint8ClampedArray(original);
      for (let p = 0; p < width * height; p++) result[p * 4 + 3] = Math.round(original[p * 4 + 3] * image.data[p * 4 + 3] / 255);
      usedModel = key;
    }
    self.postMessage({ id, type: 'result', pixels: result.buffer, width, height, usedModel, note }, [result.buffer]);
  } catch (error) {
    self.postMessage({ id, type: 'error', message: error.message || 'This image could not be processed. Try another mode or a smaller image.' });
  }
};
