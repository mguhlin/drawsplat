export const PROJECT_VERSION = 2 as const;

export type TrackKind = "video" | "audio" | "image" | "text" | "caption" | "redaction";
export interface Asset { id: string; name: string; kind: "video" | "audio" | "image"; size: number; mimeType: string; duration?: number; width?: number; height?: number; contentHash?: string; thumbnail?: string; waveform?: number[]; storedLocally: boolean }
export interface Clip { id: string; assetId?: string; name: string; kind: TrackKind; start: number; duration: number; sourceStart: number; properties: Record<string, number | string | boolean> }
export interface Track { id: string; name: string; kind: TrackKind; hidden: boolean; locked: boolean; muted: boolean; clips: Clip[] }
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
  if ((project.version as number | undefined) === 1) {
    const legacy = project as unknown as Omit<VideoSplatProject, "version"> & { version: 1 };
    return { ...legacy, version: PROJECT_VERSION, assets: (legacy.assets ?? []).map((asset) => ({ ...asset, storedLocally: false })) } as VideoSplatProject;
  }
  if (project.version !== PROJECT_VERSION) throw new Error(`Unsupported project version: ${String(project.version)}.`);
  if (typeof project.id !== "string" || typeof project.name !== "string" || !Array.isArray(project.tracks) || !Array.isArray(project.assets)) throw new Error("Project file is incomplete.");
  return project as VideoSplatProject;
}

export const touchProject = (project: VideoSplatProject, patch: Partial<VideoSplatProject>): VideoSplatProject => ({ ...project, ...patch, updatedAt: new Date().toISOString() });
