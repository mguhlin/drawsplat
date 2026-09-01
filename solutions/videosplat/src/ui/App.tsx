import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  createProject,
  touchProject,
  type Asset,
  type Clip,
  type VideoSplatProject,
} from "../domain/project";
import { History } from "../domain/history";
import {
  clearAllLocalData,
  deleteMedia,
  deleteProject,
  listProjects,
  loadMedia,
  saveMedia,
  saveProject,
} from "../persistence/database";
import { downloadProject, readProject } from "../persistence/files";
import { downloadMlt, readMlt } from "../persistence/mlt";
import { getCapabilities, storageEstimate } from "../privacy/capabilities";
import { importMedia } from "../media/importer";
import {
  activeVisualClips,
  addTrack,
  clipRange,
  cutClipRange,
  detachClipAudio,
  duplicateClip,
  findClip,
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
  updateClip,
  updateTrack,
  type TimelineEditMode,
} from "../timeline/engine";
import { OptimizerDialog } from "./OptimizerDialog";
import { ExportDialog } from "./ExportDialog";
import { addCaptionFile, downloadCaptions } from "../captions/captions";
import { RecorderDialog } from "./RecorderDialog";
import { captureErrorMessage } from "../recorder/capture";

type Dialog =
  | "projects"
  | "privacy"
  | "shortcuts"
  | "optimizer"
  | "export"
  | "recorder"
  | null;
const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const APP_VERSION = "v1";

export function App() {
  const history = useRef(new History(createProject()));
  const [showSplash, setShowSplash] = useState(
    () => sessionStorage.getItem("videosplat-splash-seen") !== "1",
  );
  const [splashMode, setSplashMode] = useState<"record" | "edit">();
  const [splashPermissionStatus, setSplashPermissionStatus] = useState<string>();
  const [requestingSplashPermissions, setRequestingSplashPermissions] = useState(false);
  const [splashMicrophones, setSplashMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [recordingMicrophoneId, setRecordingMicrophoneId] = useState(
    () => sessionStorage.getItem("videosplat-microphone-id") ?? "",
  );
  const [splashRecordingReady, setSplashRecordingReady] = useState(
    () => sessionStorage.getItem("videosplat-recording-permissions") === "ready",
  );
  const [project, setProject] = useState(history.current.value);
  const [status, setStatus] = useState(
    "Ready — everything stays on this device",
  );
  const [savedAt, setSavedAt] = useState<string>();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [openMenu, setOpenMenu] = useState<"file" | "edit" | "about">();
  const [recent, setRecent] = useState<VideoSplatProject[]>([]);
  const [storage, setStorage] = useState<{
    usage: number;
    quota: number;
  } | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>();
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string>();
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [snapping, setSnapping] = useState(true);
  const [rippleEditing, setRippleEditing] = useState(true);
  const [editMode, setEditMode] = useState<TimelineEditMode>("insert");
  const [rangeSelecting, setRangeSelecting] = useState(false);
  const [clipSelection, setClipSelection] = useState<{
    clipId: string;
    from: number;
    to: number;
  }>();
  const [clipContextMenu, setClipContextMenu] = useState<{
    clipId: string;
    x: number;
    y: number;
  }>();
  const clipboard = useRef<Clip | undefined>(undefined);
  const drag = useRef<
    | {
        mode: "move" | "left" | "right";
        clip: Clip;
        startX: number;
        project: VideoSplatProject;
      }
    | undefined
  >(undefined);
  const dragProject = useRef<VideoSplatProject | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);
  const mltInput = useRef<HTMLInputElement>(null);
  const captionInput = useRef<HTMLInputElement>(null);
  const languageMenu = useRef<HTMLDivElement>(null);
  const splashLanguage = useRef<HTMLDivElement>(null);
  const previewMedia = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const visualMedia = useRef(new Map<string, HTMLVideoElement>());
  const timelineAudio = useRef(new Map<string, HTMLAudioElement>());
  const capabilities = useMemo(getCapabilities, []);

  useEffect(() => {
    const placeLanguageControl = () => {
      const control = document.querySelector<HTMLElement>(".ds-language-control");
      const target = showSplash ? splashLanguage.current : languageMenu.current;
      if (control && target && control.parentElement !== target) {
        control.classList.add("ds-language-inline");
        target.append(control);
      }
    };
    placeLanguageControl();
    const observer = new MutationObserver(placeLanguageControl);
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, [showSplash]);

  useEffect(() => {
    if (!openMenu) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as Element).closest(".editor-menu")) setOpenMenu(undefined);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [openMenu]);

  useEffect(() => {
    if (!clipContextMenu) return;
    const close = () => setClipContextMenu(undefined);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", escape);
    };
  }, [clipContextMenu]);

  const commit = (next: VideoSplatProject) => {
    history.current.commit(next);
    setProject(next);
  };
  const rename = (name: string) => commit(touchProject(project, { name }));
  const refreshProjects = async () =>
    setRecent(
      (await listProjects()).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    );

  const hydrateMedia = async (next: VideoSplatProject) => {
    Object.values(mediaUrls).forEach(URL.revokeObjectURL);
    const urls: Record<string, string> = {};
    for (const asset of next.assets) {
      const blob = await loadMedia(asset.id);
      if (blob) urls[asset.id] = URL.createObjectURL(blob);
    }
    setMediaUrls(urls);
    setSelectedAssetId(next.assets[0]?.id);
    setSelectedClipId(undefined);
    setTime(0);
    setPlaying(false);
  };

  useEffect(() => {
    const handle = window.setTimeout(
      () =>
        saveProject(project)
          .then(() => {
            setSavedAt(
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            );
            setStatus("Autosaved locally");
          })
          .catch(() => setStatus("Autosave failed — export a project copy")),
      500,
    );
    return () => clearTimeout(handle);
  }, [project]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (dialog || openMenu)) {
        event.preventDefault();
        setDialog(null);
        setOpenMenu(undefined);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        downloadProject(project);
        setStatus("Project copy downloaded");
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        setProject(
          event.shiftKey ? history.current.redo() : history.current.undo(),
        );
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedClipId &&
        !(event.target instanceof HTMLInputElement)
      ) {
        event.preventDefault();
        commit(
          rippleEditing
            ? rippleDeleteClip(project, selectedClipId)
            : removeClip(project, selectedClipId),
        );
        setSelectedClipId(undefined);
        setStatus(
          rippleEditing
            ? "Clip ripple-deleted; track gap closed"
            : "Clip lifted; timeline gap preserved",
        );
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        ["c", "x"].includes(event.key.toLowerCase()) &&
        selectedClipId &&
        !(event.target instanceof HTMLInputElement)
      ) {
        const location = findClip(project, selectedClipId);
        if (location) {
          event.preventDefault();
          clipboard.current = structuredClone(location.clip);
          if (event.key.toLowerCase() === "x") {
            commit(
              rippleEditing
                ? rippleDeleteClip(project, selectedClipId)
                : removeClip(project, selectedClipId),
            );
            setSelectedClipId(undefined);
          }
          setStatus(
            event.key.toLowerCase() === "x" ? "Clip cut" : "Clip copied",
          );
        }
      }
      if (
        event.key.toLowerCase() === "s" &&
        !event.ctrlKey &&
        !event.metaKey &&
        selectedClipId &&
        !(event.target instanceof HTMLInputElement)
      ) {
        const result = splitClip(project, selectedClipId, time);
        if (result.rightId) {
          commit(result.project);
          setSelectedClipId(result.rightId);
          setStatus("Clip split at playhead");
        }
      }
      if (
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        !(event.target instanceof HTMLInputElement)
      ) {
        event.preventDefault();
        setPlaying(false);
        setTime((current) =>
          Math.max(
            0,
            current +
              (event.key === "ArrowLeft" ? -1 : 1) / project.canvas.frameRate,
          ),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, selectedClipId, time, rippleEditing, dialog, openMenu]);

  useEffect(() => {
    for (const track of project.tracks.filter((item) => item.kind === "audio"))
      for (const clip of track.clips) {
        const media = timelineAudio.current.get(clip.id);
        if (!media) continue;
        const active =
          playing &&
          !track.muted &&
          !track.hidden &&
          time >= clip.start &&
          time < clip.start + clip.duration;
        if (!active) {
          if (!media.paused) media.pause();
          continue;
        }
        const expected = clip.sourceStart + time - clip.start;
        const localTime = time - clip.start;
        const gain = Number(clip.properties.volume ?? 1);
        const fadeIn = Number(clip.properties.fadeIn ?? 0);
        const fadeOut = Number(clip.properties.fadeOut ?? 0);
        const fadeGain = Math.min(
          1,
          fadeIn > 0 ? localTime / fadeIn : 1,
          fadeOut > 0 ? (clip.duration - localTime) / fadeOut : 1,
        );
        media.volume = Math.max(0, Math.min(1, gain * fadeGain));
        // Let the media element's decoder clock run during playback. Repeated
        // small seeks interrupt Opus decoding and are heard as audio stutter.
        const syncTolerance = media.paused ? 0.05 : 1;
        if (Math.abs(media.currentTime - expected) > syncTolerance)
          media.currentTime = expected;
        if (media.paused)
          media
            .play()
            .catch(() =>
              setStatus(
                "Browser blocked timeline audio playback — press Play again",
              ),
            );
      }
  }, [playing, time, project]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - previous) / 1000;
      previous = now;
      setTime((current) => {
        const next = current + elapsed;
        if (next >= projectDuration(project)) {
          setPlaying(false);
          return projectDuration(project);
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, project]);

  const newProject = () => {
    const next = createProject();
    history.current.reset(next);
    setProject(next);
    hydrateMedia(next);
    setStatus("New local project created");
  };
  const importProject = async (file?: File) => {
    if (!file) return;
    try {
      const next = await readProject(file);
      history.current.reset(next);
      setProject(next);
      await hydrateMedia(next);
      setDialog(null);
      setStatus(
        next.assets.length
          ? "Project opened — relink any missing media"
          : "Project opened locally",
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not open project",
      );
    }
  };
  const openRecent = async (next: VideoSplatProject) => {
    history.current.reset(next);
    setProject(next);
    await hydrateMedia(next);
    setDialog(null);
    setStatus("Local project restored");
  };
  const importMlt = async (file?: File) => {
    if (!file) return;
    try {
      const result = await readMlt(file);
      history.current.reset(result.project);
      setProject(result.project);
      await hydrateMedia(result.project);
      setStatus(
        result.warnings.length
          ? `MLT opened locally with ${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}`
          : "MLT project opened locally — relink its media files",
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not open MLT project",
      );
    } finally {
      if (mltInput.current) mltInput.current.value = "";
    }
  };
  const importCaptions = async (file?: File) => {
    if (!file) return;
    try {
      const next = addCaptionFile(
        project,
        await file.text(),
        file.name.replace(/\.[^.]+$/, "") || "Captions",
      );
      commit(next);
      const captionTrack = next.tracks.find(
        (track) => track.kind === "caption",
      );
      setSelectedClipId(captionTrack?.clips.at(-1)?.id);
      setSelectedAssetId(undefined);
      setStatus(`${file.name} imported locally`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Caption import failed",
      );
    } finally {
      if (captionInput.current) captionInput.current.value = "";
    }
  };

  const addFiles = async (files: FileList | File[]) => {
    if (!files.length) return;
    setImporting(true);
    try {
      let next = project;
      for (const file of Array.from(files)) {
        setStatus(`Importing ${file.name} locally…`);
        const imported = await importMedia(file);
        const missingMatch = next.assets.find(
          (asset) =>
            asset.contentHash === imported.asset.contentHash &&
            !mediaUrls[asset.id],
        );
        if (missingMatch) {
          await saveMedia(missingMatch.id, imported.blob);
          const url = URL.createObjectURL(imported.blob);
          setMediaUrls((current) => ({ ...current, [missingMatch.id]: url }));
          next = touchProject(next, {
            assets: next.assets.map((asset) =>
              asset.id === missingMatch.id
                ? {
                    ...asset,
                    storedLocally: true,
                    thumbnail: imported.asset.thumbnail,
                    waveform: imported.asset.waveform,
                  }
                : asset,
            ),
          });
          setSelectedAssetId(missingMatch.id);
          continue;
        }
        await saveMedia(imported.asset.id, imported.blob);
        const url = URL.createObjectURL(imported.blob);
        setMediaUrls((current) => ({ ...current, [imported.asset.id]: url }));
        const kind =
          imported.asset.kind === "audio" ? "audio" : imported.asset.kind;
        let track = next.tracks.find(
          (item) => item.kind === (kind === "image" ? "video" : kind),
        );
        if (!track) {
          track = {
            id: crypto.randomUUID(),
            name: `${kind[0].toUpperCase()}${kind.slice(1)} 1`,
            kind: kind === "image" ? "video" : kind,
            hidden: false,
            locked: false,
            muted: false,
            clips: [],
          };
          next = { ...next, tracks: [...next.tracks, track] };
        }
        const start = track.clips.reduce(
          (end, clip) => Math.max(end, clip.start + clip.duration),
          0,
        );
        const clip: Clip = {
          id: crypto.randomUUID(),
          assetId: imported.asset.id,
          name: imported.asset.name,
          kind,
          start,
          duration: imported.asset.duration || (kind === "image" ? 5 : 10),
          sourceStart: 0,
          properties: {},
        };
        next = touchProject(next, {
          assets: [...next.assets, imported.asset],
          tracks: next.tracks.map((item) =>
            item.id === track!.id
              ? { ...item, clips: [...item.clips, clip] }
              : item,
          ),
        });
        setSelectedAssetId(imported.asset.id);
        setSelectedClipId(clip.id);
      }
      commit(next);
      setStatus(
        `${files.length} media file${files.length === 1 ? "" : "s"} imported and stored locally`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Media import failed");
    } finally {
      setImporting(false);
      if (mediaInput.current) mediaInput.current.value = "";
    }
  };
  const removeAsset = async (asset: Asset) => {
    await deleteMedia(asset.id);
    const url = mediaUrls[asset.id];
    if (url) URL.revokeObjectURL(url);
    setMediaUrls((current) => {
      const next = { ...current };
      delete next[asset.id];
      return next;
    });
    commit(
      touchProject(project, {
        assets: project.assets.filter((item) => item.id !== asset.id),
        tracks: project.tracks.map((track) => ({
          ...track,
          clips: track.clips.filter((clip) => clip.assetId !== asset.id),
        })),
      }),
    );
    setSelectedAssetId(project.assets.find((item) => item.id !== asset.id)?.id);
    setStatus(`${asset.name} removed from this project and local storage`);
  };
  const selectedAsset = project.assets.find(
    (asset) => asset.id === selectedAssetId,
  );
  const selectedLocation = selectedClipId
    ? findClip(project, selectedClipId)
    : undefined;
  const timelineVisuals = activeVisualClips(project, time);
  const previewLocations = timelineVisuals.length
    ? timelineVisuals
    : !playing && selectedLocation && selectedLocation.clip.kind !== "audio"
      ? [selectedLocation]
      : [];
  const previewLocation = previewLocations.at(-1);
  const previewAsset = previewLocation?.clip.assetId
    ? project.assets.find((asset) => asset.id === previewLocation.clip.assetId)
    : selectedAsset;
  useEffect(() => {
    previewLocations.forEach((location) => {
      const media = visualMedia.current.get(location.clip.id);
      if (!media) return;
      const offset = Math.min(
        location.clip.duration,
        Math.max(0, time - location.clip.start),
      );
      const sourceTime = location.clip.sourceStart + offset;
      if (
        media.readyState >= 1 &&
        Math.abs(media.currentTime - sourceTime) > (media.paused ? 0.05 : 1)
      )
        media.currentTime = sourceTime;
      const localTime = time - location.clip.start;
      const gain = Number(location.clip.properties.volume ?? 1);
      const fadeIn = Number(location.clip.properties.fadeIn ?? 0);
      const fadeOut = Number(location.clip.properties.fadeOut ?? 0);
      const fadeGain = Math.min(
        1,
        fadeIn > 0 ? localTime / fadeIn : 1,
        fadeOut > 0 ? (location.clip.duration - localTime) / fadeOut : 1,
      );
      media.volume = Math.max(0, Math.min(1, gain * fadeGain));
      if (playing && media.paused)
        media
          .play()
          .catch(() =>
            setStatus("Browser blocked video playback — press Play again"),
          );
      if (!playing && !media.paused) media.pause();
    });
  }, [time, previewLocations, playing]);
  const togglePlayback = async () => {
    if (playing) {
      previewMedia.current?.pause();
      visualMedia.current.forEach((media) => media.pause());
      timelineAudio.current.forEach((media) => media.pause());
      setPlaying(false);
      return;
    }
    setPlaying(true);
  };
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * project.canvas.frameRate);
    return `00:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  };
  const totalDuration = projectDuration(project);
  const menuAction = (action: () => void) => {
    action();
    setOpenMenu(undefined);
  };
  const pixelsPerSecond = 42 * timelineZoom;
  const timelineWidth = Math.max(
    700,
    Math.ceil(Math.max(20, totalDuration) * pixelsPerSecond),
  );
  const splitSelected = () => {
    if (!selectedClipId) return;
    const result = splitClip(project, selectedClipId, time);
    if (!result.rightId) {
      setStatus("Move the playhead inside the selected clip to split");
      return;
    }
    commit(result.project);
    setSelectedClipId(result.rightId);
    setStatus("Clip split at playhead");
  };
  const duplicateSelected = () => {
    if (!selectedClipId) return;
    const result = duplicateClip(project, selectedClipId);
    if (result.duplicateId) {
      commit(result.project);
      setSelectedClipId(result.duplicateId);
      setStatus("Clip duplicated");
    }
  };
  const detachAudio = (clipId: string) => {
    const result = detachClipAudio(project, clipId);
    setClipContextMenu(undefined);
    if (!result.audioClipId) {
      setStatus("Audio is already detached from this clip");
      return;
    }
    commit(result.project);
    setSelectedClipId(result.audioClipId);
    setStatus("Audio detached to a synchronized audio-track clip");
  };
  const deleteSelected = () => {
    if (!selectedClipId) return;
    commit(
      rippleEditing
        ? rippleDeleteClip(project, selectedClipId)
        : removeClip(project, selectedClipId),
    );
    setSelectedClipId(undefined);
    setStatus(
      rippleEditing
        ? "Clip ripple-deleted; track gap closed"
        : "Clip lifted; timeline gap preserved",
    );
  };
  const copySelected = () => {
    if (!selectedLocation) return;
    const selection = clipSelection?.clipId === selectedLocation.clip.id
      ? clipRange(project, selectedLocation.clip.id, clipSelection.from, clipSelection.to)
      : undefined;
    clipboard.current = structuredClone(selection ?? selectedLocation.clip);
    setStatus(selection ? `${selection.duration.toFixed(1)} second range copied` : `${selectedLocation.clip.name} copied`);
  };
  const cutSelected = () => {
    if (!selectedLocation) return;
    if (clipSelection?.clipId === selectedLocation.clip.id) {
      const result = cutClipRange(
        project,
        selectedLocation.clip.id,
        clipSelection.from,
        clipSelection.to,
        rippleEditing,
      );
      if (!result.clipboard) return;
      clipboard.current = result.clipboard;
      commit(result.project);
      setClipSelection(undefined);
      setSelectedClipId(undefined);
      setStatus(`${result.clipboard.duration.toFixed(1)} second range removed from video and its audio; excerpt copied`);
      return;
    }
    clipboard.current = structuredClone(selectedLocation.clip);
    deleteSelected();
  };
  const pasteClip = () => {
    const source = clipboard.current;
    if (!source) {
      setStatus("Copy or cut a clip first");
      return;
    }
    const kind = source.kind === "image" ? "video" : source.kind;
    const track = project.tracks.find(
      (item) => item.kind === kind && !item.locked,
    );
    if (!track) {
      setStatus(`No unlocked ${kind} track is available`);
      return;
    }
    const result = placeClip(project, track.id, source, time, editMode);
    if (result.clipId) {
      commit(result.project);
      setSelectedClipId(result.clipId);
      setSelectedAssetId(source.assetId);
      setStatus(`${source.name} pasted using ${editMode} edit`);
    }
  };
  const insertAsset = (asset: Asset) => {
    const kind = asset.kind === "image" ? "video" : asset.kind;
    const track = project.tracks.find(
      (item) => item.kind === kind && !item.locked,
    );
    if (!track) {
      setStatus(`Unlock or create a ${kind} track before inserting`);
      return;
    }
    const duration = asset.duration || (asset.kind === "image" ? 5 : 10);
    const clip: Clip = {
      id: crypto.randomUUID(),
      assetId: asset.id,
      name: asset.name,
      kind: asset.kind,
      start: time,
      duration,
      sourceStart: 0,
      properties: {},
    };
    const next = touchProject(project, {
      tracks: project.tracks.map((item) =>
        item.id === track.id
          ? {
              ...item,
              clips: [
                ...item.clips.map((existing) =>
                  existing.start >= time
                    ? { ...existing, start: existing.start + duration }
                    : existing,
                ),
                clip,
              ],
            }
          : item,
      ),
    });
    commit(next);
    setSelectedAssetId(asset.id);
    setSelectedClipId(clip.id);
    setStatus(
      `${asset.name} inserted at the playhead; later clips moved right`,
    );
  };
  const addTitle = () => {
    const existing = project.tracks.find(
      (track) => track.kind === "text" && !track.locked,
    );
    const trackId = existing?.id ?? crypto.randomUUID();
    const clip: Clip = {
      id: crypto.randomUUID(),
      name: "Title",
      kind: "text",
      start: time,
      duration: 5,
      sourceStart: 0,
      properties: {
        text: "Your title",
        fontSize: 64,
        color: "#ffffff",
        background: "transparent",
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        transitionIn: 0.5,
        transitionOut: 0.5,
      },
    };
    const tracks = existing
      ? project.tracks.map((track) =>
          track.id === trackId
            ? { ...track, clips: [...track.clips, clip] }
            : track,
        )
      : [
          ...project.tracks,
          {
            id: trackId,
            name: "Titles 1",
            kind: "text" as const,
            hidden: false,
            locked: false,
            muted: false,
            clips: [clip],
          },
        ];
    commit(touchProject(project, { tracks }));
    setSelectedAssetId(undefined);
    setSelectedClipId(clip.id);
    setStatus("Title added at the playhead");
  };
  const beginClipDrag = (
    event: ReactPointerEvent,
    clip: Clip,
    mode: "move" | "left" | "right",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    drag.current = { mode, clip, startX: event.clientX, project };
    dragProject.current = project;
    setSelectedAssetId(clip.assetId);
    setSelectedClipId(clip.id);
    const onMove = (moveEvent: PointerEvent) => {
      const active = drag.current;
      if (!active) return;
      const delta =
        Math.round(
          ((moveEvent.clientX - active.startX) / pixelsPerSecond) * 10,
        ) / 10;
      let next = active.project;
      if (active.mode === "move") {
        const proposed = active.clip.start + delta;
        next = moveClip(
          next,
          active.clip.id,
          snapping
            ? snappedClipStart(
                active.project,
                active.clip.id,
                proposed,
                time,
                8 / pixelsPerSecond,
              )
            : proposed,
        );
      }
      if (active.mode === "left") {
        const start = Math.min(
          active.clip.start + active.clip.duration - 0.1,
          Math.max(0, active.clip.start + delta),
        );
        next = trimClip(
          next,
          active.clip.id,
          start,
          active.clip.duration - (start - active.clip.start),
        );
      }
      if (active.mode === "right")
        next = trimClip(
          next,
          active.clip.id,
          active.clip.start,
          active.clip.duration + delta,
        );
      dragProject.current = next;
      setProject(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (
        dragProject.current &&
        dragProject.current !== drag.current?.project
      ) {
        history.current.commit(dragProject.current);
        setStatus(
          drag.current?.mode === "move" ? "Clip moved" : "Clip trimmed",
        );
      }
      drag.current = undefined;
      dragProject.current = undefined;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const beginRangeSelection = (
    event: ReactPointerEvent<HTMLDivElement>,
    clip: Clip,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = (clientX: number) =>
      Math.min(clip.duration, Math.max(0, ((clientX - rect.left) / rect.width) * clip.duration));
    const anchor = offset(event.clientX);
    setSelectedAssetId(clip.assetId);
    setSelectedClipId(clip.id);
    setClipSelection({ clipId: clip.id, from: anchor, to: anchor });
    const onMove = (moveEvent: PointerEvent) =>
      setClipSelection({ clipId: clip.id, from: anchor, to: offset(moveEvent.clientX) });
    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      const end = offset(upEvent.clientX);
      if (Math.abs(end - anchor) < 0.1) {
        setClipSelection(undefined);
        setTime(clip.start + end);
        setStatus(`Previewing ${clip.name} at ${formatTime(clip.start + end)}`);
      } else {
        setClipSelection({ clipId: clip.id, from: anchor, to: end });
        setStatus(`${Math.abs(end - anchor).toFixed(1)} second range selected — Cut or Copy, then move the playhead and Paste`);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const finishSplash = () => {
    const control = document.querySelector<HTMLElement>(".ds-language-control");
    if (control && languageMenu.current) languageMenu.current.append(control);
    sessionStorage.setItem("videosplat-splash-seen", "1");
    setShowSplash(false);
  };

  const setUpRecording = async () => {
    setRequestingSplashPermissions(true);
    setSplashPermissionStatus(undefined);
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("This browser does not support camera and microphone recording.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      const devices = navigator.mediaDevices.enumerateDevices
        ? (await navigator.mediaDevices.enumerateDevices()).filter(
            (device) => device.kind === "audioinput",
          )
        : [];
      setSplashMicrophones(devices);
      const selected = devices.find((device) => device.deviceId === recordingMicrophoneId)?.deviceId
        ?? devices[0]?.deviceId
        ?? "";
      setRecordingMicrophoneId(selected);
      sessionStorage.setItem("videosplat-microphone-id", selected);
      sessionStorage.setItem("videosplat-recording-permissions", "ready");
      setSplashRecordingReady(true);
      setSplashPermissionStatus("Permission granted. Select the microphone you want VideoSplat to record.");
    } catch (error) {
      setSplashPermissionStatus(captureErrorMessage(error));
    } finally {
      setRequestingSplashPermissions(false);
    }
  };

  return (
    <div className="app-shell">
      {showSplash && (
        <section className="launch-splash" aria-label="VideoSplat loading">
          <div className="launch-splash-glow" aria-hidden="true" />
          <img src="./icon.svg" alt="" />
          <h1>
            VideoSplat<sup>™</sup>
          </h1>
          <b className="splash-version">{APP_VERSION}</b>
          <p>Private video editing. Right in your browser.</p>
          <span>Local-first · No media uploads</span>
          {!splashMode && <div className="splash-choice" aria-labelledby="splash-choice-title">
            <strong id="splash-choice-title">What would you like to do?</strong>
            <div>
              <button className="splash-record" onClick={() => setSplashMode("record")}>● Record video</button>
              <button onClick={() => {
                setSplashMode("edit");
                finishSplash();
              }}>✎ Edit video</button>
            </div>
          </div>}
          {splashMode === "record" && <>
          <div className="splash-recording-steps">
            <strong>Getting ready to record</strong>
            <ol>
              <li>Connect your headset and choose it as your computer input.</li>
              <li>Grant camera and microphone permission below.</li>
              <li>Select the exact microphone, then continue to the recorder.</li>
            </ol>
            {splashRecordingReady && (
              <label>
                Microphone to record
                <select aria-label="Splash microphone source" value={recordingMicrophoneId} onChange={(event) => {
                  setRecordingMicrophoneId(event.target.value);
                  sessionStorage.setItem("videosplat-microphone-id", event.target.value);
                }}>
                  {splashMicrophones.length ? splashMicrophones.map((device, index) => (
                    <option value={device.deviceId} key={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>
                  )) : <option value="">System default microphone</option>}
                </select>
              </label>
            )}
          </div>
          <div className="launch-splash-actions">
            {!splashRecordingReady ? (
              <button className="splash-record" onClick={setUpRecording} disabled={requestingSplashPermissions}>
                {requestingSplashPermissions ? "Requesting permission…" : "Set up recording permissions"}
              </button>
            ) : (
              <button className="splash-record" onClick={() => {
                finishSplash();
                setDialog("recorder");
                setStatus("Recording setup ready with the selected microphone");
              }}>Continue with selected microphone</button>
            )}
            <button className="splash-back" onClick={() => {
              setSplashMode(undefined);
              setSplashPermissionStatus(undefined);
            }}>← Back</button>
          </div>
          <small>Screen sharing is selected securely by your browser when each recording starts.</small>
          </>}
          <div className="splash-language" ref={splashLanguage} />
          {splashPermissionStatus && <p className={splashRecordingReady ? "splash-permission-ready" : "splash-permission-error"} role={splashRecordingReady ? "status" : "alert"}>{splashPermissionStatus}</p>}
        </section>
      )}
      <header className="topbar">
        <button
          className="brand"
          onClick={newProject}
          aria-label="Create a new VideoSplat project"
        >
          <span>
            <img src="./icon.svg" alt="" />
          </span>{" "}
          VideoSplat<sup>™</sup>
        </button>
        <label className="project-name">
          <span className="sr-only">Project name</span>
          <input
            value={project.name}
            onChange={(event) => rename(event.target.value)}
          />
        </label>
        <div className="top-actions"><span className="local-indicator"><i aria-hidden="true">●</i> Local only</span></div>
      </header>
      <nav className="toolbar" aria-label="Editor tools">
        <div className="editor-menus" role="menubar" aria-label="Application menu">
          <div className="editor-menu">
            <button role="menuitem" aria-haspopup="menu" aria-expanded={openMenu === "file"} onClick={() => setOpenMenu(openMenu === "file" ? undefined : "file")}>File</button>
            {openMenu === "file" && <div className="editor-menu-popover" role="menu">
              <button role="menuitem" onClick={() => menuAction(newProject)}>New project</button>
              <button role="menuitem" onClick={() => menuAction(() => { void refreshProjects(); setDialog("projects"); })}>Open project…</button>
              <button role="menuitem" onClick={() => menuAction(() => { downloadProject(project); setStatus("Project copy downloaded"); })}>Save project copy</button>
              <hr />
              <button role="menuitem" disabled={importing} onClick={() => menuAction(() => mediaInput.current?.click())}>{importing ? "Importing…" : "Import media…"}</button>
              <button role="menuitem" onClick={() => menuAction(() => setDialog("optimizer"))}>Optimize video…</button>
              <button role="menuitem" onClick={() => menuAction(() => setDialog("export"))}>Export video…</button>
            </div>}
          </div>
          <div className="editor-menu">
            <button role="menuitem" aria-haspopup="menu" aria-expanded={openMenu === "edit"} onClick={() => setOpenMenu(openMenu === "edit" ? undefined : "edit")}>Edit</button>
            {openMenu === "edit" && <div className="editor-menu-popover" role="menu">
              <button role="menuitemcheckbox" aria-checked={rippleEditing} onClick={() => setRippleEditing((value) => !value)}>{rippleEditing ? "✓ " : "　"}Ripple editing</button>
              <button role="menuitemcheckbox" aria-checked={snapping} onClick={() => setSnapping((value) => !value)}>{snapping ? "✓ " : "　"}Timeline snapping</button>
              <hr />
              <button role="menuitem" onClick={() => menuAction(() => captionInput.current?.click())}>Import captions…</button>
              <button role="menuitem" onClick={() => menuAction(() => { try { downloadCaptions(project, "srt"); setStatus("SRT captions downloaded"); } catch (error) { setStatus(error instanceof Error ? error.message : "Caption export failed"); } })}>Save captions as SRT</button>
              <button role="menuitem" onClick={() => menuAction(() => mltInput.current?.click())}>Open MLT…</button>
              <button role="menuitem" onClick={() => menuAction(() => downloadMlt(project))}>Save MLT</button>
              <hr />
              <button role="menuitem" onClick={() => menuAction(() => setDialog("shortcuts"))}>Keyboard shortcuts</button>
            </div>}
          </div>
          <div className="editor-menu">
            <button role="menuitem" aria-haspopup="menu" aria-expanded={openMenu === "about"} onClick={() => setOpenMenu(openMenu === "about" ? undefined : "about")}>About</button>
            <div className="editor-menu-popover about-menu" role="menu" hidden={openMenu !== "about"}>
              <div className="about-version">VideoSplat™ <strong>{APP_VERSION}</strong></div>
              <button role="menuitem" onClick={() => menuAction(() => { void storageEstimate().then(setStorage); setDialog("privacy"); })}>View privacy details</button>
              <div className="menu-language" ref={languageMenu} />
            </div>
          </div>
        </div>
        <span className="divider" />
        <button className="record-button" aria-label="Record" onClick={() => setDialog("recorder")}>● Record</button>
        <button
          onClick={() => setProject(history.current.undo())}
          disabled={!history.current.canUndo}
          aria-label="Undo"
        >
          ↶ Undo
        </button>
        <button
          onClick={() => setProject(history.current.redo())}
          disabled={!history.current.canRedo}
          aria-label="Redo"
        >
          ↷ Redo
        </button>
        <button onClick={addTitle}>＋ Title</button>
        <span className="toolbar-spacer" />
      </nav>
      <main className="workspace">
        <aside
          className="media-panel"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
        >
          <div className="panel-heading">
            <h2>Media</h2>
            <button
              onClick={() => mediaInput.current?.click()}
              aria-label="Add media"
            >
              ＋
            </button>
          </div>
          {project.assets.length ? (
            <ul className="media-list">
              {project.assets.map((asset) => (
                <li
                  className={asset.id === selectedAssetId ? "selected" : ""}
                  key={asset.id}
                >
                  <button
                    className="asset-card"
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      setPlaying(false);
                    }}
                  >
                    <span className="asset-thumb">
                      {asset.thumbnail ? (
                        <img src={asset.thumbnail} alt="" />
                      ) : asset.kind === "audio" && asset.waveform ? (
                        <span className="mini-wave" aria-hidden="true">
                          {asset.waveform.slice(0, 30).map((peak, index) => (
                            <i
                              key={index}
                              style={{ height: `${Math.max(2, peak * 35)}px` }}
                            />
                          ))}
                        </span>
                      ) : (
                        "♫"
                      )}
                    </span>
                    <span>
                      <strong>{asset.name}</strong>
                      <small>
                        {asset.kind} · {formatBytes(asset.size)}
                        {asset.duration
                          ? ` · ${asset.duration.toFixed(1)}s`
                          : ""}
                      </small>
                      {!mediaUrls[asset.id] && (
                        <em>Media missing — relink required</em>
                      )}
                    </span>
                  </button>
                  <button
                    className="asset-insert"
                    aria-label={`Insert ${asset.name} at playhead`}
                    title="Insert at playhead"
                    onClick={() => insertAsset(asset)}
                  >
                    ＋
                  </button>
                  <button
                    className="asset-delete"
                    aria-label={`Remove ${asset.name}`}
                    onClick={() => removeAsset(asset)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-small">
              <div className="media-icon">▧</div>
              <strong>Drop media here</strong>
              <p>
                Video, audio, and images are analyzed and stored only in this
                browser.
              </p>
              <button onClick={() => mediaInput.current?.click()}>
                Choose files
              </button>
            </div>
          )}
        </aside>
        <section className="stage" aria-label="Video preview">
          <div className="canvas">
            {previewLocations.length ? (
              previewLocations.map((location, layer) => {
                const asset = location.clip.assetId
                  ? project.assets.find(
                      (item) => item.id === location.clip.assetId,
                    )
                  : undefined;
                const url = asset ? mediaUrls[asset.id] : undefined;
                const isText =
                  location.clip.kind === "text" ||
                  location.clip.kind === "caption";
                if (!isText && (!asset || !url)) return null;
                const properties = location.clip.properties;
                const fit = String(properties.fit ?? "fit");
                const localTime = time - location.clip.start;
                const transitionIn = Number(properties.transitionIn ?? 0);
                const transitionOut = Number(properties.transitionOut ?? 0);
                const transitionOpacity = Math.min(
                  1,
                  transitionIn > 0 ? localTime / transitionIn : 1,
                  transitionOut > 0
                    ? (location.clip.duration - localTime) / transitionOut
                    : 1,
                );
                const style = {
                  zIndex: layer + 1,
                  opacity:
                    Number(properties.opacity ?? 1) *
                    Math.max(0, transitionOpacity),
                  transform: `translate(${Number(properties.x ?? 0)}px, ${Number(properties.y ?? 0)}px) scale(${Number(properties.scale ?? 1)}) rotate(${Number(properties.rotation ?? 0)}deg)`,
                  filter: `brightness(${Number(properties.brightness ?? 1)}) contrast(${Number(properties.contrast ?? 1)}) saturate(${Number(properties.saturation ?? 1)}) hue-rotate(${Number(properties.hue ?? 0)}deg) grayscale(${Number(properties.grayscale ?? 0)}) blur(${Number(properties.blur ?? 0)}px)`,
                };
                return (
                  <div
                    className="visual-layer"
                    style={style}
                    key={location.clip.id}
                  >
                    {asset?.kind === "video" && (
                      <video
                        src={url}
                        preload="auto"
                        playsInline
                        style={{ objectFit: fit === "fit" ? "contain" : fit === "fill" ? "cover" : "fill" }}
                        onLoadedMetadata={(event) => {
                          const offset = Math.min(
                            location.clip.duration,
                            Math.max(0, time - location.clip.start),
                          );
                          event.currentTarget.currentTime =
                            location.clip.sourceStart + offset;
                        }}
                        ref={(node) => {
                          if (node) {
                            visualMedia.current.set(location.clip.id, node);
                            if (location.clip.id === previewLocation?.clip.id)
                              previewMedia.current = node;
                          } else visualMedia.current.delete(location.clip.id);
                        }}
                      />
                    )}
                    {asset?.kind === "image" && (
                      <img
                        src={url}
                        alt={asset.name}
                        style={{ objectFit: fit === "fit" ? "contain" : fit === "fill" ? "cover" : "fill" }}
                      />
                    )}
                    {isText && (
                      <div
                        className="title-layer"
                        style={{
                          fontSize: `${Number(properties.fontSize ?? 64)}px`,
                          color: String(properties.color ?? "#ffffff"),
                          background: String(
                            properties.background ?? "transparent",
                          ),
                        }}
                      >
                        {String(properties.text ?? "Title")}
                      </div>
                    )}
                  </div>
                );
              })
            ) : previewAsset?.kind === "audio" ? (
              <div className="audio-preview">
                <div className="large-wave">
                  {previewAsset.waveform?.map((peak, index) => (
                    <i
                      key={index}
                      style={{ height: `${Math.max(3, peak * 100)}px` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="canvas-mark">
                <span><img src="./icon.svg" alt="" /></span>
                <p>
                  {playing
                    ? "Timeline gap"
                    : selectedAsset
                      ? "Move the playhead onto a clip"
                      : "Preview canvas"}
                </p>
                <small>
                  {project.canvas.width} × {project.canvas.height} ·{" "}
                  {project.canvas.frameRate} fps
                </small>
              </div>
            )}
          </div>
          <div className="transport">
            <button
              disabled={!selectedLocation}
              onClick={() => {
                previewMedia.current?.pause();
                timelineAudio.current.forEach((media) => media.pause());
                setTime(selectedLocation?.clip.start ?? 0);
                setPlaying(false);
              }}
              aria-label="Go to start"
            >
              |◀
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setTime((current) =>
                  Math.max(0, current - 1 / project.canvas.frameRate),
                );
              }}
              aria-label="Previous frame"
            >
              ‹
            </button>
            <button
              disabled={!project.tracks.some((track) => track.clips.length)}
              onClick={togglePlayback}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setTime((current) =>
                  Math.min(
                    totalDuration,
                    current + 1 / project.canvas.frameRate,
                  ),
                );
              }}
              aria-label="Next frame"
            >
              ›
            </button>
            <output>{formatTime(time)}</output>
            <button
              disabled={!selectedLocation}
              onClick={() => {
                previewMedia.current?.pause();
                timelineAudio.current.forEach((media) => media.pause());
                setTime(
                  selectedLocation
                    ? selectedLocation.clip.start +
                        selectedLocation.clip.duration
                    : totalDuration,
                );
                setPlaying(false);
              }}
              aria-label="Go to end"
            >
              ▶|
            </button>
          </div>
          {project.tracks.flatMap((track) =>
            track.kind === "audio"
              ? track.clips.map((clip) => {
                  const url = clip.assetId
                    ? mediaUrls[clip.assetId]
                    : undefined;
                  return url ? (
                    <audio
                      className="timeline-audio"
                      key={clip.id}
                      src={url}
                      ref={(node) => {
                        if (node) timelineAudio.current.set(clip.id, node);
                        else timelineAudio.current.delete(clip.id);
                      }}
                    />
                  ) : null;
                })
              : [],
          )}
        </section>
        <aside className="inspector">
          <div className="panel-heading">
            <h2>{selectedLocation ? "Clip" : "Project"}</h2>
          </div>
          {selectedLocation ? (
            <div className="clip-inspector">
              <strong title={selectedLocation.clip.name}>
                {selectedLocation.clip.name}
              </strong>
              <small>
                {selectedLocation.clip.kind} · {selectedLocation.track.name}
              </small>
              <label>
                Timeline start
                <input
                  aria-label="Timeline start"
                  type="number"
                  min="0"
                  step="0.1"
                  value={Number(selectedLocation.clip.start.toFixed(2))}
                  onChange={(event) =>
                    commit(
                      moveClip(
                        project,
                        selectedLocation.clip.id,
                        Number(event.target.value),
                      ),
                    )
                  }
                />
              </label>
              <label>
                Duration
                <input
                  aria-label="Clip duration"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={Number(selectedLocation.clip.duration.toFixed(2))}
                  onChange={(event) =>
                    commit(
                      trimClip(
                        project,
                        selectedLocation.clip.id,
                        selectedLocation.clip.start,
                        Number(event.target.value),
                      ),
                    )
                  }
                />
              </label>
              <label>
                Source start
                <input
                  aria-label="Source start"
                  type="number"
                  min="0"
                  step="0.1"
                  value={Number(selectedLocation.clip.sourceStart.toFixed(2))}
                  onChange={(event) =>
                    commit(
                      updateClip(project, selectedLocation.clip.id, {
                        sourceStart: Math.max(0, Number(event.target.value)),
                      }),
                    )
                  }
                />
              </label>
              {selectedLocation.clip.kind !== "audio" && (
                <div className="property-grid">
                  {selectedLocation.clip.kind !== "text" &&
                    selectedLocation.clip.kind !== "caption" && (
                    <label>
                      Frame fit
                      <select
                        aria-label="Frame fit"
                        value={String(selectedLocation.clip.properties.fit ?? "fit")}
                        onChange={(event) =>
                          commit(
                            updateClip(project, selectedLocation.clip.id, {
                              properties: {
                                ...selectedLocation.clip.properties,
                                fit: event.target.value,
                              },
                            }),
                          )
                        }
                      >
                        <option value="fit">Fit · show all</option>
                        <option value="fill">Fill · crop edges</option>
                        <option value="stretch">Stretch</option>
                      </select>
                    </label>
                  )}
                  <label>
                    X position
                    <input
                      aria-label="X position"
                      type="number"
                      value={Number(selectedLocation.clip.properties.x ?? 0)}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              x: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Y position
                    <input
                      aria-label="Y position"
                      type="number"
                      value={Number(selectedLocation.clip.properties.y ?? 0)}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              y: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Scale
                    <input
                      aria-label="Scale"
                      type="number"
                      min="0.05"
                      step="0.05"
                      value={Number(
                        selectedLocation.clip.properties.scale ?? 1,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              scale: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Rotation
                    <input
                      aria-label="Rotation"
                      type="number"
                      step="1"
                      value={Number(
                        selectedLocation.clip.properties.rotation ?? 0,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              rotation: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Opacity
                    <input
                      aria-label="Opacity"
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={Number(
                        selectedLocation.clip.properties.opacity ?? 1,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              opacity: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              )}
              {(selectedLocation.clip.kind === "text" ||
                selectedLocation.clip.kind === "caption") && (
                <div className="property-grid title-properties">
                  <label>
                    Title text
                    <input
                      aria-label="Title text"
                      value={String(
                        selectedLocation.clip.properties.text ?? "",
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            name: event.target.value || "Title",
                            properties: {
                              ...selectedLocation.clip.properties,
                              text: event.target.value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Font size
                    <input
                      aria-label="Font size"
                      type="number"
                      min="8"
                      value={Number(
                        selectedLocation.clip.properties.fontSize ?? 64,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              fontSize: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Text color
                    <input
                      aria-label="Text color"
                      type="color"
                      value={String(
                        selectedLocation.clip.properties.color ?? "#ffffff",
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              color: event.target.value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Background
                    <input
                      aria-label="Title background"
                      value={String(
                        selectedLocation.clip.properties.background ??
                          "transparent",
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              background: event.target.value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              )}
              {selectedLocation.clip.kind !== "audio" && (
                <div className="property-grid effects-grid">
                  <label>
                    Transition in
                    <input
                      aria-label="Transition in"
                      type="number"
                      min="0"
                      step="0.1"
                      value={Number(
                        selectedLocation.clip.properties.transitionIn ?? 0,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              transitionIn: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Transition out
                    <input
                      aria-label="Transition out"
                      type="number"
                      min="0"
                      step="0.1"
                      value={Number(
                        selectedLocation.clip.properties.transitionOut ?? 0,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              transitionOut: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Brightness
                    <input
                      aria-label="Brightness"
                      type="number"
                      min="0"
                      step="0.1"
                      value={Number(
                        selectedLocation.clip.properties.brightness ?? 1,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              brightness: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Contrast
                    <input
                      aria-label="Contrast"
                      type="number"
                      min="0"
                      step="0.1"
                      value={Number(
                        selectedLocation.clip.properties.contrast ?? 1,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              contrast: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Saturation
                    <input
                      aria-label="Saturation"
                      type="number"
                      min="0"
                      step="0.1"
                      value={Number(
                        selectedLocation.clip.properties.saturation ?? 1,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              saturation: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Hue
                    <input
                      aria-label="Hue"
                      type="number"
                      step="1"
                      value={Number(selectedLocation.clip.properties.hue ?? 0)}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              hue: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Grayscale
                    <input
                      aria-label="Grayscale"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={Number(
                        selectedLocation.clip.properties.grayscale ?? 0,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              grayscale: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Blur
                    <input
                      aria-label="Blur"
                      type="number"
                      min="0"
                      step="1"
                      value={Number(selectedLocation.clip.properties.blur ?? 0)}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              blur: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              )}
              {(selectedLocation.clip.kind === "audio" ||
                selectedLocation.clip.kind === "video") && (
                <div className="property-grid">
                  <label>
                    Volume
                    <input
                      aria-label="Volume"
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={Number(
                        selectedLocation.clip.properties.volume ?? 1,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              volume: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Fade in
                    <input
                      aria-label="Fade in"
                      type="number"
                      min="0"
                      step="0.1"
                      value={Number(
                        selectedLocation.clip.properties.fadeIn ?? 0,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              fadeIn: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label>
                    Fade out
                    <input
                      aria-label="Fade out"
                      type="number"
                      min="0"
                      step="0.1"
                      value={Number(
                        selectedLocation.clip.properties.fadeOut ?? 0,
                      )}
                      onChange={(event) =>
                        commit(
                          updateClip(project, selectedLocation.clip.id, {
                            properties: {
                              ...selectedLocation.clip.properties,
                              fadeOut: Number(event.target.value),
                            },
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              )}
              <div className="inspector-actions">
                <button onClick={splitSelected}>Split at playhead</button>
                <button onClick={duplicateSelected}>Duplicate</button>
                <button
                  onClick={() => downloadMlt(project, selectedLocation.clip)}
                >
                  Save trimmed clip as MLT
                </button>
                <button className="danger" onClick={deleteSelected}>
                  Delete clip
                </button>
              </div>
            </div>
          ) : (
            <>
              <label>
                Canvas
                <select
                  value={`${project.canvas.width}x${project.canvas.height}`}
                  onChange={(event) => {
                    const [width, height] = event.target.value
                      .split("x")
                      .map(Number);
                    commit(
                      touchProject(project, {
                        canvas: { ...project.canvas, width, height },
                      }),
                    );
                  }}
                >
                  <option value="1920x1080">Landscape 16:9</option>
                  <option value="1080x1920">Portrait 9:16</option>
                  <option value="1080x1080">Square 1:1</option>
                  <option value="1440x1080">Classic 4:3</option>
                </select>
              </label>
              <label>
                Frame rate
                <select
                  value={project.canvas.frameRate}
                  onChange={(event) =>
                    commit(
                      touchProject(project, {
                        canvas: {
                          ...project.canvas,
                          frameRate: Number(event.target.value),
                        },
                      }),
                    )
                  }
                >
                  <option>24</option>
                  <option>25</option>
                  <option>30</option>
                  <option>60</option>
                </select>
              </label>
              <div className="trust-card">
                <strong>Privacy by design</strong>
                <p>No account, analytics, ads, trackers, or media uploads.</p>
                <button
                  onClick={async () => {
                    setStorage(await storageEstimate());
                    setDialog("privacy");
                  }}
                >
                  View privacy details
                </button>
              </div>
            </>
          )}
        </aside>
        <section className="timeline" aria-label="Timeline">
          <div
            className="timeline-head"
            style={{ gridTemplateColumns: `190px ${timelineWidth}px` }}
          >
            <div className="timeline-tools">
              <span className="sr-only">Timeline controls</span>
              <button
                onClick={() =>
                  setTimelineZoom((zoom) => Math.max(0.5, zoom - 0.25))
                }
                aria-label="Zoom out"
              >
                −
              </button>
              <output>{Math.round(timelineZoom * 100)}%</output>
              <button
                onClick={() =>
                  setTimelineZoom((zoom) => Math.min(4, zoom + 0.25))
                }
                aria-label="Zoom in"
              >
                ＋
              </button>
              <button
                aria-label={`Range select ${rangeSelecting ? "on" : "off"}`}
                aria-pressed={rangeSelecting}
                onClick={() => {
                  setRangeSelecting((value) => !value);
                  setClipSelection(undefined);
                }}
                title="Select range: drag across a video clip, then remove the highlighted excerpt"
              >
                {rangeSelecting ? "Range ✓" : "Range"}
              </button>
            </div>
            <div
              className="ruler"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setTime(
                  Math.max(0, (event.clientX - rect.left) / pixelsPerSecond),
                );
              }}
              >
              <div className="timeline-edit-tools" onClick={(event) => event.stopPropagation()}>
                <button onClick={splitSelected} disabled={!selectedClipId}>Split</button>
                <button onClick={duplicateSelected} disabled={!selectedClipId}>Duplicate</button>
                <button onClick={deleteSelected} disabled={!selectedClipId}>Delete</button>
                <button onClick={cutSelected} disabled={!selectedClipId}>{clipSelection ? "Remove range" : "Cut"}</button>
                <button onClick={copySelected} disabled={!selectedClipId}>Copy</button>
                <button onClick={pasteClip}>Paste</button>
                <select
                  aria-label="Timeline edit mode"
                  value={editMode}
                  onChange={(event) => setEditMode(event.target.value as TimelineEditMode)}
                >
                  <option value="append">Append</option>
                  <option value="insert">Insert</option>
                  <option value="overwrite">Overwrite</option>
                </select>
              </div>
              {Array.from(
                { length: Math.floor(Math.max(20, totalDuration) / 5) + 1 },
                (_, index) => (
                  <span
                    key={index}
                    style={{ left: index * 5 * pixelsPerSecond }}
                  >
                    {formatTime(index * 5).slice(3, 8)}
                  </span>
                ),
              )}
            </div>
          </div>
          {project.tracks.map((track, trackIndex) => <Fragment key={track.id}>
            <div
              className={`track ${track.locked ? "locked" : ""}`}
              style={{ gridTemplateColumns: `190px ${timelineWidth}px` }}
            >
              <div className="track-label">
                <input
                  aria-label={`Rename ${track.name}`}
                  value={track.name}
                  onChange={(event) =>
                    commit(
                      updateTrack(project, track.id, {
                        name: event.target.value,
                      }),
                    )
                  }
                />
                <div>
                  <button
                    disabled={project.tracks[0]?.id === track.id}
                    onClick={() => commit(reorderTrack(project, track.id, -1))}
                    aria-label={`Move ${track.name} up`}
                  >
                    ↑
                  </button>
                  <button
                    disabled={project.tracks.at(-1)?.id === track.id}
                    onClick={() => commit(reorderTrack(project, track.id, 1))}
                    aria-label={`Move ${track.name} down`}
                  >
                    ↓
                  </button>
                  <button
                    aria-pressed={
                      track.kind === "audio" ? track.muted : track.hidden
                    }
                    onClick={() =>
                      commit(
                        updateTrack(
                          project,
                          track.id,
                          track.kind === "audio"
                            ? { muted: !track.muted }
                            : { hidden: !track.hidden },
                        ),
                      )
                    }
                    aria-label={`${track.kind === "audio" ? "Mute" : "Hide"} ${track.name}`}
                  >
                    {track.kind === "audio"
                      ? track.muted
                        ? "M"
                        : "♫"
                      : track.hidden
                        ? "○"
                        : "◉"}
                  </button>
                  <button
                    aria-pressed={track.locked}
                    onClick={() =>
                      commit(
                        updateTrack(project, track.id, {
                          locked: !track.locked,
                        }),
                      )
                    }
                    aria-label={`Lock ${track.name}`}
                  >
                    {track.locked ? "▣" : "⌑"}
                  </button>
                  <button
                    onClick={() => {
                      const next = removeEmptyTrack(project, track.id);
                      if (next === project)
                        setStatus("Only empty extra tracks can be removed");
                      else commit(next);
                    }}
                    aria-label={`Remove ${track.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div
                className="track-lane"
                onClick={(event) => {
                  if (event.target !== event.currentTarget) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  setTime(
                    Math.max(0, (event.clientX - rect.left) / pixelsPerSecond),
                  );
                }}
              >
                <div
                  className="playhead"
                  style={{ left: `${time * pixelsPerSecond}px` }}
                />
                {track.clips.map((clip) => {
                  const asset = project.assets.find(
                    (item) => item.id === clip.assetId,
                  );
                  return (
                    <div
                      role="button"
                      tabIndex={track.locked ? -1 : 0}
                      aria-disabled={track.locked}
                      key={clip.id}
                      className={`timeline-clip ${clip.kind} ${clip.id === selectedClipId ? "selected" : ""}`}
                      style={{
                        left: `${clip.start * pixelsPerSecond}px`,
                        width: `${Math.max(24, clip.duration * pixelsPerSecond)}px`,
                      }}
                      onPointerDown={(event) => {
                        if (track.locked || event.button !== 0) return;
                        if (rangeSelecting) beginRangeSelection(event, clip);
                        else beginClipDrag(event, clip, "move");
                      }}
                      onContextMenu={(event) => {
                        if (track.locked || track.kind !== "video" || clip.kind !== "video") return;
                        event.preventDefault();
                        event.stopPropagation();
                        setPlaying(false);
                        setSelectedClipId(clip.id);
                        setClipContextMenu({
                          clipId: clip.id,
                          x: Math.min(event.clientX, window.innerWidth - 190),
                          y: Math.min(event.clientY, window.innerHeight - 60),
                        });
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (rangeSelecting) return;
                        const rect =
                          event.currentTarget.getBoundingClientRect();
                        const offset = Math.min(
                          clip.duration,
                          Math.max(
                            0,
                            (event.clientX - rect.left) / pixelsPerSecond,
                          ),
                        );
                        setSelectedAssetId(clip.assetId);
                        setSelectedClipId(clip.id);
                        setTime(clip.start + offset);
                        setPlaying(false);
                        setStatus(
                          `Previewing ${clip.name} at ${formatTime(clip.start + offset)}`,
                        );
                      }}
                      title={`${clip.name}, ${clip.duration.toFixed(1)} seconds. Click to preview; drag to move; drag edges to trim.`}
                    >
                      <i
                        className="trim-handle left"
                        aria-label="Trim clip start"
                        onPointerDown={(event) =>
                          !track.locked && beginClipDrag(event, clip, "left")
                        }
                      />
                      {asset?.thumbnail && <img src={asset.thumbnail} alt="" />}
                      {asset?.waveform && (
                        <span className="clip-waveform" aria-hidden="true">
                          {asset.waveform.map((peak, index) => (
                            <i key={index} style={{ height: `${Math.max(8, peak * 100)}%` }} />
                          ))}
                        </span>
                      )}
                      {clipSelection?.clipId === clip.id && (
                        <span
                          className="clip-range-selection"
                          aria-label={`Selected range ${Math.min(clipSelection.from, clipSelection.to).toFixed(1)} to ${Math.max(clipSelection.from, clipSelection.to).toFixed(1)} seconds`}
                          style={{
                            left: `${(Math.min(clipSelection.from, clipSelection.to) / clip.duration) * 100}%`,
                            width: `${(Math.abs(clipSelection.to - clipSelection.from) / clip.duration) * 100}%`,
                          }}
                        />
                      )}
                      <span>{clip.name}</span>
                      <i
                        className="trim-handle right"
                        aria-label="Trim clip end"
                        onPointerDown={(event) =>
                          !track.locked && beginClipDrag(event, clip, "right")
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {(track.kind === "video" || track.kind === "audio") && project.tracks[trackIndex + 1]?.kind !== track.kind && <div
              className={`track-add-row ${track.kind}`}
              style={{ gridTemplateColumns: `190px ${timelineWidth}px` }}
            >
              <div><button
                aria-label={`Add ${track.kind} track`}
                title={`Add ${track.kind} track`}
                onClick={() => commit(addTrack(project, track.kind as "video" | "audio"))}
              >＋</button></div>
              <span aria-hidden="true" />
            </div>}
          </Fragment>)}
        </section>
      </main>
      <footer className="statusbar">
        <span role="status" aria-live="polite">
          {status}
        </span>
        <span>{savedAt ? `Saved ${savedAt}` : "Saving locally…"}</span>
        <span className="status-right">
          Schema v{project.version} · Offline-ready
        </span>
      </footer>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept=".json,.videosplat.json,application/json"
        onChange={(event) => importProject(event.target.files?.[0])}
      />
      <input
        ref={mediaInput}
        type="file"
        hidden
        multiple
        accept="video/*,audio/*,image/*"
        onChange={(event) => event.target.files && addFiles(event.target.files)}
      />
      <input
        ref={mltInput}
        type="file"
        hidden
        accept=".mlt,.xml,application/xml,text/xml"
        onChange={(event) => importMlt(event.target.files?.[0])}
      />
      <input
        ref={captionInput}
        type="file"
        hidden
        accept=".srt,.vtt,application/x-subrip,text/vtt,text/plain"
        onChange={(event) => importCaptions(event.target.files?.[0])}
      />
      {clipContextMenu && <div
        className="clip-context-menu"
        role="menu"
        aria-label="Video clip actions"
        style={{ left: clipContextMenu.x, top: clipContextMenu.y }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button role="menuitem" onClick={() => detachAudio(clipContextMenu.clipId)}>
          Detach audio
        </button>
      </div>}
      {dialog && (
        <div className="backdrop" onMouseDown={() => setDialog(null)}>
          <section
            className={`dialog ${dialog === "optimizer" || dialog === "export" || dialog === "recorder" ? "optimizer-dialog" : ""} ${dialog === "recorder" ? "recorder-dialog" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              dialog === "optimizer"
                ? "optimizer-title"
                : dialog === "export"
                  ? "export-title"
                  : dialog === "recorder"
                    ? "recorder-title"
                  : "dialog-title"
            }
            onMouseDown={(event) => event.stopPropagation()}
          >
            {dialog !== "optimizer" && dialog !== "export" && dialog !== "recorder" && (
              <button
                className="dialog-close"
                onClick={() => setDialog(null)}
                aria-label="Close"
              >
                ×
              </button>
            )}
            {dialog === "optimizer" && (
              <OptimizerDialog
                onClose={() => setDialog(null)}
                onAdd={async (file) => addFiles([file])}
                onStatus={setStatus}
              />
            )}
            {dialog === "export" && (
              <ExportDialog
                project={project}
                urls={mediaUrls}
                onClose={() => setDialog(null)}
                onStatus={setStatus}
              />
            )}
            {dialog === "recorder" && (
              <RecorderDialog
                initialMicrophoneDeviceId={recordingMicrophoneId}
                permissionsPrepared={splashRecordingReady}
                onClose={() => setDialog(null)}
                onAdd={async (file) => addFiles([file])}
                onStatus={setStatus}
              />
            )}
            {dialog === "projects" && (
              <>
                <h2 id="dialog-title">Open a local project</h2>
                <button
                  className="primary wide"
                  onClick={() => fileInput.current?.click()}
                >
                  Open .videosplat.json file
                </button>
                <p className="hint">
                  Portable project files contain edit instructions, not the
                  source media. Media stored by this browser reconnects
                  automatically; otherwise import the original files again.
                </p>
                <h3>Autosaved projects</h3>
                {recent.length ? (
                  <ul className="recent-list">
                    {recent.map((item) => (
                      <li key={item.id}>
                        <button onClick={() => openRecent(item)}>
                          <strong>{item.name}</strong>
                          <small>
                            {new Date(item.updatedAt).toLocaleString()} ·{" "}
                            {item.assets.length} media
                          </small>
                        </button>
                        <button
                          className="danger"
                          aria-label={`Delete ${item.name}`}
                          onClick={async () => {
                            await deleteProject(item.id);
                            refreshProjects();
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No autosaved projects yet.</p>
                )}
              </>
            )}
            {dialog === "privacy" && (
              <>
                <h2 id="dialog-title">Privacy & device storage</h2>
                <p className="lead">
                  Core editing is local. VideoSplat™ does not require an
                  account and does not include analytics, advertising, tracking,
                  or remote media processing.
                </p>
                <div className="privacy-grid">
                  <div>
                    <strong>Network</strong>
                    <span>Same-origin app files only</span>
                  </div>
                  <div>
                    <strong>Permissions</strong>
                    <span>Files or recording devices only after your action</span>
                  </div>
                  <div>
                    <strong>Storage used</strong>
                    <span>
                      {storage ? formatBytes(storage.usage) : "Unavailable"}
                    </span>
                  </div>
                  <div>
                    <strong>Storage quota</strong>
                    <span>
                      {storage ? formatBytes(storage.quota) : "Unavailable"}
                    </span>
                  </div>
                </div>
                <h3>Browser capabilities</h3>
                <ul className="capabilities">
                  {capabilities.map((capability) => (
                    <li key={capability.name}>
                      <span className={capability.available ? "ok" : "warn"}>
                        {capability.available ? "✓" : "–"}
                      </span>
                      <span>
                        <strong>{capability.name}</strong>
                        <small>{capability.detail}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className="danger wide"
                  onClick={async () => {
                    if (
                      confirm(
                        "Delete every autosaved VideoSplat project and stored media file from this browser? Download copies first if needed.",
                      )
                    ) {
                      await clearAllLocalData();
                      newProject();
                      setDialog(null);
                      setStatus(
                        "All local VideoSplat projects and media deleted",
                      );
                    }
                  }}
                >
                  Clear all local project data and media
                </button>
              </>
            )}
            {dialog === "shortcuts" && (
              <>
                <h2 id="dialog-title">Keyboard shortcuts</h2>
                <dl className="shortcuts">
                  <div>
                    <dt>Save project copy</dt>
                    <dd>Ctrl/⌘ S</dd>
                  </div>
                  <div>
                    <dt>Undo</dt>
                    <dd>Ctrl/⌘ Z</dd>
                  </div>
                  <div>
                    <dt>Redo</dt>
                    <dd>Ctrl/⌘ Shift Z</dd>
                  </div>
                  <div>
                    <dt>Split selected clip</dt>
                    <dd>S</dd>
                  </div>
                  <div>
                    <dt>Delete selected clip</dt>
                    <dd>Delete</dd>
                  </div>
                </dl>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
