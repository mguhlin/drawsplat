export interface ChannelAnalysis {
  peak: number;
  rms: number;
  dcOffset: number;
  fullScaleSamples: number;
}

// Read decoded source samples only; never apply gain or write into the buffer.
export function analyzeAudio(buffer: AudioBuffer, startSeconds: number, endSeconds: number) {
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || endSeconds <= startSeconds)
    throw new Error('Invalid analysis range');
  const start = Math.max(0, Math.min(buffer.length, Math.floor(startSeconds * buffer.sampleRate)));
  const end = Math.max(start, Math.min(buffer.length, Math.ceil(endSeconds * buffer.sampleRate)));
  if (end === start) throw new Error('Empty analysis range');
  const channels: ChannelAnalysis[] = [];
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    let peak = 0, sum = 0, squares = 0, fullScaleSamples = 0;
    for (let index = start; index < end; index++) {
      const value = samples[index];
      if (!Number.isFinite(value)) throw new Error('Invalid audio sample');
      peak = Math.max(peak, Math.abs(value));
      sum += value;
      squares += value * value;
      if (Math.abs(value) >= 1) fullScaleSamples++;
    }
    channels.push({ peak, rms: Math.sqrt(squares / (end - start)), dcOffset: sum / (end - start), fullScaleSamples });
  }
  return { duration: (end - start) / buffer.sampleRate, frames: end - start, sampleRate: buffer.sampleRate, channels };
}

export const formatDbfs = (level: number): string => level > 0 ? `${(20 * Math.log10(level)).toFixed(2)} dBFS` : '−∞ dBFS';
