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
