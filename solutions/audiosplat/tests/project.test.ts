import { describe, expect, it } from 'vitest';
import { cloneProject, createProject, projectDuration, uid, validateProject } from '../src/types';

describe('AudioSplat project model', () => {
  it('creates a valid empty project', () => {
    const project = createProject();
    expect(validateProject(project)).toBe(true);
    expect(project.tracks).toHaveLength(1);
    expect(projectDuration(project)).toBe(0);
  });

  it('calculates duration from the furthest clip edge', () => {
    const project = createProject();
    project.tracks[0].clips.push({
      id: uid('clip'), sourceId: uid('source'), name: 'Voice', start: 4.5,
      sourceOffset: 1, duration: 3.25, gain: 1, fadeIn: 0, fadeOut: 0,
    });
    expect(projectDuration(project)).toBe(7.75);
  });

  it('clones without sharing editable structures', () => {
    const project = createProject();
    const copy = cloneProject(project);
    copy.tracks[0].name = 'Changed';
    expect(project.tracks[0].name).toBe('Track 1');
  });

  it('rejects negative and zero-length clips', () => {
    const project = createProject();
    project.tracks[0].clips.push({
      id: 'clip', sourceId: 'source', name: 'Bad', start: -1,
      sourceOffset: 0, duration: 0, gain: 1, fadeIn: 0, fadeOut: 0,
    });
    expect(validateProject(project)).toBe(false);
  });
});
