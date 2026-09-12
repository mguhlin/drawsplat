import { DEFAULT_MODEL, getWhisperModel, type SpeechModelId } from './models';
import { localModelNamespace } from './local-model';
import { quietSectionLength, hasAudio, SAMPLE_RATE, type Cue } from './core';
import { openAudio } from './decoder';
import { fingerprint, fingerprintWithNamespace, readCheckpoint, saveCheckpoint, deleteCheckpoint, type Checkpoint } from './checkpoints';
export interface Source { name: string; load: () => Promise<Blob>; start?: number; duration?: number }
export interface TranscriptionProgress { cues: Cue[]; processedSeconds: number; totalSeconds: number; complete: boolean; saved: boolean }
export interface TranscriptionOptions { model?: SpeechModelId; modelFile?: Blob; restart?: boolean; onPartial?: (progress: TranscriptionProgress) => void }
export async function transcribe(source: Source, signal: AbortSignal, onProgress: (message: string) => void, options: TranscriptionOptions = {}): Promise<Cue[]> {
  signal.throwIfAborted();
  const model = options.model ?? DEFAULT_MODEL;
  if (model !== 'local') getWhisperModel(model);
  let namespace: string | undefined;
  if (model === 'local') {
    if (!options.modelFile) throw new Error('Select a local Whisper GGML .bin model file first.');
    onProgress('Checking your local model file…');
    namespace = await localModelNamespace(options.modelFile, signal);
  }
  onProgress('Reading audio locally…');
  const blob = await source.load();
  signal.throwIfAborted();
  if (blob.size > 512 * 1024 * 1024) throw new Error('This file exceeds the 512 MB subtitle generation limit. Use a smaller audio or video file.');
  const reader = await openAudio(blob, signal, source.start, source.duration);
  let worker: Worker | undefined;
  try {
    const totalSamples = Math.round(reader.duration * SAMPLE_RATE);
    onProgress('Checking for saved progress…');
    const key = namespace ? await fingerprintWithNamespace(blob, source.start ?? 0, totalSamples / SAMPLE_RATE, signal, namespace) : await fingerprint(blob, source.start ?? 0, totalSamples / SAMPLE_RATE, signal, model as Exclude<SpeechModelId, 'local'>);
    signal.throwIfAborted();
    const run = async (): Promise<Cue[]> => {
      let saved = true;
      let checkpoint: Checkpoint | undefined;
      try {
        if (options.restart) await deleteCheckpoint(key);
        else checkpoint = await readCheckpoint(key, totalSamples);
      } catch { saved = false; }
      let nextSample = checkpoint?.nextSample ?? 0;
      const cues = checkpoint?.cues ?? [];
      const report = (complete: boolean) => {
        if (!signal.aborted) options.onPartial?.({ cues: cues.map(cue => ({ ...cue })), processedSeconds: nextSample / SAMPLE_RATE, totalSeconds: totalSamples / SAMPLE_RATE, complete, saved });
      };
      report(Boolean(checkpoint?.complete));
      if (checkpoint?.complete) { onProgress('Restored saved transcript. Choose Start over to regenerate it.'); return cues; }
      if (nextSample) onProgress(`Resuming after ${(nextSample / SAMPLE_RATE / 60).toFixed(1)} minutes…`);
      const recognize = (audio: Float32Array): Promise<Cue[]> => new Promise((resolve, reject) => {
        signal.throwIfAborted();
        const firstWindow = !worker;
        worker ??= model === 'local'
          ? new Worker(new URL('./ggml-worker.ts', import.meta.url), { type: 'module' })
          : new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
        const finish = (error?: Error, result?: Cue[]) => {
          signal.removeEventListener('abort', abort);
          if (worker) { worker.onmessage = null; worker.onerror = null; }
          error ? reject(error) : resolve(result!);
        };
        const abort = () => { worker?.terminate(); finish(new DOMException('Subtitle generation cancelled.', 'AbortError')); };
        signal.addEventListener('abort', abort, { once: true });
        worker.onmessage = ({ data }) => {
          if (data.type === 'progress') onProgress(data.message);
          else if (data.type === 'complete') finish(undefined, data.cues);
          else if (data.type === 'error') finish(new Error(`Could not generate subtitles: ${data.message}`));
        };
        worker.onerror = () => finish(new Error('The local speech engine could not start. Reload and try again in a current desktop browser.'));
        worker.postMessage({ audio, model, ...(model === 'local' && firstWindow ? { modelFile: options.modelFile } : {}), allowEmpty: true, keepAlive: true }, [audio.buffer]);
      });
      while (nextSample < totalSamples) {
        signal.throwIfAborted();
        const start = nextSample;
        const end = Math.min(totalSamples, start + 25 * SAMPLE_RATE);
        onProgress(`Processing ${(start / SAMPLE_RATE / 60).toFixed(1)} of ${(totalSamples / SAMPLE_RATE / 60).toFixed(1)} minutes…`);
        let audio = await reader.read(start / SAMPLE_RATE, end / SAMPLE_RATE);
        // Keep the existing quiet-boundary splitting. Resume uses the exact saved
        // sample boundary, so later captions never restart their clock at zero.
        const length = end === totalSamples ? audio.length : quietSectionLength(audio);
        audio = audio.slice(0, length);
        if (hasAudio(audio)) {
          const result = await recognize(audio);
          signal.throwIfAborted();
          cues.push(...result.map(cue => ({ ...cue, start: Math.round((cue.start + start / SAMPLE_RATE) * 1000) / 1000, end: Math.min(totalSamples / SAMPLE_RATE, Math.round((cue.end + start / SAMPLE_RATE) * 1000) / 1000) })));
        }
        nextSample = Math.min(totalSamples, start + length);
        if (saved) {
          try { await saveCheckpoint({ key, cues, nextSample, totalSamples, complete: nextSample === totalSamples && cues.length > 0, updatedAt: Date.now() }); }
          catch { saved = false; }
        }
        report(nextSample === totalSamples && cues.length > 0);
      }
      if (!cues.length) throw new Error('This audio is silent or no English speech was recognized. Check the recording and try again.');
      return cues;
    };
    // A single file/range must not have two tabs overwriting each other's progress.
    if (navigator.locks) return await navigator.locks.request(`splat-transcription:${key}`, { ifAvailable: true }, lock => {
      if (!lock) throw new Error('This recording is already being transcribed in another tab. Pause it there before resuming here.');
      return run();
    });
    return await run();
  } finally { worker?.terminate(); reader.close(); }
}
