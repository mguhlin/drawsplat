export type LanguageCode = 'en' | 'es' | 'vi' | 'ar' | 'zh' | 'uh';

export interface AudioSourceRecord {
  id: string;
  name: string;
  mimeType: string;
  duration: number;
  channels: number;
  sampleRate: number;
  blob?: Blob;
}

export interface AudioClip {
  id: string;
  sourceId: string;
  name: string;
  start: number;
  sourceOffset: number;
  duration: number;
  gain: number;
  fadeIn: number;
  fadeOut: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  muted: boolean;
  solo: boolean;
  gain: number;
  pan: number;
  clips: AudioClip[];
}

export interface AudioProject {
  app: 'AudioSplat';
  version: 1;
  createdAt: string;
  updatedAt: string;
  metadata: { title: string; sampleRate: number };
  tracks: AudioTrack[];
  view: { zoom: number; scrollTime: number; playhead: number; loop: [number, number] | null };
}

export interface StoredProject {
  project: AudioProject;
  sources: AudioSourceRecord[];
}

export const uid = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

export const createProject = (): AudioProject => {
  const now = new Date().toISOString();
  return {
    app: 'AudioSplat',
    version: 1,
    createdAt: now,
    updatedAt: now,
    metadata: { title: 'Untitled Audio Project', sampleRate: 48000 },
    tracks: [{ id: uid('track'), name: 'Track 1', muted: false, solo: false, gain: 1, pan: 0, clips: [] }],
    view: { zoom: 80, scrollTime: 0, playhead: 0, loop: null },
  };
};

export const projectDuration = (project: AudioProject): number =>
  Math.max(0, ...project.tracks.flatMap((track) => track.clips.map((clip) => clip.start + clip.duration)));

export const cloneProject = (project: AudioProject): AudioProject => structuredClone(project);

export function validateProject(value: unknown): value is AudioProject {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<AudioProject>;
  if (project.app !== 'AudioSplat' || project.version !== 1 || !Array.isArray(project.tracks)) return false;
  return project.tracks.every((track) =>
    typeof track.id === 'string' && typeof track.name === 'string' && Array.isArray(track.clips) &&
    track.clips.every((clip) =>
      typeof clip.id === 'string' && typeof clip.sourceId === 'string' &&
      Number.isFinite(clip.start) && clip.start >= 0 && Number.isFinite(clip.duration) && clip.duration > 0 &&
      Number.isFinite(clip.sourceOffset) && clip.sourceOffset >= 0,
    ),
  );
}
