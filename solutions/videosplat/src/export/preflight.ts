import { projectDuration } from "../timeline/engine";
import type { VideoSplatProject } from "../domain/project";
import type { ExportOptions } from "./exporter";

export type PreflightSeverity = "error" | "warning" | "info";
export interface PreflightIssue {
  severity: PreflightSeverity;
  code: string;
  message: string;
}
export interface ExportReport {
  format: "videosplat-export-report";
  version: 1;
  createdAt: string;
  project: { id: string; name: string; updatedAt: string };
  settings: ExportOptions;
  duration: number;
  output: { size: number; type: string; sha256: string };
  issues: PreflightIssue[];
  privacy: { mediaUploaded: false; biometricIdentityData: false };
}

export function exportPreflight(
  project: VideoSplatProject,
  urls: Record<string, string>,
  options: ExportOptions,
  availableBytes?: number,
): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const fullDuration = projectDuration(project);
  const duration = Math.max(
    0,
    Math.min(fullDuration, options.rangeEnd ?? fullDuration) -
      Math.max(0, options.rangeStart ?? 0),
  );
  if (!duration)
    issues.push({
      severity: "error",
      code: fullDuration ? "invalid-range" : "empty-timeline",
      message: fullDuration
        ? "Export range end must be after its start."
        : "The timeline has no clips.",
    });
  const usedAssets = new Set(
    project.tracks.flatMap((track) =>
      track.clips.map((clip) => clip.assetId).filter(Boolean),
    ),
  );
  const missing = project.assets.filter(
    (asset) => usedAssets.has(asset.id) && !urls[asset.id],
  );
  if (missing.length)
    issues.push({
      severity: "error",
      code: "missing-media",
      message: `Relink missing media: ${missing.map((asset) => asset.name).join(", ")}.`,
    });
  for (const track of project.tracks)
    for (const clip of track.clips) {
      if (clip.duration <= 0)
        issues.push({
          severity: "error",
          code: "invalid-duration",
          message: `${clip.name} has an invalid duration.`,
        });
      if (clip.start < 0 || clip.sourceStart < 0)
        issues.push({
          severity: "error",
          code: "invalid-time",
          message: `${clip.name} has invalid timing.`,
        });
    }
  if (
    !("MediaRecorder" in window) ||
    !("captureStream" in HTMLCanvasElement.prototype)
  )
    issues.push({
      severity: "error",
      code: "unsupported-export",
      message: "This browser does not support local composition export.",
    });
  if (options.width * options.height > 3840 * 2160)
    issues.push({
      severity: "warning",
      code: "large-frame",
      message: "Export dimensions exceed 4K and may exhaust browser memory.",
    });
  const estimated = Math.ceil(
    (duration *
      (options.videoBitsPerSecond + (options.includeAudio ? 128_000 : 0))) /
      8,
  );
  if (availableBytes !== undefined && estimated > availableBytes * 0.8)
    issues.push({
      severity: "error",
      code: "storage-headroom",
      message:
        "Estimated output exceeds safe available browser storage headroom.",
    });
  if (
    project.tracks.some((track) => track.kind === "redaction" && track.hidden)
  )
    issues.push({
      severity: "warning",
      code: "hidden-redaction",
      message: "One or more redaction tracks are hidden.",
    });
  issues.push({
    severity: "info",
    code: "local-only",
    message:
      "Rendering uses local browser media, Canvas, Web Audio, and MediaRecorder.",
  });
  return issues;
}

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
export async function createExportReport(
  project: VideoSplatProject,
  options: ExportOptions,
  blob: Blob,
  issues: PreflightIssue[],
): Promise<ExportReport> {
  return {
    format: "videosplat-export-report",
    version: 1,
    createdAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      updatedAt: project.updatedAt,
    },
    settings: options,
    duration: Math.max(
      0,
      Math.min(
        projectDuration(project),
        options.rangeEnd ?? projectDuration(project),
      ) - Math.max(0, options.rangeStart ?? 0),
    ),
    output: {
      size: blob.size,
      type: blob.type,
      sha256: hex(
        await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
      ),
    },
    issues,
    privacy: { mediaUploaded: false, biometricIdentityData: false },
  };
}
export function downloadExportReport(report: ExportReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.project.name.replace(/[^a-z0-9-_]+/gi, "-") || "videosplat"}-export-report.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
