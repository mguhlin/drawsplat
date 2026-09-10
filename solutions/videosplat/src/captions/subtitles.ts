export interface SubtitleOptions { fontSize: number; margin: number; outline: number; background: boolean; offset: number }
export const defaultSubtitles: SubtitleOptions = { fontSize: 42, margin: 54, outline: 2, background: false, offset: 0 };
export interface Cue { start: number; end: number; text: string }
export function validateSubtitleOptions(options: SubtitleOptions) {
  for (const [key, min, max] of [["fontSize", 12, 120], ["margin", 0, 300], ["outline", 0, 10], ["offset", -86400, 86400]] as const) {
    if (!Number.isFinite(options[key]) || options[key] < min || options[key] > max) throw new Error(`Subtitle ${key} must be between ${min} and ${max}.`);
  }
}
export function parseSubtitleFile(source: string, offset = 0): Cue[] {
  if (!Number.isFinite(offset)) throw new Error("Enter a valid subtitle timing offset.");
  const time = (value: string) => {
    const match = value.trim().match(/^(?:(\d+):)?([0-5]\d):([0-5]\d)[,.](\d{3})$/);
    if (!match) throw new Error(`Invalid subtitle timestamp: ${value}`);
    return Number(match[1] ?? 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
  };
  const cues = source.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/\n\s*\n/).flatMap(block => {
    const lines = block.trim().split("\n");
    const index = lines.findIndex(line => line.includes("-->"));
    if (index < 0) return [];
    const [from, to] = lines[index].split("-->");
    const start = time(from), end = time(to.trim().split(/\s+/)[0]);
    if (end <= start) throw new Error("Subtitle end time must follow its start time.");
    const text = lines.slice(index + 1).join("\n").replace(/<[^>]*>/g, "").trim();
    return text && end + offset > 0 ? [{ start: Math.max(0, start + offset), end: end + offset, text }] : [];
  });
  if (!cues.length) throw new Error("No valid captions remain. Check the subtitle file and timing offset.");
  return cues;
}
