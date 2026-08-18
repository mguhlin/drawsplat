import { touchProject, type Clip, type Track, type VideoSplatProject } from "../domain/project";

export interface ClipLocation { track: Track; clip: Clip }

export function findClip(project: VideoSplatProject, clipId: string): ClipLocation | undefined {
  for (const track of project.tracks) { const clip = track.clips.find((item) => item.id === clipId); if (clip) return { track, clip }; }
}

export function projectDuration(project: VideoSplatProject): number {
  return project.tracks.reduce((projectEnd, track) => Math.max(projectEnd, ...track.clips.map((clip) => clip.start + clip.duration), 0), 0);
}

export function activeVisualClip(project: VideoSplatProject, time: number): ClipLocation | undefined {
  const visualTracks = project.tracks.filter((track) => !track.hidden && track.kind !== "audio").slice().reverse();
  for (const track of visualTracks) { const clip = track.clips.find((item) => time >= item.start && time < item.start + item.duration); if (clip) return { track, clip }; }
}

export function updateClip(project: VideoSplatProject, clipId: string, patch: Partial<Clip>): VideoSplatProject {
  return touchProject(project, { tracks: project.tracks.map((track) => ({ ...track, clips: track.clips.map((clip) => clip.id === clipId ? { ...clip, ...patch } : clip) })) });
}

export function moveClip(project: VideoSplatProject, clipId: string, start: number): VideoSplatProject {
  return updateClip(project, clipId, { start: Math.max(0, start) });
}

export function trimClip(project: VideoSplatProject, clipId: string, start: number, duration: number): VideoSplatProject {
  const location = findClip(project, clipId); if (!location) return project;
  const safeStart = Math.max(0, start); const delta = safeStart - location.clip.start;
  return updateClip(project, clipId, { start: safeStart, sourceStart: Math.max(0, location.clip.sourceStart + delta), duration: Math.max(.1, duration) });
}

export function splitClip(project: VideoSplatProject, clipId: string, time: number): { project: VideoSplatProject; rightId?: string } {
  const location = findClip(project, clipId); if (!location || time <= location.clip.start || time >= location.clip.start + location.clip.duration) return { project };
  const leftDuration = time - location.clip.start; const rightId = crypto.randomUUID();
  const right: Clip = { ...location.clip, id: rightId, name: `${location.clip.name} (split)`, start: time, sourceStart: location.clip.sourceStart + leftDuration, duration: location.clip.duration - leftDuration };
  return { rightId, project: touchProject(project, { tracks: project.tracks.map((track) => track.id === location.track.id ? { ...track, clips: track.clips.flatMap((clip) => clip.id === clipId ? [{ ...clip, duration: leftDuration }, right] : [clip]) } : track) }) };
}

export function duplicateClip(project: VideoSplatProject, clipId: string): { project: VideoSplatProject; duplicateId?: string } {
  const location = findClip(project, clipId); if (!location) return { project };
  const duplicateId = crypto.randomUUID(); const duplicate = { ...location.clip, id: duplicateId, name: `${location.clip.name} copy`, start: location.clip.start + location.clip.duration };
  return { duplicateId, project: touchProject(project, { tracks: project.tracks.map((track) => track.id === location.track.id ? { ...track, clips: [...track.clips, duplicate] } : track) }) };
}

export function removeClip(project: VideoSplatProject, clipId: string): VideoSplatProject {
  return touchProject(project, { tracks: project.tracks.map((track) => ({ ...track, clips: track.clips.filter((clip) => clip.id !== clipId) })) });
}

export function updateTrack(project: VideoSplatProject, trackId: string, patch: Partial<Track>): VideoSplatProject {
  return touchProject(project, { tracks: project.tracks.map((track) => track.id === trackId ? { ...track, ...patch, id: track.id, clips: track.clips } : track) });
}
