import { describe, expect, it } from "vitest";
import { createProject, type Clip } from "../domain/project";
import {
  activeVisualClip,
  activeVisualClips,
  addTrack,
  duplicateClip,
  moveClip,
  placeClip,
  projectDuration,
  removeClip,
  removeEmptyTrack,
  reorderTrack,
  rippleDeleteClip,
  snappedClipStart,
  splitClip,
  trimClip,
  updateTrack,
} from "./engine";

const fixture = () => {
  const project = createProject();
  const clip: Clip = {
    id: "clip",
    assetId: "asset",
    name: "Scene",
    kind: "video",
    start: 2,
    duration: 8,
    sourceStart: 1,
    properties: {},
  };
  project.tracks[0].clips.push(clip);
  return project;
};

describe("timeline engine", () => {
  it("computes duration and active visual clips", () => {
    const project = fixture();
    expect(projectDuration(project)).toBe(10);
    expect(activeVisualClip(project, 5)?.clip.id).toBe("clip");
    expect(activeVisualClip(project, 11)).toBeUndefined();
  });
  it("returns every active visible layer in track order", () => {
    const project = fixture();
    project.tracks.push({
      ...project.tracks[0],
      id: "overlay",
      name: "Overlay",
      clips: [{ ...project.tracks[0].clips[0], id: "overlay-clip" }],
    });
    expect(activeVisualClips(project, 5).map((item) => item.clip.id)).toEqual([
      "clip",
      "overlay-clip",
    ]);
    project.tracks.find((track) => track.id === "overlay")!.hidden = true;
    expect(activeVisualClips(project, 5)).toHaveLength(1);
  });
  it("returns overlapping clips for transition compositing", () => {
    const project = fixture();
    project.tracks[0].clips.push({
      ...project.tracks[0].clips[0],
      id: "overlap",
      start: 4,
    });
    expect(activeVisualClips(project, 5).map((item) => item.clip.id)).toEqual([
      "clip",
      "overlap",
    ]);
  });
  it("moves and clamps clips", () =>
    expect(moveClip(fixture(), "clip", -4).tracks[0].clips[0].start).toBe(0));
  it("trims while preserving the source-time relationship", () => {
    const clip = trimClip(fixture(), "clip", 4, 3).tracks[0].clips[0];
    expect(clip).toMatchObject({ start: 4, duration: 3, sourceStart: 3 });
  });
  it("splits clips at sequence time", () => {
    const result = splitClip(fixture(), "clip", 6);
    expect(result.project.tracks[0].clips).toHaveLength(2);
    expect(result.project.tracks[0].clips[0].duration).toBe(4);
    expect(result.project.tracks[0].clips[1]).toMatchObject({
      start: 6,
      duration: 4,
      sourceStart: 5,
    });
  });
  it("duplicates and removes clips", () => {
    const duplicated = duplicateClip(fixture(), "clip");
    expect(duplicated.project.tracks[0].clips[1].start).toBe(10);
    expect(removeClip(duplicated.project, "clip").tracks[0].clips).toHaveLength(
      1,
    );
  });
  it("updates track controls", () => {
    const project = fixture();
    expect(
      updateTrack(project, project.tracks[0].id, { hidden: true }).tracks[0]
        .hidden,
    ).toBe(true);
  });
  it("snaps clip starts and ends to nearby edit points", () => {
    const project = fixture();
    project.tracks[0].clips.push({
      ...project.tracks[0].clips[0],
      id: "next",
      start: 12,
    });
    expect(snappedClipStart(project, "clip", 3.9, 0, 0.2)).toBe(4);
    expect(snappedClipStart(project, "clip", 1.9, 2, 0.2)).toBe(2);
  });
  it("adds, reorders, and removes empty tracks", () => {
    const project = addTrack(fixture(), "video");
    const added = project.tracks.at(-1)!;
    expect(added.name).toBe("Video 2");
    expect(reorderTrack(project, added.id, -1).tracks.at(-2)?.id).toBe(
      added.id,
    );
    expect(removeEmptyTrack(project, added.id).tracks).toHaveLength(2);
  });
  it("ripple deletes and closes the resulting track gap", () => {
    const project = fixture();
    project.tracks[0].clips.push({
      ...project.tracks[0].clips[0],
      id: "next",
      start: 12,
    });
    expect(rippleDeleteClip(project, "clip").tracks[0].clips[0].start).toBe(4);
  });
  it("places clipboard clips using append, insert, and overwrite modes", () => {
    const project = fixture();
    const source = project.tracks[0].clips[0];
    const appended = placeClip(
      project,
      project.tracks[0].id,
      source,
      0,
      "append",
    );
    expect(appended.project.tracks[0].clips.at(-1)?.start).toBe(10);
    const inserted = placeClip(
      project,
      project.tracks[0].id,
      source,
      2,
      "insert",
    );
    expect(
      inserted.project.tracks[0].clips.find((clip) => clip.id === "clip")
        ?.start,
    ).toBe(10);
    expect(
      placeClip(project, project.tracks[0].id, source, 2, "overwrite").project
        .tracks[0].clips,
    ).toHaveLength(1);
  });
  it("evaluates dense multitrack timelines deterministically", () => {
    const project = createProject("Stress fixture");
    project.tracks = Array.from({ length: 10 }, (_, trackIndex) => ({
      id: `track-${trackIndex}`,
      name: `Layer ${trackIndex + 1}`,
      kind: "video" as const,
      hidden: false,
      locked: false,
      muted: false,
      clips: Array.from({ length: 100 }, (_, clipIndex) => ({
        id: `clip-${trackIndex}-${clipIndex}`,
        assetId: `asset-${trackIndex}`,
        name: `Scene ${clipIndex + 1}`,
        kind: "video" as const,
        start: clipIndex * 0.5,
        duration: 0.5,
        sourceStart: clipIndex * 0.5,
        properties: {},
      })),
    }));
    expect(projectDuration(project)).toBe(50);
    expect(activeVisualClips(project, 25.25)).toHaveLength(10);
    expect(snappedClipStart(project, "clip-0-0", 49.91, 0, 0.1)).toBe(50);
  });
});
