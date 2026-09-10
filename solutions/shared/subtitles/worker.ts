import { env, pipeline, TextStreamer } from '@huggingface/transformers';
import wasmUrl from 'onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import wasmModuleUrl from 'onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url';
import { audioSections, hasAudio, normalizeCues, SAMPLE_RATE, type Cue } from './core';
// Runtime code is bundled on our origin. Only public model files are fetched remotely.
env.allowLocalModels = false;
env.backends.onnx.wasm!.wasmPaths = { wasm: wasmUrl, mjs: wasmModuleUrl };
env.backends.onnx.wasm!.numThreads = 1;
// Already running in our own worker; avoid a nested runtime proxy worker.
env.backends.onnx.wasm!.proxy = false;
self.onmessage = async (event: MessageEvent<{ audio: Float32Array }>) => {
  let transcriber;
  try {
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      device: 'wasm', dtype: 'q8', revision: '79fb389fc764e7c395bd330e9531d9d32ada7049',
      progress_callback: (progress) => {
        if (progress.status === 'progress') self.postMessage({ type: 'progress', message: `Downloading speech model: ${Math.round(progress.progress)}% (${progress.file})` });
        else if (progress.status === 'initiate') self.postMessage({ type: 'progress', message: 'Loading speech model…' });
      },
    });
    const sections = audioSections(event.data.audio);
    const cues: Cue[] = [];
    for (const [index, section] of sections.entries()) {
      const audio = event.data.audio.subarray(section.start, section.end);
      if (!hasAudio(audio)) continue;
      const message = `Transcribing section ${index + 1} of ${sections.length}`;
      self.postMessage({ type: 'progress', message: `${message}…` });
      let partial = '';
      const streamer = new TextStreamer(transcriber.tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: text => { partial += text; self.postMessage({ type: 'progress', message: `${message}… ${partial.slice(-80)}` }); } });
      const result = await transcriber(audio, { return_timestamps: true, streamer });
      const output = Array.isArray(result) ? result[0] : result;
      cues.push(...normalizeCues(output.chunks ?? [], audio.length / SAMPLE_RATE).map(cue => ({ ...cue, start: Math.round((cue.start + section.start / SAMPLE_RATE) * 1000) / 1000, end: Math.round((cue.end + section.start / SAMPLE_RATE) * 1000) / 1000 })));
    }
    if (!cues.length) throw new Error('No speech was recognized. Check that the video contains clear English speech.');
    self.postMessage({ type: 'complete', cues });
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Speech recognition failed.' });
  } finally { await transcriber?.dispose(); }
};
