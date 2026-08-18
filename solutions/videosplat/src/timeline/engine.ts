import {
  touchProject,
  type Clip,
  type Track,
  type TrackKind,
  type VideoSplatProject,
} from "../domain/project";

export interface ClipLocation {
  track: Track;
  clip: Clip;
}

export function findClip(
  project: VideoSplatProject,
  clipId: string,
): ClipLocation | undefined {
  for (const track of project.tracks) {
    const clip = track.clips.find((item) => item.id === clipId);
    if (clip) return { track, clip };
  }
}

export function projectDuration(project: VideoSplatProject): number {
  return project.tracks.reduce(
    (projectEnd, track) =>
      Math.max(
        projectEnd,
        ...track.clips.map((clip) => clip.start + clip.duration),
        0,
      ),
    0,
  );
}

export function activeVisualClip(
  project: VideoSplatProject,
  time: number,
): ClipLocation | undefined {
  const visualTracks = project.tracks
    .filter((track) => !track.hidden && track.kind !== "audio")
    .slice()
    .reverse();
  for (const track of visualTracks) {
    const clip = track.clips.find(
      (item) => time >= item.start && time < item.start + item.duration,
    );
    if (clip) return { track, clip };
  }
}

export function updateClip(
  project: VideoSplatProject,
  clipId: string,
  patch: Partial<Clip>,
): VideoSplatProject {
  return touchProject(project, {
    tracks: project.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) =>
        clip.id === clipId ? { ...clip, ...patch } : clip,
      ),
    })),
  });
}

export function moveClip(
  project: VideoSplatProject,
  clipId: string,
  start: number,
): VideoSplatProject {
  return updateClip(project, clipId, { start: Math.max(0, start) });
}

export function snappedClipStart(
  project: VideoSplatProject,
  clipId: string,
  proposedStart: number,
  playhead: number,
  tolerance: number,
): number {
  const location = findClip(project, clipId);
  if (!location) return Math.max(0, proposedStart);
  const duration = location.clip.duration;
  const targets = [
    0,
    playhead,
    ...project.tracks.flatMap((track) =>
      track.clips
        .filter((clip) => clip.id !== clipId)
        .flatMap((clip) => [clip.start, clip.start + clip.duration]),
    ),
  ];
  const candidates = targets
    .flatMap((target) => [
      { distance: Math.abs(proposedStart - target), start: target },
      {
        distance: Math.abs(proposedStart + duration - target),
        start: target - duration,
      },
    ])
    .sort((a, b) => a.distance - b.distance);
  return Math.max(
    0,
    candidates[0] && candidates[0].distance <= tolerance
      ? candidates[0].start
      : proposedStart,
  );
}

export function trimClip(
  project: VideoSplatProject,
  clipId: string,
  start: number,
  duration: number,
): VideoSplatProject {
  const location = findClip(project, clipId);
  if (!location) return project;
  const safeStart = Math.max(0, start);
  const delta = safeStart - location.clip.start;
  return updateClip(project, clipId, {
    start: safeStart,
    sourceStart: Math.max(0, location.clip.sourceStart + delta),
    duration: Math.max(0.1, duration),
  });
}

export function splitClip(
  project: VideoSplatProject,
  clipId: string,
  time: number,
): { project: VideoSplatProject; rightId?: string } {
  const location = findClip(project, clipId);
  if (
    !location ||
    time <= location.clip.start ||
    time >= location.clip.start + location.clip.duration
  )
    return { project };
  const leftDuration = time - location.clip.start;
  const rightId = crypto.randomUUID();
  const right: Clip = {
    ...location.clip,
    id: rightId,
    name: `${location.clip.name} (split)`,
    start: time,
    sourceStart: location.clip.sourceStart + leftDuration,
    duration: location.clip.duration - leftDuration,
  };
  return {
    rightId,
    project: touchProject(project, {
      tracks: project.tracks.map((track) =>
        track.id === location.track.id
          ? {
              ...track,
              clips: track.clips.flatMap((clip) =>
                clip.id === clipId
                  ? [{ ...clip, duration: leftDuration }, right]
                  : [clip],
              ),
            }
          : track,
      ),
    }),
  };
}

export function duplicateClip(
  project: VideoSplatProject,
  clipId: string,
): { project: VideoSplatProject; duplicateId?: string } {
  const location = findClip(project, clipId);
  if (!location) return { project };
  const duplicateId = crypto.randomUUID();
  const duplicate = {
    ...location.clip,
    id: duplicateId,
    name: `${location.clip.name} copy`,
    start: location.clip.start + location.clip.duration,
  };
  return {
    duplicateId,
    project: touchProject(project, {
      tracks: project.tracks.map((track) =>
        track.id === location.track.id
          ? { ...track, clips: [...track.clips, duplicate] }
          : track,
      ),
    }),
  };
}

export function removeClip(
  project: VideoSplatProject,
  clipId: string,
): VideoSplatProject {
  return touchProject(project, {
    tracks: project.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((clip) => clip.id !== clipId),
    })),
  });
}

export function rippleDeleteClip(
  project: VideoSplatProject,
  clipId: string,
): VideoSplatProject {
  const location = findClip(project, clipId);
  if (!location) return project;
  const end = location.clip.start + location.clip.duration;
  return touchProject(project, {
    tracks: project.tracks.map((track) =>
      track.id === location.track.id
        ? {
            ...track,
            clips: track.clips
              .filter((clip) => clip.id !== clipId)
              .map((clip) =>
                clip.start >= end
                  ? {
                      ...clip,
                      start: Math.max(
                        location.clip.start,
                        clip.start - location.clip.duration,
                      ),
                    }
                  : clip,
              ),
          }
        : track,
    ),
  });
}

export type TimelineEditMode = "append" | "insert" | "overwrite";

export function placeClip(
  project: VideoSplatProject,
  trackId: string,
  source: Clip,
  time: number,
  mode: TimelineEditMode,
): { project: VideoSplatProject; clipId?: string } {
  const track = project.tracks.find((item) => item.id === trackId);
  if (!track || track.locked) return { project };
  const start =
    mode === "append"
      ? track.clips.reduce(
          (end, clip) => Math.max(end, clip.start + clip.duration),
          0,
        )
      : Math.max(0, time);
  const clip = { ...source, id: crypto.randomUUID(), start };
  let clips = track.clips;
  if (mode === "insert")
    clips = clips.map((item) =>
      item.start >= start
        ? { ...item, start: item.start + clip.duration }
        : item,
    );
  if (mode === "overwrite")
    clips = clips.filter(
      (item) =>
        item.start + item.duration <= start ||
        item.start >= start + clip.duration,
    );
  return {
    clipId: clip.id,
    project: touchProject(project, {
      tracks: project.tracks.map((item) =>
        item.id === trackId ? { ...item, clips: [...clips, clip] } : item,
      ),
    }),
  };
}

export function updateTrack(
  project: VideoSplatProject,
  trackId: string,
  patch: Partial<Track>,
): VideoSplatProject {
  return touchProject(project, {
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? { ...track, ...patch, id: track.id, clips: track.clips }
        : track,
    ),
  });
}

export function addTrack(
  project: VideoSplatProject,
  kind: Extract<TrackKind, "video" | "audio">,
): VideoSplatProject {
  const count =
    project.tracks.filter((track) => track.kind === kind).length + 1;
  const track: Track = {
    id: crypto.randomUUID(),
    name: `${kind === "video" ? "Video" : "Audio"} ${count}`,
    kind,
    hidden: false,
    locked: false,
    muted: false,
    clips: [],
  };
  return touchProject(project, { tracks: [...project.tracks, track] });
}

export function reorderTrack(
  project: VideoSplatProject,
  trackId: string,
  direction: -1 | 1,
): VideoSplatProject {
  const index = project.tracks.findIndex((track) => track.id === trackId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= project.tracks.length)
    return project;
  const tracks = [...project.tracks];
  [tracks[index], tracks[target]] = [tracks[target], tracks[index]];
  return touchProject(project, { tracks });
}

export function removeEmptyTrack(
  project: VideoSplatProject,
  trackId: string,
): VideoSplatProject {
  const track = project.tracks.find((item) => item.id === trackId);
  if (
    !track ||
    track.clips.length ||
    project.tracks.filter((item) => item.kind === track.kind).length === 1
  )
    return project;
  return touchProject(project, {
    tracks: project.tracks.filter((item) => item.id !== trackId),
  });
}
