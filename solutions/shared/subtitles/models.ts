export const WHISPER_MODELS = {
  tiny: {
    id: 'tiny', name: 'Whisper Tiny', repo: 'Xenova/whisper-tiny.en',
    revision: '79fb389fc764e7c395bd330e9531d9d32ada7049', downloadMB: 42,
    label: 'Whisper Tiny — fastest · ~42 MB',
    description: 'Fastest and lightest. Choose this for quick drafts or devices with limited memory.',
    // Keep existing Tiny checkpoints usable: this is the same pinned model and decoding configuration.
    checkpointNamespace: 'whisper-tiny-en-v2',
  },
  small: {
    id: 'small', name: 'Whisper Small', repo: 'Xenova/whisper-small.en',
    revision: 'fa16a75f5d91e83ecb6a2ccb690f14d91ef00ca4', downloadMB: 250,
    label: 'Whisper Small — balanced (default) · ~250 MB',
    description: 'Recommended balance of accuracy and speed. Uses more memory and takes longer than Tiny.',
    checkpointNamespace: 'whisper-small-en-v2:fa16a75f5d91e83ecb6a2ccb690f14d91ef00ca4:q8',
  },
  medium: {
    id: 'medium', name: 'Whisper Medium', repo: 'onnx-community/whisper-medium.en_timestamped',
    revision: '475d02b986111e8e2d28206d82e64bb820f5c6db', downloadMB: 990,
    label: 'Whisper Medium — accuracy option · ~990 MB',
    description: 'Larger accuracy-focused model. Substantially slower and needs more memory; best suited to a capable desktop. Try Small if it cannot load.',
    checkpointNamespace: 'whisper-medium-en-v2:475d02b986111e8e2d28206d82e64bb820f5c6db:q8',
  },
  turbo: {
    id: 'turbo', name: 'Whisper Large v3 Turbo', repo: 'onnx-community/whisper-large-v3-turbo_timestamped',
    revision: 'b3f77bf9a8c4d5ea3415827033d1ffea7955fd9a', downloadMB: 1085,
    label: 'Whisper Large v3 Turbo — advanced · ~1.1 GB',
    description: 'Optional larger model for capable desktops with plenty of memory. Speed and accuracy depend on the recording. Downloads only when you generate with this model.',
    checkpointNamespace: 'whisper-large-v3-turbo-en-v1:b3f77bf9a8c4d5ea3415827033d1ffea7955fd9a:q8',
  },
} as const;
export type WhisperModelId = keyof typeof WHISPER_MODELS;
export type SpeechModelId = WhisperModelId | 'local';
export const DEFAULT_MODEL: WhisperModelId = 'small';
const PREFERENCE_KEY = 'splat.transcription.model';
export function getWhisperModel(id: unknown) {
  if (typeof id !== 'string' || !Object.hasOwn(WHISPER_MODELS, id)) throw new Error('Choose a supported Whisper model: Tiny, Small, Medium, or Large v3 Turbo.');
  return WHISPER_MODELS[id as WhisperModelId];
}
export function preferredModel(): SpeechModelId {
  try { const saved = localStorage.getItem(PREFERENCE_KEY); return saved === 'local' ? 'local' : getWhisperModel(saved).id; }
  catch { return DEFAULT_MODEL; }
}
export function rememberModel(id: SpeechModelId): void {
  if (id !== 'local') getWhisperModel(id);
  try { localStorage.setItem(PREFERENCE_KEY, id); } catch { /* Selection still works without persistent storage. */ }
}
