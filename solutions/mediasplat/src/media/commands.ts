export type ProcessingMode = "fast" | "precise";
export interface TimeRange { start: number; end: number }

export const extensionOf = (name: string) => name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "bin";
export const safeStem = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "media";
export const formatTime = (seconds: number) => {
  const value = Math.max(0, seconds); const hours = Math.floor(value / 3600); const minutes = Math.floor((value % 3600) / 60); const secs = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${secs.toFixed(3).padStart(6, "0")}`;
};
export const validateRange = (range: TimeRange, duration?: number) => {
  if (!Number.isFinite(range.start) || !Number.isFinite(range.end) || range.start < 0 || range.end <= range.start) throw new Error("Each range needs an end time after its non-negative start time.");
  if (duration && range.end > duration + 0.01) throw new Error("A range ends after the source file.");
};
export const equalRanges = (duration: number, count: number): TimeRange[] => {
  if (!(duration > 0) || !Number.isInteger(count) || count < 2 || count > 100) throw new Error("Choose between 2 and 100 parts for media with a known duration.");
  return Array.from({ length: count }, (_, index) => ({ start: (duration * index) / count, end: index === count - 1 ? duration : (duration * (index + 1)) / count }));
};
export const durationRanges = (duration: number, segmentLength: number): TimeRange[] => {
  if (!(duration > 0) || !(segmentLength > 0)) throw new Error("Enter a positive segment duration.");
  const ranges: TimeRange[] = []; for (let start = 0; start < duration; start += segmentLength) ranges.push({ start, end: Math.min(duration, start + segmentLength) });
  if (ranges.length > 100) throw new Error("This operation would create more than 100 files. Choose a longer segment duration."); return ranges;
};
export const sizeRanges = (duration: number, sourceBytes: number, targetBytes: number): TimeRange[] => {
  if (!(duration > 0) || !(sourceBytes > 0) || !(targetBytes > 0)) throw new Error("A known duration and positive target size are required.");
  if (targetBytes >= sourceBytes) return [{ start: 0, end: duration }];
  return durationRanges(duration, duration * targetBytes / sourceBytes);
};
const encodeArgs = (outputExtension: string) => outputExtension === "mp3" ? ["-c:a", "libmp3lame", "-q:a", "2"] : outputExtension === "ogg" || outputExtension === "oga" ? ["-c:a", "libvorbis", "-q:a", "5"] : outputExtension === "wav" ? ["-c:a", "pcm_s16le"] : outputExtension === "webm" ? ["-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus"] : ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart"];
export const trimCommand = (input: string, output: string, range: TimeRange, mode: ProcessingMode) => {
  validateRange(range); const duration = range.end - range.start; const ext = extensionOf(output);
  return mode === "fast"
    ? ["-ss", formatTime(range.start), "-i", input, "-t", formatTime(duration), "-map", "0", "-c", "copy", "-avoid_negative_ts", "make_zero", output]
    : ["-ss", formatTime(range.start), "-i", input, "-t", formatTime(duration), ...encodeArgs(ext), output];
};
export const concatManifest = (inputs: string[]) => inputs.map(name => `file '${name.replace(/'/g, "'\\''")}'`).join("\n");
export const joinCommand = (manifest: string, output: string, mode: ProcessingMode) => mode === "fast"
  ? ["-f", "concat", "-safe", "0", "-i", manifest, "-map", "0", "-c", "copy", output]
  : ["-f", "concat", "-safe", "0", "-i", manifest, ...encodeArgs(extensionOf(output)), output];
export const outputExtension = (file: File, mode: ProcessingMode) => {
  const ext = extensionOf(file.name); if (mode === "fast") return ext;
  return file.type.startsWith("audio/") || ["mp3", "wav", "ogg", "oga", "flac", "m4a", "aac"].includes(ext) ? "mp3" : "mp4";
};
