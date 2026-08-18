import { describe, expect, it, vi } from "vitest";
import { createProject, type Asset, type Clip } from "../domain/project";
import { DEFAULT_EXPORT } from "./exporter";
import { createExportReport, exportPreflight } from "./preflight";
const fixture = () => {
  const project = createProject("Report");
  const asset: Asset = {
    id: "a",
    name: "missing.mp4",
    kind: "video",
    size: 1,
    mimeType: "video/mp4",
    duration: 2,
    storedLocally: false,
  };
  const clip: Clip = {
    id: "c",
    assetId: "a",
    name: "Clip",
    kind: "video",
    start: 0,
    duration: 2,
    sourceStart: 0,
    properties: {},
  };
  project.assets = [asset];
  project.tracks[0].clips = [clip];
  return project;
};
describe("export preflight", () => {
  it("reports missing media and local rendering", () => {
    const issues = exportPreflight(fixture(), {}, DEFAULT_EXPORT);
    expect(
      issues.some(
        (issue) => issue.code === "missing-media" && issue.severity === "error",
      ),
    ).toBe(true);
    expect(issues.some((issue) => issue.code === "local-only")).toBe(true);
  });
  it("reports storage and redaction risks", () => {
    const project = fixture();
    project.tracks.push({
      id: "r",
      name: "Redactions",
      kind: "redaction",
      hidden: true,
      locked: false,
      muted: false,
      clips: [],
    });
    const issues = exportPreflight(
      project,
      { a: "blob:a" },
      { ...DEFAULT_EXPORT, videoBitsPerSecond: 100_000_000 },
      100,
    );
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["storage-headroom", "hidden-redaction"]),
    );
  });
  it("creates a content-hashed privacy report", async () => {
    const randomUUID = crypto.randomUUID.bind(crypto);
    vi.stubGlobal("crypto", {
      randomUUID,
      subtle: { digest: vi.fn(async () => new Uint8Array([10, 11]).buffer) },
    });
    const report = await createExportReport(
      fixture(),
      DEFAULT_EXPORT,
      {
        size: 1,
        type: "video/webm",
        arrayBuffer: async () => new Uint8Array([120]).buffer,
      } as Blob,
      [],
    );
    expect(report.output.sha256).toBe("0a0b");
    expect(report.privacy.mediaUploaded).toBe(false);
    vi.unstubAllGlobals();
  });
});
