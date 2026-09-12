import { env, pipeline, TextStreamer } from '@huggingface/transformers';
import wasmUrl from 'onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import wasmModuleUrl from 'onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url';
import { audioSections, groupWordCues, hasAudio, normalizeCues, SAMPLE_RATE, type Cue } from './core';
// Runtime code is bundled on our origin. Only public model files are fetched remotely.
env.allowLocalModels = false;
env.backends.onnx.wasm!.wasmPaths = { wasm: wasmUrl, mjs: wasmModuleUrl };
env.backends.onnx.wasm!.numThreads = 1;
// Already running in our own worker; avoid a nested runtime proxy worker.
env.backends.onnx.wasm!.proxy = false;
let transcriber: import('@huggingface/transformers').AutomaticSpeechRecognitionPipeline | undefined;
self.onmessage = async (event: MessageEvent<{ audio: Float32Array; allowEmpty?: boolean; keepAlive?: boolean }>) => {
  let loadingModel = !transcriber;
  let recognizedText = false;
  try {
    if (!transcriber) {
      const loaded = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
        device: 'wasm', dtype: 'q8', revision: '79fb389fc764e7c395bd330e9531d9d32ada7049',
        progress_callback: (progress) => {
          if (progress.status === 'progress') self.postMessage({ type: 'progress', message: `Downloading speech model: ${Math.round(progress.progress)}% (${progress.file})` });
          else if (progress.status === 'initiate') self.postMessage({ type: 'progress', message: 'Loading speech model…' });
        },
      });
      transcriber = loaded;
    }
    loadingModel = false;
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
      recognizedText ||= Boolean(output.text?.trim());
      let sectionCues = normalizeCues(output.chunks ?? [], audio.length / SAMPLE_RATE);
      if (!sectionCues.length) {
        // Timestamp-token decoding can return empty output even for clear speech.
        // Word alignment decodes text without those tokens, then aligns the words
        // to the audio using the same local model.
        self.postMessage({ type: 'progress', message: `${message}… Retrying with word timing…` });
        const retry = await transcriber(audio, { return_timestamps: 'word' });
        const aligned = Array.isArray(retry) ? retry[0] : retry;
        recognizedText ||= Boolean(aligned.text?.trim());
        sectionCues = groupWordCues(aligned.chunks ?? [], audio.length / SAMPLE_RATE);
      }
      cues.push(...sectionCues.map(cue => ({ ...cue, start: Math.round((cue.start + section.start / SAMPLE_RATE) * 1000) / 1000, end: Math.round((cue.end + section.start / SAMPLE_RATE) * 1000) / 1000 })));
    }
    if (!cues.length && (recognizedText || !event.data.allowEmpty)) throw new Error(recognizedText
      ? 'Speech was recognized, but caption timings could not be generated. Try again to resume this section.'
      : 'The speech model loaded, but did not recognize English speech. Play the selected clip and check that your voice is audible. If it is missing, check the microphone selection and record again. If speech is clear, try a shorter clip and generate again.');
    self.postMessage({ type: 'complete', cues });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Speech recognition failed.';
    self.postMessage({ type: 'error', message: loadingModel ? `The speech model could not load. Check your connection and retry. ${message}` : message });
  } finally {
    if (!event.data.keepAlive) { await transcriber?.dispose(); transcriber = undefined; }
  }
};
