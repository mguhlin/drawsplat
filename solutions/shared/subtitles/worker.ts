import { gpuPrecision, type Acceleration } from './acceleration';
import { getWhisperModel, type WhisperModelId } from './models';
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
let loadedModel: WhisperModelId | undefined;
let backend: 'webgpu' | 'wasm' | undefined;
let gpuFailed = false;
let precision: 'fp16' | 'fp32' | undefined;
type Request = { audio: Float32Array; model?: WhisperModelId; allowEmpty?: boolean; keepAlive?: boolean; acceleration?: Acceleration };
const handle = async (event: MessageEvent<Request>): Promise<void> => {
  const requestedModel = event.data.model ?? 'tiny';
  if (!backend) {
    precision = event.data.acceleration !== 'cpu' && !gpuFailed ? await gpuPrecision() : undefined;
    backend = precision ? 'webgpu' : 'wasm';
  }
  let loadingModel = !transcriber || loadedModel !== requestedModel;
  let recognizedText = false;
  try {
    const model = getWhisperModel(requestedModel);
    if (transcriber && loadedModel !== model.id) { await transcriber.dispose(); transcriber = undefined; loadedModel = undefined; }
    if (!transcriber) {
      const loaded = await pipeline('automatic-speech-recognition', model.repo, {
        device: backend,
        // q8 integer matmuls do not run on WebGPU. Keep the encoder floating-point
        // and use GPU-supported 4-bit decoder matmuls, with f16 only when supported.
        dtype: backend === 'webgpu' ? { encoder_model: precision!, decoder_model_merged: precision === 'fp16' ? 'q4f16' : 'q4' } : 'q8',
        revision: model.revision,
        // Avoid retaining large intermediate allocations for the desktop-sized model.
        ...((backend === 'wasm' && (model.id === 'medium' || model.id === 'turbo')) ? { session_options: { enableCpuMemArena: false, enableMemPattern: false } } : {}),
        progress_callback: (progress) => {
          if (progress.status === 'progress') self.postMessage({ type: 'progress', message: `Downloading ${model.name}: ${Math.round(progress.progress)}% (${progress.file})` });
          else if (progress.status === 'initiate') self.postMessage({ type: 'progress', message: `Loading ${model.name}…` });
        },
      });
      transcriber = loaded; loadedModel = model.id;
    }
    self.postMessage({ type: 'backend', message: backend === 'webgpu' ? 'Transcribing with GPU acceleration' : gpuFailed ? 'CPU processing · GPU unavailable for this model; resumed automatically' : event.data.acceleration === 'cpu' ? 'CPU processing · selected compatibility mode' : 'CPU processing · hardware WebGPU unavailable' });
    loadingModel = false;
    // Turbo is multilingual; keep the existing English-transcription workflow explicit.
    const languageOptions = model.id === 'turbo' ? { language: 'en', task: 'transcribe' as const } : {};
    const sections = audioSections(event.data.audio);
    const cues: Cue[] = [];
    for (const [index, section] of sections.entries()) {
      const audio = event.data.audio.subarray(section.start, section.end);
      if (!hasAudio(audio)) continue;
      const message = `Transcribing section ${index + 1} of ${sections.length}`;
      self.postMessage({ type: 'progress', message: `${message}…` });
      let partial = '';
      const streamer = new TextStreamer(transcriber.tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: text => { partial += text; self.postMessage({ type: 'progress', message: `${message}… ${partial.slice(-80)}` }); } });
      const result = await transcriber(audio, { ...languageOptions, return_timestamps: true, streamer });
      const output = Array.isArray(result) ? result[0] : result;
      recognizedText ||= Boolean(output.text?.trim());
      let sectionCues = normalizeCues(output.chunks ?? [], audio.length / SAMPLE_RATE);
      if (!sectionCues.length) {
        // Timestamp-token decoding can return empty output even for clear speech.
        // Word alignment decodes text without those tokens, then aligns the words
        // to the audio using the same local model.
        self.postMessage({ type: 'progress', message: `${message}… Retrying with word timing…` });
        const retry = await transcriber(audio, { ...languageOptions, return_timestamps: 'word' });
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
    if (backend === 'webgpu') {
      // Retry this window exactly once. Its partial cues were never committed.
      gpuFailed = true;
      try { await transcriber?.dispose(); } catch { /* The GPU device may already be lost. */ }
      transcriber = undefined; loadedModel = undefined; backend = 'wasm';
      self.postMessage({ type: 'backend', message: 'GPU processing unavailable · retrying this section on CPU' });
      await handle(event);
      return;
    }
    const message = error instanceof Error ? error.message : 'The speech engine could not process this audio. Try a smaller model or reload to release browser memory.';
    self.postMessage({ type: 'error', message: loadingModel ? `The speech model could not load. Check your connection and retry, or choose a smaller model if memory is limited. ${message}` : message });
  } finally {
    if (!event.data.keepAlive && transcriber) { try { await transcriber.dispose(); } finally { transcriber = undefined; loadedModel = undefined; backend = undefined; } }
  }
};

self.onmessage = handle;
