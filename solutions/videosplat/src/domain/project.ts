export const PROJECT_VERSION = 2 as const;

export type TrackKind = "video" | "audio" | "image" | "text" | "caption" | "redaction";
export interface Asset { id: string; name: string; kind: "video" | "audio" | "image"; size: number; mimeType: string; duration?: number; width?: number; height?: number; contentHash?: string; thumbnail?: string; waveform?: number[]; storedLocally: boolean }
export interface Clip { id: string; assetId?: string; name: string; kind: TrackKind; start: number; duration: number; sourceStart: number; properties: Record<string, number | string | boolean> }
export interface Track { id: string; name: string; kind: TrackKind; hidden: boolean; locked: boolean; muted: boolean; clips: Clip[] }
export interface TimelineMarker { id: string; name: string; time: number; color: string }
export interface VideoSplatProject {
  schema: "videosplat-project";
  version: typeof PROJECT_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvas: { width: number; height: number; frameRate: number; background: string };
  assets: Asset[];
  tracks: Track[];
  markers?: TimelineMarker[];
  settings: { proxyMode: "auto" | "always" | "never"; localOnly: true };
}

const id = () => crypto.randomUUID();
export const createProject = (name = "Untitled project"): VideoSplatProject => {
  const now = new Date().toISOString();
  return { schema: "videosplat-project", version: PROJECT_VERSION, id: id(), name, createdAt: now, updatedAt: now, canvas: { width: 1920, height: 1080, frameRate: 30, background: "#000000" }, assets: [], tracks: [{ id: id(), name: "Video 1", kind: "video", hidden: false, locked: false, muted: false, clips: [] }, { id: id(), name: "Audio 1", kind: "audio", hidden: false, locked: false, muted: false, clips: [] }], settings: { proxyMode: "auto", localOnly: true } };
};

export function validateProject(value: unknown): VideoSplatProject {
  if (!value || typeof value !== "object") throw new Error("Project file is not an object.");
  const candidate = value as Partial<VideoSplatProject> & { schema?: string };
  if (candidate.schema !== "videosplat-project" && candidate.schema !== "ved-project") throw new Error("This is not a VideoSplat project file.");
  const project = { ...candidate, schema: "videosplat-project" } as Partial<VideoSplatProject>;
  const legacy = (project.version as number | undefined) === 1;
  if (!legacy && project.version !== PROJECT_VERSION) throw new Error(`Unsupported project version: ${String(project.version)}.`);
  const record = (item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item);
  const number = (item: unknown, minimum: number): item is number => typeof item === "number" && Number.isFinite(item) && item >= minimum;
  const kinds = ["video", "audio", "image", "text", "caption", "redaction"];
  const ids = new Set<string>();
  const uniqueId = (item: unknown, namespace: string) => {
    if (typeof item !== "string" || !item || ids.has(`${namespace}:${item}`)) return false;
    ids.add(`${namespace}:${item}`);
    return true;
  };
  if (
    typeof project.id !== "string" || !project.id || typeof project.name !== "string" ||
    !record(project.canvas) || !number(project.canvas.width, 1) || !number(project.canvas.height, 1) ||
    !number(project.canvas.frameRate, Number.MIN_VALUE) || typeof project.canvas.background !== "string" ||
    !record(project.settings) || project.settings.localOnly !== true ||
    !["auto", "always", "never"].includes(project.settings.proxyMode) ||
    !Array.isArray(project.assets) || !project.assets.every(asset =>
      record(asset) && uniqueId(asset.id, "asset") && typeof asset.name === "string" &&
      ["video", "audio", "image"].includes(asset.kind) && number(asset.size, 0) &&
      typeof asset.mimeType === "string" && (legacy || typeof asset.storedLocally === "boolean") &&
      (asset.duration === undefined || number(asset.duration, 0)) &&
      (asset.waveform === undefined || (Array.isArray(asset.waveform) && asset.waveform.every(value => number(value, 0))))
    ) ||
    (project.markers !== undefined && (!Array.isArray(project.markers) || !project.markers.every(marker =>
      record(marker) && uniqueId(marker.id, "marker") && typeof marker.name === "string" &&
      marker.name.trim().length > 0 && marker.name.length <= 120 && number(marker.time, 0) &&
      typeof marker.color === "string" && /^#[0-9a-f]{6}$/i.test(marker.color)
    ))) ||
    !Array.isArray(project.tracks) || !project.tracks.every(track =>
      record(track) && uniqueId(track.id, "track") && typeof track.name === "string" && kinds.includes(track.kind) &&
      typeof track.hidden === "boolean" && typeof track.locked === "boolean" && typeof track.muted === "boolean" &&
      Array.isArray(track.clips) && track.clips.every(clip =>
        record(clip) && uniqueId(clip.id, "clip") && typeof clip.name === "string" && kinds.includes(clip.kind) &&
        (clip.assetId === undefined || typeof clip.assetId === "string") &&
        number(clip.start, 0) && number(clip.duration, Number.MIN_VALUE) && number(clip.sourceStart, 0) &&
        record(clip.properties) && Object.values(clip.properties).every(value =>
          typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value)))
      )
    )
  ) throw new Error("Project file is incomplete or contains invalid canvas, media, or timeline data.");
  if (legacy) return { ...project, version: PROJECT_VERSION, assets: project.assets.map(asset => ({ ...asset, storedLocally: false })) } as VideoSplatProject;
  return project as VideoSplatProject;
}

export const touchProject = (project: VideoSplatProject, patch: Partial<VideoSplatProject>): VideoSplatProject => ({ ...project, ...patch, updatedAt: new Date().toISOString() });
