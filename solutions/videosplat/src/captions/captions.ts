import {
  touchProject,
  type Clip,
  type Track,
  type VideoSplatProject,
} from "../domain/project";

const timestamp = (value: string) => {
  const match = value.trim().match(/(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) throw new Error(`Invalid caption timestamp: ${value}`);
  return (
    Number(match[1] ?? 0) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3]) +
    Number(match[4]) / 1000
  );
};
const format = (seconds: number, separator = ",") => {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}${separator}${String(ms % 1000).padStart(3, "0")}`;
};

export function parseCaptions(source: string): Clip[] {
  const normalized = source
    .replace(/^\uFEFF/, "")
    .replace(/^WEBVTT[^\n]*\n+/i, "")
    .replace(/\r/g, "");
  return normalized.split(/\n{2,}/).flatMap((block) => {
    const lines = block.trim().split("\n");
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) return [];
    const [from, toRaw] = lines[timingIndex].split("-->");
    const to = toRaw.trim().split(/\s+/)[0];
    const start = timestamp(from);
    const end = timestamp(to);
    const text = lines
      .slice(timingIndex + 1)
      .join("\n")
      .trim();
    if (!text || end <= start) return [];
    return [
      {
        id: crypto.randomUUID(),
        name: text.split("\n")[0].slice(0, 40) || "Caption",
        kind: "caption" as const,
        start,
        duration: end - start,
        sourceStart: 0,
        properties: {
          text,
          fontSize: 42,
          color: "#ffffff",
          background: "#000000aa",
          x: 0,
          y: 260,
          scale: 1,
          rotation: 0,
          opacity: 1,
        },
      },
    ];
  });
}

export function addCaptionFile(
  project: VideoSplatProject,
  source: string,
  name = "Captions",
) {
  const clips = parseCaptions(source);
  if (!clips.length) throw new Error("No valid captions were found.");
  const existing = project.tracks.find((track) => track.kind === "caption");
  const track: Track = existing
    ? { ...existing, clips: [...existing.clips, ...clips] }
    : {
        id: crypto.randomUUID(),
        name,
        kind: "caption",
        hidden: false,
        locked: false,
        muted: false,
        clips,
      };
  return touchProject(project, {
    tracks: existing
      ? project.tracks.map((item) => (item.id === existing.id ? track : item))
      : [...project.tracks, track],
  });
}

export function captionsToSrt(project: VideoSplatProject) {
  const clips = project.tracks
    .filter((track) => track.kind === "caption")
    .flatMap((track) => track.clips)
    .sort((a, b) => a.start - b.start);
  return clips
    .map(
      (clip, index) =>
        `${index + 1}\n${format(clip.start)} --> ${format(clip.start + clip.duration)}\n${String(clip.properties.text ?? clip.name)}\n`,
    )
    .join("\n");
}
export function captionsToVtt(project: VideoSplatProject) {
  return `WEBVTT\n\n${captionsToSrt(project)
    .replace(/^\d+\n/gm, "")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")}`;
}
export function downloadCaptions(
  project: VideoSplatProject,
  type: "srt" | "vtt",
) {
  const text = type === "srt" ? captionsToSrt(project) : captionsToVtt(project);
  if (!text.trim().replace("WEBVTT", "").trim())
    throw new Error("This project has no captions to export.");
  const blob = new Blob([text], {
    type: type === "srt" ? "application/x-subrip" : "text/vtt",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "-") || "captions"}.${type}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
