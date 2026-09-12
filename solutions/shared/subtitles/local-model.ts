import { fingerprintWithNamespace } from './checkpoints';
export const LOCAL_MODEL_HELP = 'Select a Whisper GGML .bin file already on this device (up to 2 GB, separate from the media-file limit). No model or media is uploaded, and no model download is needed. Medium needs substantial memory and can take much longer than the recording; use a smaller or quantized model on limited devices. Reselect the same model after reopening to resume. English transcription only.';
export const LOCAL_ENGINE_VERSION = 'whisper-cpp-2eeeba56-v1-en-greedy-flash';
const fingerprints = new WeakMap<Blob, string>();
export async function validateLocalModel(file: Blob): Promise<void> {
  if (file.size > 2 * 1024 ** 3) throw new Error('This model exceeds the 2 GB local-model limit. Choose a smaller or quantized Whisper GGML model.');
  const bytes = await file.slice(0, 48).arrayBuffer();
  if (bytes.byteLength < 48) throw new Error('This is not a complete Whisper GGML model. Select a valid .bin model file.');
  const header = new DataView(bytes);
  if (header.getUint32(0, true) !== 0x67676d6c) throw new Error('Select a Whisper GGML .bin model. GGUF, ONNX, and renamed files are not compatible with this option.');
  const values = Array.from({ length: 11 }, (_, i) => header.getInt32(4 + i * 4, true));
  const [vocab, audioContext, audioState, audioHeads, audioLayers, textContext, textState, textHeads, textLayers, mels, fileType] = values;
  const sizes = new Map([[384, [6, 4]], [512, [8, 6]], [768, [12, 12]], [1024, [16, 24]], [1280, [20, 32]]]);
  const architecture = sizes.get(audioState);
  if (!architecture || audioHeads !== architecture[0] || audioLayers !== architecture[1] || textState !== audioState || textHeads !== audioHeads || ![audioLayers, 4].includes(textLayers) || audioContext !== 1500 || textContext !== 448 || vocab < 51864 || vocab > 51866 || ![80, 128].includes(mels) || fileType < 0 || fileType > 3000) {
    throw new Error('This file has an unsupported or damaged Whisper model header. Choose a compatible GGML Whisper model.');
  }
}
export async function localModelNamespace(file: Blob, signal: AbortSignal): Promise<string> {
  await validateLocalModel(file); signal.throwIfAborted();
  let hash = fingerprints.get(file);
  if (!hash) { hash = await fingerprintWithNamespace(file, 0, 0, signal, 'ggml-model-bytes-v1'); fingerprints.set(file, hash); }
  signal.throwIfAborted();
  return `${LOCAL_ENGINE_VERSION}:${hash}`;
}
