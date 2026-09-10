import { hasAudio, MAX_SECONDS, SAMPLE_RATE, type Cue } from './core';
export interface Source { name: string; load: () => Promise<Blob>; start?: number; duration?: number }
export async function transcribe(source: Source, signal: AbortSignal, onProgress: (message: string) => void): Promise<Cue[]> {
  signal.throwIfAborted();
  if (source.duration && source.duration > MAX_SECONDS) throw new Error('Generate subtitles for up to 30 minutes at a time. Split this clip into shorter sections first.');
  onProgress('Reading audio locally…');
  const blob = await source.load();
  signal.throwIfAborted();
  if (blob.size > 512 * 1024 * 1024) throw new Error('This file exceeds the 512 MB subtitle generation limit. Use a smaller video.');
  const bytes = await blob.arrayBuffer();
  signal.throwIfAborted();
  // Offline decoding resamples to 16 kHz without playing any audio.
  const context = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  let decoded: AudioBuffer;
  try { decoded = await context.decodeAudioData(bytes); }
  catch { throw new Error('No decodable audio was found. Try a WebM or MP4 with an audible audio track.'); }
  signal.throwIfAborted();
  const start = Math.max(0, Math.round((source.start ?? 0) * SAMPLE_RATE));
  const end = Math.min(decoded.length, source.duration === undefined ? decoded.length : start + Math.round(source.duration * SAMPLE_RATE));
  if (end <= start) throw new Error('This clip has no audio in the selected time range.');
  if ((end - start) / SAMPLE_RATE > MAX_SECONDS) throw new Error('Generate subtitles for up to 30 minutes at a time. Split this video into shorter sections first.');
  const audio = new Float32Array(end - start);
  for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
    const data = decoded.getChannelData(channel);
    for (let i = 0; i < audio.length; i++) audio[i] += data[start + i] / decoded.numberOfChannels;
  }
  if (!hasAudio(audio)) throw new Error('This audio is silent. Subtitles need audible speech; missing audio cannot be recovered.');
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    const finish = (error?: Error, cues?: Cue[]) => { worker.terminate(); signal.removeEventListener('abort', cancel); error ? reject(error) : resolve(cues!); };
    const cancel = () => finish(new DOMException('Subtitle generation cancelled.', 'AbortError'));
    signal.addEventListener('abort', cancel, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') onProgress(data.message);
      else if (data.type === 'complete') finish(undefined, data.cues);
      else if (data.type === 'error') finish(new Error(`Could not generate subtitles: ${data.message} If the model could not download, check your connection and retry.`));
    };
    worker.onerror = () => finish(new Error('The local speech engine could not start. Reload and try again in a current desktop browser.'));
    worker.postMessage({ audio }, [audio.buffer]);
  });
}
