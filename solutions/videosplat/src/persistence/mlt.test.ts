import { describe, expect, it } from "vitest";
import { createProject, type Asset, type Clip } from "../domain/project";
import { clipToMlt, parseMlt, projectToMlt } from "./mlt";

const fixture = () => {
  const project = createProject("MLT & Test");
  const asset: Asset = {
    id: "asset",
    name: "local & clip.mp4",
    kind: "video",
    size: 10,
    mimeType: "video/mp4",
    duration: 8,
    storedLocally: true,
  };
  const clip: Clip = {
    id: "clip",
    assetId: asset.id,
    name: "Trimmed <clip>",
    kind: "video",
    start: 2,
    duration: 3,
    sourceStart: 1,
    properties: {},
  };
  project.assets = [asset];
  project.tracks[0].clips = [clip];
  return project;
};

describe("MLT interoperability", () => {
  it("round trips supported project structure and escaped names", () => {
    const xml = projectToMlt(fixture());
    expect(xml).toContain("MLT &amp; Test");
    const result = parseMlt(xml);
    expect(result.project.name).toBe("MLT & Test");
    expect(result.project.tracks[0].clips[0]).toMatchObject({
      start: 2,
      duration: 3,
      sourceStart: 1,
    });
    expect(result.warnings).toEqual([]);
  });
  it("exports a trimmed clip starting at sequence zero", () => {
    const project = fixture();
    const result = parseMlt(clipToMlt(project, project.tracks[0].clips[0]));
    expect(result.project.tracks[0].clips[0].start).toBe(0);
  });
  it("blocks remote resources and reports unsupported services", () => {
    const result = parseMlt(
      '<mlt><profile frame_rate_num="30" frame_rate_den="1"/><producer id="p"><property name="resource">https://example.com/a.mp4</property></producer><playlist id="x"><entry producer="p" in="0" out="29"/></playlist><filter/></mlt>',
    );
    expect(result.project.assets).toHaveLength(0);
    expect(result.warnings).toHaveLength(3);
  });
});
