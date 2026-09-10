export interface Cue { start: number; end: number; text: string }
export const SAMPLE_RATE = 16000;
export const MAX_SECONDS = 30 * 60;
export function hasAudio(samples: Float32Array) {
  let energy = 0;
  for (const sample of samples) energy += sample * sample;
  return samples.length > 0 && Math.sqrt(energy / samples.length) > 0.0001;
}
export function normalizeCues(chunks: { timestamp: [number | null, number | null]; text: string }[], duration: number): Cue[] {
  let previousEnd = 0;
  return chunks.flatMap((chunk, index) => {
    const start = Math.max(previousEnd, chunk.timestamp[0] ?? previousEnd, 0);
    const end = Math.min(duration, chunk.timestamp[1] ?? chunks[index + 1]?.timestamp[0] ?? duration);
    const text = chunk.text.trim();
    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    previousEnd = end;
    return [{ start, end, text }];
  });
}
export function validateCues(cues: Cue[]) {
  if (!cues.length) throw new Error('No captions to use. Generate subtitles first.');
  let previousEnd = 0;
  for (const cue of cues) {
    if (!cue.text.trim() || !Number.isFinite(cue.start) || !Number.isFinite(cue.end) || cue.start < previousEnd || cue.end <= cue.start)
      throw new Error('Each caption needs text and valid start/end times, in order without overlaps.');
    previousEnd = cue.end;
  }
}
export function cuesToSrt(cues: Cue[], offset = 0) {
  validateCues(cues);
  const stamp = (seconds: number) => {
    const ms = Math.round(seconds * 1000);
    return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
  };
  return cues.map((cue, i) => `${i + 1}\n${stamp(cue.start + offset)} --> ${stamp(cue.end + offset)}\n${cue.text.trim()}\n`).join('\n');
}

// Cut near the quietest 100 ms in the last five seconds of each 25-second
// section. Absolute sample ranges avoid overlap/deduplication dropping repeated
// phrases when a recording contains the same words more than once.
export function audioSections(audio: Float32Array): { start: number; end: number }[] {
  const sections: { start: number; end: number }[] = [];
  const maximum = 25 * SAMPLE_RATE, window = Math.round(.1 * SAMPLE_RATE);
  for (let start = 0; start < audio.length;) {
    let end = Math.min(audio.length, start + maximum);
    if (end < audio.length) {
      let quietest = Infinity;
      const bound = end;
      for (let from = start + 20 * SAMPLE_RATE; from + window <= bound; from += window) {
        let energy = 0;
        for (let i = from; i < from + window; i++) energy += audio[i] * audio[i];
        if (energy < quietest) { quietest = energy; end = from + Math.floor(window / 2); }
      }
    }
    sections.push({ start, end }); start = end;
  }
  return sections;
}
