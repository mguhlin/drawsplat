import {
  createProject,
  touchProject,
  type Asset,
  type Clip,
  type Track,
  type VideoSplatProject,
} from "../domain/project";

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
const safeName = (value: string) =>
  value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "project";
const frames = (seconds: number, fps: number) =>
  Math.max(0, Math.round(seconds * fps));

export interface MltImportResult {
  project: VideoSplatProject;
  warnings: string[];
}

export function projectToMlt(project: VideoSplatProject): string {
  const fps = project.canvas.frameRate;
  const producers = project.assets
    .map(
      (asset) =>
        `<producer id="producer-${escapeXml(asset.id)}"><property name="resource">${escapeXml(asset.name)}</property><property name="videosplat:asset-id">${escapeXml(asset.id)}</property><property name="videosplat:kind">${asset.kind}</property><property name="length">${frames(asset.duration ?? 0, fps)}</property></producer>`,
    )
    .join("");
  const playlists = project.tracks
    .map((track) => {
      let cursor = 0;
      const entries = [...track.clips]
        .sort((a, b) => a.start - b.start)
        .map((clip) => {
          const gap = Math.max(0, frames(clip.start, fps) - cursor);
          const out = frames(clip.sourceStart + clip.duration, fps) - 1;
          const entry = `${gap ? `<blank length="${gap}"/>` : ""}<entry producer="producer-${escapeXml(clip.assetId ?? "")}" in="${frames(clip.sourceStart, fps)}" out="${Math.max(0, out)}"><property name="videosplat:clip-id">${escapeXml(clip.id)}</property><property name="videosplat:name">${escapeXml(clip.name)}</property></entry>`;
          cursor = frames(clip.start + clip.duration, fps);
          return entry;
        })
        .join("");
      return `<playlist id="playlist-${escapeXml(track.id)}"><property name="videosplat:name">${escapeXml(track.name)}</property><property name="videosplat:kind">${track.kind}</property>${entries}</playlist>`;
    })
    .join("");
  const multitracks = project.tracks
    .map((track) => `<track producer="playlist-${escapeXml(track.id)}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="utf-8"?><mlt LC_NUMERIC="C" version="7.0.0" title="${escapeXml(project.name)}"><profile width="${project.canvas.width}" height="${project.canvas.height}" frame_rate_num="${fps}" frame_rate_den="1"/>${producers}${playlists}<tractor id="tractor0"><multitrack>${multitracks}</multitrack></tractor></mlt>`;
}

export function clipToMlt(project: VideoSplatProject, clip: Clip): string {
  const location = project.tracks.find((track) =>
    track.clips.some((item) => item.id === clip.id),
  );
  const isolated = touchProject(project, {
    name: `${clip.name} trimmed`,
    tracks: location ? [{ ...location, clips: [{ ...clip, start: 0 }] }] : [],
  });
  return projectToMlt(isolated);
}

export function downloadMlt(project: VideoSplatProject, clip?: Clip) {
  const xml = clip ? clipToMlt(project, clip) : projectToMlt(project);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName(clip?.name ?? project.name)}.mlt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const property = (element: Element, name: string) =>
  Array.from(element.querySelectorAll(":scope > property")).find(
    (item) => item.getAttribute("name") === name,
  )?.textContent ?? "";

export function parseMlt(xml: string): MltImportResult {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (
    document.querySelector("parsererror") ||
    document.documentElement.tagName !== "mlt"
  )
    throw new Error("This is not a valid MLT XML project.");
  const profile = document.querySelector("profile");
  const fps = Math.max(
    1,
    Number(profile?.getAttribute("frame_rate_num") || 30) /
      Math.max(1, Number(profile?.getAttribute("frame_rate_den") || 1)),
  );
  const base = createProject(
    document.documentElement.getAttribute("title") || "Imported MLT project",
  );
  const warnings: string[] = [];
  const assets: Asset[] = [];
  const producers = new Map<string, Asset>();
  document.querySelectorAll("producer").forEach((producer) => {
    const resource = property(producer, "resource");
    if (/^(https?:|data:|javascript:)/i.test(resource)) {
      warnings.push(`Remote resource blocked: ${resource}`);
      return;
    }
    const kind = (property(producer, "videosplat:kind") ||
      (/\.(mp3|wav|m4a|ogg)$/i.test(resource)
        ? "audio"
        : /\.(png|jpe?g|gif|webp|svg)$/i.test(resource)
          ? "image"
          : "video")) as Asset["kind"];
    const asset: Asset = {
      id: property(producer, "videosplat:asset-id") || crypto.randomUUID(),
      name: resource.split(/[\\/]/).pop() || "Missing media",
      kind,
      size: 0,
      mimeType: "",
      duration: Number(property(producer, "length") || 0) / fps,
      storedLocally: false,
    };
    assets.push(asset);
    producers.set(producer.id, asset);
  });
  const tracks: Track[] = Array.from(document.querySelectorAll("playlist")).map(
    (playlist, index) => {
      let cursor = 0;
      const clips: Clip[] = [];
      Array.from(playlist.children).forEach((child) => {
        if (child.tagName === "blank") {
          cursor += Number(child.getAttribute("length") || 0) / fps;
          return;
        }
        if (child.tagName !== "entry") return;
        const asset = producers.get(child.getAttribute("producer") || "");
        if (!asset) {
          warnings.push(
            `Unsupported or missing producer: ${child.getAttribute("producer") || "unknown"}`,
          );
          return;
        }
        const sourceStart = Number(child.getAttribute("in") || 0) / fps;
        const duration =
          (Number(child.getAttribute("out") || 0) -
            Number(child.getAttribute("in") || 0) +
            1) /
          fps;
        clips.push({
          id: property(child, "videosplat:clip-id") || crypto.randomUUID(),
          assetId: asset.id,
          name: property(child, "videosplat:name") || asset.name,
          kind: asset.kind,
          start: cursor,
          duration: Math.max(1 / fps, duration),
          sourceStart,
          properties: {},
        });
        cursor += duration;
      });
      const kind = (property(playlist, "videosplat:kind") ||
        clips[0]?.kind ||
        "video") as Track["kind"];
      return {
        id: crypto.randomUUID(),
        name: property(playlist, "videosplat:name") || `MLT Track ${index + 1}`,
        kind,
        hidden: false,
        locked: false,
        muted: false,
        clips,
      };
    },
  );
  if (document.querySelector("filter, transition"))
    warnings.push(
      "Some MLT filters or transitions are preserved only in the original file and are not rendered yet.",
    );
  return {
    warnings,
    project: touchProject(base, {
      canvas: {
        ...base.canvas,
        width: Number(profile?.getAttribute("width") || 1920),
        height: Number(profile?.getAttribute("height") || 1080),
        frameRate: fps,
      },
      assets,
      tracks: tracks.length ? tracks : base.tracks,
    }),
  };
}

export async function readMlt(file: File) {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("MLT project is unexpectedly large.");
  return parseMlt(await file.text());
}
