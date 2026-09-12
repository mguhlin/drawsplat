import { MAX_SECONDS, SAMPLE_RATE } from './core';
export interface AudioReader { duration: number; read: (start: number, end: number) => Promise<Float32Array>; close: () => void }
const limitError = () => new Error('Transcribe up to 120 minutes (2 hours) at a time. Split this clip into shorter sections first.');
export async function openAudio(blob: Blob, signal: AbortSignal, sourceStart = 0, sourceDuration?: number): Promise<AudioReader> {
  if (!Number.isFinite(sourceStart) || sourceStart < 0 || (sourceDuration !== undefined && (!Number.isFinite(sourceDuration) || sourceDuration <= 0))) throw new Error('Choose a valid audio time range.');
  if (sourceDuration !== undefined && sourceDuration > MAX_SECONDS) throw limitError();
  const { Input, ALL_FORMATS, BlobSource, AudioBufferSink } = await import('mediabunny');
  signal.throwIfAborted();
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(blob, { maxCacheSize: 8 * 1024 * 1024 }) });
  const stop = () => input.dispose();
  signal.addEventListener('abort', stop, { once: true });
  try {
    const track = await input.getPrimaryAudioTrack();
    signal.throwIfAborted();
    if (!track || !await track.canDecode()) throw new Error('Streaming audio decoding is unavailable.');
    const end = await track.computeDuration();
    const duration = Math.min(sourceDuration ?? end - sourceStart, end - sourceStart);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('This clip has no audio in the selected time range.');
    if (duration > MAX_SECONDS) throw limitError();
    const sink = new AudioBufferSink(track);
    return {
      duration,
      async read(start, end) {
        signal.throwIfAborted();
        // Only this short range is decoded. Web Audio supplies proper anti-aliasing
        // and mono mixing while resampling to the speech engine's 16 kHz rate.
        const context = new OfflineAudioContext(1, Math.max(1, Math.round((end - start) * SAMPLE_RATE)), SAMPLE_RATE);
        const from = sourceStart + start, to = sourceStart + end;
        const nodes: AudioBufferSourceNode[] = [];
        try {
          for await (const { buffer, timestamp } of sink.buffers(from, to)) {
            signal.throwIfAborted();
            const begin = Math.max(from, timestamp), finish = Math.min(to, timestamp + buffer.duration);
            if (finish <= begin) continue;
            const node = context.createBufferSource(); node.buffer = buffer; nodes.push(node); node.connect(context.destination);
            node.start(begin - from, begin - timestamp, finish - begin);
          }
          signal.throwIfAborted();
          const rendered = await context.startRendering();
          signal.throwIfAborted();
          return rendered.getChannelData(0);
        } finally { for (const node of nodes) { node.disconnect(); node.buffer = null; } }
      },
      close() { signal.removeEventListener('abort', stop); input.dispose(); },
    };
  } catch (error) {
    signal.removeEventListener('abort', stop); input.dispose(); signal.throwIfAborted();
    if (error instanceof Error && /120 minutes|valid audio|no audio in/.test(error.message)) throw error;
    // Preserve older browser/codec support for short files only. Never silently
    // decode a multi-hour file into one giant AudioBuffer as a fallback.
    if (blob.size > 64 * 1024 * 1024 || (sourceDuration !== undefined && sourceDuration > 30 * 60)) throw new Error('This browser cannot stream-decode this format. For long files, use a current desktop browser with MP3, M4A, OGG, or WAV support.');
    const url = URL.createObjectURL(blob);
    const media = document.createElement('audio');
    try {
      const fullDuration = await new Promise<number>((resolve, reject) => {
        const finish = (error?: Error) => { clearTimeout(timer); signal.removeEventListener('abort', abort); error ? reject(error) : resolve(media.duration); };
        const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
        const timer = setTimeout(() => finish(new Error('Could not read audio duration.')), 10000);
        signal.addEventListener('abort', abort, { once: true });
        media.onloadedmetadata = () => finish(); media.onerror = () => finish(new Error('No decodable audio was found. Choose a browser-playable audio or video file.'));
        media.preload = 'metadata'; media.src = url;
      });
      signal.throwIfAborted();
      if (!Number.isFinite(fullDuration) || fullDuration > 30 * 60) throw new Error('This format needs full-file decoding in this browser. Use a stream-decodable format for recordings longer than 30 minutes.');
      let decoded: AudioBuffer | undefined = await new OfflineAudioContext(1, 1, SAMPLE_RATE).decodeAudioData(await blob.arrayBuffer());
      const duration = Math.min(sourceDuration ?? decoded.duration - sourceStart, decoded.duration - sourceStart);
      if (duration <= 0) throw new Error('This clip has no audio in the selected time range.');
      return { duration, async read(start, end) {
        signal.throwIfAborted();
        const from = Math.round((sourceStart + start) * SAMPLE_RATE);
        const samples = new Float32Array(Math.round((end - start) * SAMPLE_RATE));
        for (let channel = 0; channel < decoded!.numberOfChannels; channel++) {
          const data = decoded!.getChannelData(channel);
          for (let i = 0; i < samples.length; i++) samples[i] += (data[from + i] ?? 0) / decoded!.numberOfChannels;
        }
        return samples;
      }, close() { decoded = undefined; } };
    } finally { media.removeAttribute('src'); media.load(); URL.revokeObjectURL(url); }
  }
}
