import { cuesToSrt, type Cue } from '@splat/local-subtitles/core';
import { parseCaptions } from './captions';
import { defaultSubtitles } from './subtitles';
import { touchProject, type VideoSplatProject } from '../domain/project';
export function addGeneratedCaptions(project: VideoSplatProject, clipId: string, cues: Cue[]) {
  const clip = project.tracks.flatMap(track => track.clips).find(clip => clip.id === clipId);
  if (!clip) throw new Error('The source clip is no longer on the timeline. Select a clip and try again.');
  if (cues.some(cue => cue.end > clip.duration + .05)) throw new Error('A caption extends beyond this clip. Adjust its end time before adding it.');
  const clips = parseCaptions(cuesToSrt(cues), { ...defaultSubtitles, offset: clip.start });
  return touchProject(project, { tracks: [...project.tracks, { id: crypto.randomUUID(), name: `Subtitles: ${clip.name}`, kind: 'caption', hidden: false, locked: false, muted: false, clips }] });
}
