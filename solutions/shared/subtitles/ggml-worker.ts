import createWhisper from './ggml/runtime.js';
import { cacheModelReads } from './ggml/model-reader';
import wasmUrl from './ggml/splat-whisper.wasm?url';
import { normalizeCues, SAMPLE_RATE } from './core';
let engine: Awaited<ReturnType<typeof createWhisper>> | undefined;
self.onmessage = async ({ data }: MessageEvent<{ audio: Float32Array; modelFile?: Blob }>) => {
  try {
    if (!engine) {
      if (!data.modelFile) throw new Error('Select your local Whisper GGML model file again.');
      self.postMessage({ type: 'progress', message: 'Loading your local GGML model… Large models can take a while.' });
      const loaded = await createWhisper({ locateFile: () => wasmUrl, print: () => {}, printErr: () => {} });
      // WORKERFS reads slices from the selected Blob; never copy a multi-GB model
      // into MEMFS or a JavaScript ArrayBuffer before loading it into WASM.
      const releaseReader = cacheModelReads(loaded.WORKERFS, percent => self.postMessage({ type: 'progress', message: `Loading your local GGML model: ${percent}%` }));
      loaded.FS.mkdir('/model');
      loaded.FS.mount(loaded.WORKERFS, { blobs: [{ name: 'model.bin', data: data.modelFile }] }, '/model');
      try {
        if (!loaded._splat_init()) throw new Error('The model could not load. It may be incomplete, incompatible, or too large for this browser. Try a smaller or quantized GGML Whisper model.');
      } finally { loaded.FS.unmount('/model'); releaseReader(); }
      engine = loaded;
    }
    // WASM32 exports return signed i32 values; preserve addresses above 2 GiB.
    const pointer = engine._malloc(data.audio.byteLength) >>> 0;
    if (!pointer) throw new Error('There is not enough browser memory. Choose a smaller GGML model.');
    try {
      engine.HEAPF32.set(data.audio, pointer / Float32Array.BYTES_PER_ELEMENT);
      if (engine._splat_transcribe(pointer, data.audio.length) !== 0) throw new Error('The local model could not transcribe this section. Try a smaller model or a shorter recording.');
      const chunks = Array.from({ length: engine._splat_count() }, (_, i) => ({
        text: engine!.UTF8ToString(engine!._splat_text(i) >>> 0), timestamp: [engine!._splat_start(i), engine!._splat_end(i)] as [number, number],
      }));
      self.postMessage({ type: 'complete', cues: normalizeCues(chunks, data.audio.length / SAMPLE_RATE) });
    } finally { engine._free(pointer); }
  } catch (error) {
    engine?._splat_free(); engine = undefined;
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'The local model could not run in this browser. Try a smaller or quantized GGML model.' });
  }
};
