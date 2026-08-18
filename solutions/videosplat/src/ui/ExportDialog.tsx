import { useRef, useState } from "react";
import type { VideoSplatProject } from "../domain/project";
import {
  DEFAULT_EXPORT,
  exportProject,
  type ExportOptions,
} from "../export/exporter";

const bytes = (value: number) =>
  value < 1024 * 1024
    ? `${Math.round(value / 1024)} KB`
    : `${(value / 1024 / 1024).toFixed(1)} MB`;
export function ExportDialog({
  project,
  urls,
  onClose,
  onStatus,
}: {
  project: VideoSplatProject;
  urls: Record<string, string>;
  onClose: () => void;
  onStatus: (message: string) => void;
}) {
  const [options, setOptions] = useState<ExportOptions>({
    ...DEFAULT_EXPORT,
    width: Math.min(1920, project.canvas.width),
    height: Math.min(1080, project.canvas.height),
    frameRate: project.canvas.frameRate,
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob>();
  const controller = useRef<AbortController | undefined>(undefined);
  const run = async () => {
    setBusy(true);
    setResult(undefined);
    setProgress(0);
    controller.current = new AbortController();
    try {
      const blob = await exportProject(
        project,
        urls,
        options,
        setProgress,
        controller.current.signal,
      );
      setResult(blob);
      onStatus(`Local export ready · ${bytes(blob.size)}`);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Export failed");
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "-") || "videosplat-export"}.webm`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <>
      <button className="dialog-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2 id="export-title">Export video locally</h2>
      <p className="lead">
        Render the complete timeline in this browser. Media is not uploaded.
        Export runs in real time while this dialog stays open.
      </p>
      <div className="optimizer-grid">
        <label>
          Width
          <input
            aria-label="Export width"
            type="number"
            min="160"
            value={options.width}
            onChange={(event) =>
              setOptions({ ...options, width: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Height
          <input
            aria-label="Export height"
            type="number"
            min="90"
            value={options.height}
            onChange={(event) =>
              setOptions({ ...options, height: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Frame rate
          <input
            aria-label="Export frame rate"
            type="number"
            min="1"
            max="60"
            value={options.frameRate}
            onChange={(event) =>
              setOptions({ ...options, frameRate: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Video Mbps
          <input
            aria-label="Export bitrate"
            type="number"
            min=".2"
            step=".5"
            value={options.videoBitsPerSecond / 1e6}
            onChange={(event) =>
              setOptions({
                ...options,
                videoBitsPerSecond: Number(event.target.value) * 1e6,
              })
            }
          />
        </label>
      </div>
      <label>
        <input
          type="checkbox"
          checked={options.includeAudio}
          onChange={(event) =>
            setOptions({ ...options, includeAudio: event.target.checked })
          }
        />{" "}
        Include timeline audio
      </label>
      {busy && (
        <>
          <progress max="1" value={progress} />
          <p>{Math.round(progress * 100)}% rendered</p>
          <button
            className="danger wide"
            onClick={() => controller.current?.abort()}
          >
            Cancel export
          </button>
        </>
      )}
      {!busy && !result && (
        <button className="primary wide" onClick={run}>
          Render local WebM
        </button>
      )}
      {result && (
        <div className="optimizer-results">
          <strong>Export ready · {bytes(result.size)}</strong>
          <button className="primary" onClick={download}>
            Download WebM
          </button>
          <button onClick={run}>Render again</button>
        </div>
      )}
    </>
  );
}
