import { describe, expect, it } from "vitest";
import { createProject, touchProject, validateProject } from "./project";

describe("project document", () => {
  it("creates a valid local-only project", () => {
    const project = createProject("Test");
    expect(validateProject(project)).toEqual(project);
    expect(project.settings.localOnly).toBe(true);
    expect(project.tracks.map((track) => track.kind)).toEqual(["video", "audio"]);
  });
  it("rejects unrelated JSON", () => expect(() => validateProject({ version: 1 })).toThrow("not a VideoSplat"));
  it("migrates version 1 manifests without pretending media is available", () => {
    const project = createProject();
    const legacy = { ...project, version: 1, assets: [{ id: "asset", name: "clip.mp4", kind: "video", size: 10, mimeType: "video/mp4" }] };
    const migrated = validateProject(legacy);
    expect(migrated.version).toBe(2);
    expect(migrated.assets[0].storedLocally).toBe(false);
  });
  it("opens legacy VideoSplat development manifests", () => {
    const legacy = { ...createProject(), schema: "ved-project" };
    expect(validateProject(legacy).schema).toBe("videosplat-project");
  });
  it("updates timestamp with changes", () => {
    const project = createProject();
    const changed = touchProject(project, { name: "Changed" });
    expect(changed.name).toBe("Changed");
    expect(changed.id).toBe(project.id);
  });
});


describe("malformed project recovery", () => {
  it.each([1, 2])("rejects incomplete version %s manifests before opening them", version => {
    expect(() => validateProject({ schema: "videosplat-project", version, id: "broken", name: "Broken", assets: [], tracks: [] })).toThrow("incomplete");
  });
  it.each([
    { canvas: { width: 0, height: 1080, frameRate: 30, background: "#000000" } },
    { tracks: [null] },
    { tracks: [{ ...createProject().tracks[0], clips: [null] }] },
    { tracks: [{ ...createProject().tracks[0], clips: [{ id: "bad", name: "Bad", kind: "video", start: -1, duration: 1, sourceStart: 0, properties: {} }] }] },
    { assets: [null] },
  ])("rejects invalid nested project data: %j", patch => {
    expect(() => validateProject({ ...createProject(), ...patch })).toThrow("incomplete");
  });
});


it("allows the same identifier in separate asset, track, and clip namespaces", () => {
  const project = createProject();
  project.assets = [{ id: "shared", name: "Scene", kind: "image", size: 10, mimeType: "image/png", storedLocally: true }];
  project.tracks[0].id = "shared";
  project.tracks[0].clips = [{ id: "shared", assetId: "shared", name: "Scene", kind: "image", start: 0, duration: 5, sourceStart: 0, properties: {} }];
  expect(validateProject(project)).toEqual(project);
});
