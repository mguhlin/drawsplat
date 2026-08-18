import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createProject, touchProject, type Asset, type Clip, type VideoSplatProject } from "../domain/project";
import { History } from "../domain/history";
import { clearAllLocalData, deleteMedia, deleteProject, listProjects, loadMedia, saveMedia, saveProject } from "../persistence/database";
import { downloadProject, readProject } from "../persistence/files";
import { getCapabilities, storageEstimate } from "../privacy/capabilities";
import { importMedia } from "../media/importer";
import { duplicateClip, findClip, moveClip, projectDuration, removeClip, splitClip, trimClip, updateClip, updateTrack } from "../timeline/engine";
import { OptimizerDialog } from "./OptimizerDialog";

type Dialog = "projects" | "privacy" | "shortcuts" | "optimizer" | null;
const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function App() {
  const history = useRef(new History(createProject()));
  const [project, setProject] = useState(history.current.value);
  const [status, setStatus] = useState("Ready — everything stays on this device");
  const [savedAt, setSavedAt] = useState<string>();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [recent, setRecent] = useState<VideoSplatProject[]>([]);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>();
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string>();
  const [timelineZoom, setTimelineZoom] = useState(1);
  const fileInput = useRef<HTMLInputElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);
  const previewMedia = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const capabilities = useMemo(getCapabilities, []);

  const commit = (next: VideoSplatProject) => { history.current.commit(next); setProject(next); };
  const rename = (name: string) => commit(touchProject(project, { name }));
  const refreshProjects = async () => setRecent((await listProjects()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

  const hydrateMedia = async (next: VideoSplatProject) => {
    Object.values(mediaUrls).forEach(URL.revokeObjectURL);
    const urls: Record<string, string> = {};
    for (const asset of next.assets) { const blob = await loadMedia(asset.id); if (blob) urls[asset.id] = URL.createObjectURL(blob); }
    setMediaUrls(urls); setSelectedAssetId(next.assets[0]?.id); setSelectedClipId(undefined); setTime(0); setPlaying(false);
  };

  useEffect(() => {
    const handle = window.setTimeout(() => saveProject(project).then(() => { setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); setStatus("Autosaved locally"); }).catch(() => setStatus("Autosave failed — export a project copy")), 500);
    return () => clearTimeout(handle);
  }, [project]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); downloadProject(project); setStatus("Project copy downloaded"); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); setProject(event.shiftKey ? history.current.redo() : history.current.undo()); }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedClipId && !(event.target instanceof HTMLInputElement)) { event.preventDefault(); commit(removeClip(project, selectedClipId)); setSelectedClipId(undefined); setStatus("Clip deleted"); }
      if (event.key.toLowerCase() === "s" && !event.ctrlKey && !event.metaKey && selectedClipId && !(event.target instanceof HTMLInputElement)) { const result = splitClip(project, selectedClipId, time); if (result.rightId) { commit(result.project); setSelectedClipId(result.rightId); setStatus("Clip split at playhead"); } }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [project, selectedClipId, time]);

  const newProject = () => { const next = createProject(); history.current.reset(next); setProject(next); hydrateMedia(next); setStatus("New local project created"); };
  const importProject = async (file?: File) => { if (!file) return; try { const next = await readProject(file); history.current.reset(next); setProject(next); await hydrateMedia(next); setDialog(null); setStatus(next.assets.length ? "Project opened — relink any missing media" : "Project opened locally"); } catch (error) { setStatus(error instanceof Error ? error.message : "Could not open project"); } };
  const openRecent = async (next: VideoSplatProject) => { history.current.reset(next); setProject(next); await hydrateMedia(next); setDialog(null); setStatus("Local project restored"); };

  const addFiles = async (files: FileList | File[]) => {
    if (!files.length) return; setImporting(true);
    try {
      let next = project;
      for (const file of Array.from(files)) {
        setStatus(`Importing ${file.name} locally…`);
        const imported = await importMedia(file);
        const missingMatch = next.assets.find((asset) => asset.contentHash === imported.asset.contentHash && !mediaUrls[asset.id]);
        if (missingMatch) {
          await saveMedia(missingMatch.id, imported.blob); const url = URL.createObjectURL(imported.blob);
          setMediaUrls((current) => ({ ...current, [missingMatch.id]: url }));
          next = touchProject(next, { assets: next.assets.map((asset) => asset.id === missingMatch.id ? { ...asset, storedLocally: true, thumbnail: imported.asset.thumbnail, waveform: imported.asset.waveform } : asset) });
          setSelectedAssetId(missingMatch.id); continue;
        }
        await saveMedia(imported.asset.id, imported.blob);
        const url = URL.createObjectURL(imported.blob); setMediaUrls((current) => ({ ...current, [imported.asset.id]: url }));
        const kind = imported.asset.kind === "audio" ? "audio" : imported.asset.kind; let track = next.tracks.find((item) => item.kind === (kind === "image" ? "video" : kind));
        if (!track) { track = { id: crypto.randomUUID(), name: `${kind[0].toUpperCase()}${kind.slice(1)} 1`, kind: kind === "image" ? "video" : kind, hidden: false, locked: false, muted: false, clips: [] }; next = { ...next, tracks: [...next.tracks, track] }; }
        const start = track.clips.reduce((end, clip) => Math.max(end, clip.start + clip.duration), 0);
        const clip: Clip = { id: crypto.randomUUID(), assetId: imported.asset.id, name: imported.asset.name, kind, start, duration: imported.asset.duration || (kind === "image" ? 5 : 10), sourceStart: 0, properties: {} };
        next = touchProject(next, { assets: [...next.assets, imported.asset], tracks: next.tracks.map((item) => item.id === track!.id ? { ...item, clips: [...item.clips, clip] } : item) });
        setSelectedAssetId(imported.asset.id); setSelectedClipId(clip.id);
      }
      commit(next); setStatus(`${files.length} media file${files.length === 1 ? "" : "s"} imported and stored locally`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Media import failed"); } finally { setImporting(false); if (mediaInput.current) mediaInput.current.value = ""; }
  };
  const removeAsset = async (asset: Asset) => {
    await deleteMedia(asset.id); const url = mediaUrls[asset.id]; if (url) URL.revokeObjectURL(url);
    setMediaUrls((current) => { const next = { ...current }; delete next[asset.id]; return next; });
    commit(touchProject(project, { assets: project.assets.filter((item) => item.id !== asset.id), tracks: project.tracks.map((track) => ({ ...track, clips: track.clips.filter((clip) => clip.assetId !== asset.id) })) }));
    setSelectedAssetId(project.assets.find((item) => item.id !== asset.id)?.id); setStatus(`${asset.name} removed from this project and local storage`);
  };
  const selectedAsset = project.assets.find((asset) => asset.id === selectedAssetId);
  const selectedLocation = selectedClipId ? findClip(project, selectedClipId) : undefined;
  const selectedUrl = selectedAsset ? mediaUrls[selectedAsset.id] : undefined;
  const togglePlayback = async () => { const media = previewMedia.current; if (!media) return; if (media.paused) { await media.play(); setPlaying(true); } else { media.pause(); setPlaying(false); } };
  const formatTime = (seconds: number) => { const minutes = Math.floor(seconds / 60); const remaining = Math.floor(seconds % 60); const frames = Math.floor((seconds % 1) * project.canvas.frameRate); return `00:${String(minutes).padStart(2,"0")}:${String(remaining).padStart(2,"0")}:${String(frames).padStart(2,"0")}`; };
  const totalDuration = projectDuration(project);
  const pixelsPerSecond = 42 * timelineZoom;
  const timelineWidth = Math.max(700, Math.ceil(Math.max(20, totalDuration) * pixelsPerSecond));
  const splitSelected = () => { if (!selectedClipId) return; const result = splitClip(project, selectedClipId, time); if (!result.rightId) { setStatus("Move the playhead inside the selected clip to split"); return; } commit(result.project); setSelectedClipId(result.rightId); setStatus("Clip split at playhead"); };
  const duplicateSelected = () => { if (!selectedClipId) return; const result = duplicateClip(project, selectedClipId); if (result.duplicateId) { commit(result.project); setSelectedClipId(result.duplicateId); setStatus("Clip duplicated"); } };
  const deleteSelected = () => { if (!selectedClipId) return; commit(removeClip(project, selectedClipId)); setSelectedClipId(undefined); setStatus("Clip deleted"); };

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={newProject} aria-label="Create a new VideoSplat project"><span>V</span> VideoSplat</button>
      <label className="project-name"><span className="sr-only">Project name</span><input value={project.name} onChange={(event) => rename(event.target.value)} /></label>
      <div className="top-actions">
        <button className="privacy-badge" onClick={async () => { setStorage(await storageEstimate()); setDialog("privacy"); }}><span aria-hidden="true">●</span> Local only</button>
        <button onClick={() => { refreshProjects(); setDialog("projects"); }}>Open</button>
        <button className="primary" onClick={() => { downloadProject(project); setStatus("Project copy downloaded"); }}>Save copy</button>
      </div>
    </header>
    <nav className="toolbar" aria-label="Editor tools">
      <button onClick={() => mediaInput.current?.click()} disabled={importing}>＋ {importing ? "Importing…" : "Import media"}</button>
      <button onClick={() => setDialog("optimizer")}>⇩ Optimize video</button>
      <span className="divider" />
      <button onClick={() => setProject(history.current.undo())} disabled={!history.current.canUndo} aria-label="Undo">↶ Undo</button>
      <button onClick={() => setProject(history.current.redo())} disabled={!history.current.canRedo} aria-label="Redo">↷ Redo</button>
      <span className="divider" />
      <button onClick={splitSelected} disabled={!selectedClipId}>Split</button>
      <button onClick={duplicateSelected} disabled={!selectedClipId}>Duplicate</button>
      <button onClick={deleteSelected} disabled={!selectedClipId}>Delete</button>
      <span className="toolbar-spacer" />
      <button onClick={() => setDialog("shortcuts")}>Shortcuts</button>
      <button disabled title="Export arrives after the rendering milestone">Export video</button>
    </nav>
    <main className="workspace">
      <aside className="media-panel" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}><div className="panel-heading"><h2>Media</h2><button onClick={() => mediaInput.current?.click()} aria-label="Add media">＋</button></div>{project.assets.length ? <ul className="media-list">{project.assets.map((asset) => <li className={asset.id === selectedAssetId ? "selected" : ""} key={asset.id}><button className="asset-card" onClick={() => { setSelectedAssetId(asset.id); setTime(0); setPlaying(false); }}><span className="asset-thumb">{asset.thumbnail ? <img src={asset.thumbnail} alt="" /> : asset.kind === "audio" && asset.waveform ? <span className="mini-wave" aria-hidden="true">{asset.waveform.slice(0,30).map((peak,index) => <i key={index} style={{height:`${Math.max(2,peak*35)}px`}} />)}</span> : "♫"}</span><span><strong>{asset.name}</strong><small>{asset.kind} · {formatBytes(asset.size)}{asset.duration ? ` · ${asset.duration.toFixed(1)}s` : ""}</small>{!mediaUrls[asset.id] && <em>Media missing — relink required</em>}</span></button><button className="asset-delete" aria-label={`Remove ${asset.name}`} onClick={() => removeAsset(asset)}>×</button></li>)}</ul> : <div className="empty-small"><div className="media-icon">▧</div><strong>Drop media here</strong><p>Video, audio, and images are analyzed and stored only in this browser.</p><button onClick={() => mediaInput.current?.click()}>Choose files</button></div>}</aside>
      <section className="stage" aria-label="Video preview"><div className="canvas">{selectedAsset && selectedUrl ? <>{selectedAsset.kind === "video" && <video key={selectedUrl} ref={previewMedia as RefObject<HTMLVideoElement>} src={selectedUrl} onLoadedMetadata={(event) => { if (selectedLocation) event.currentTarget.currentTime = selectedLocation.clip.sourceStart; }} onTimeUpdate={(event) => setTime(selectedLocation ? selectedLocation.clip.start + Math.max(0,event.currentTarget.currentTime-selectedLocation.clip.sourceStart) : event.currentTarget.currentTime)} onEnded={() => setPlaying(false)} />}{selectedAsset.kind === "audio" && <div className="audio-preview"><div className="large-wave">{selectedAsset.waveform?.map((peak,index) => <i key={index} style={{height:`${Math.max(3,peak*100)}px`}} />)}</div><audio key={selectedUrl} ref={previewMedia as RefObject<HTMLAudioElement>} src={selectedUrl} onLoadedMetadata={(event) => { if (selectedLocation) event.currentTarget.currentTime = selectedLocation.clip.sourceStart; }} onTimeUpdate={(event) => setTime(selectedLocation ? selectedLocation.clip.start + Math.max(0,event.currentTarget.currentTime-selectedLocation.clip.sourceStart) : event.currentTarget.currentTime)} onEnded={() => setPlaying(false)} /></div>}{selectedAsset.kind === "image" && <img src={selectedUrl} alt={selectedAsset.name} />}</> : <div className="canvas-mark"><span>V</span><p>{selectedAsset ? "Media needs to be relinked" : "Preview canvas"}</p><small>{project.canvas.width} × {project.canvas.height} · {project.canvas.frameRate} fps</small></div>}</div><div className="transport"><button disabled={!selectedUrl || selectedAsset?.kind === "image"} onClick={() => { if (previewMedia.current) previewMedia.current.currentTime = selectedLocation?.clip.sourceStart ?? 0; setTime(selectedLocation?.clip.start ?? 0); }} aria-label="Go to start">|◀</button><button disabled={!selectedUrl || selectedAsset?.kind === "image"} onClick={togglePlayback} aria-label={playing ? "Pause" : "Play"}>{playing ? "❚❚" : "▶"}</button><output>{formatTime(time)}</output><button disabled={!selectedUrl || selectedAsset?.kind === "image"} onClick={() => { if (previewMedia.current) previewMedia.current.currentTime = selectedLocation ? selectedLocation.clip.sourceStart+selectedLocation.clip.duration : previewMedia.current.duration; }} aria-label="Go to end">▶|</button></div></section>
      <aside className="inspector"><div className="panel-heading"><h2>{selectedLocation ? "Clip" : "Project"}</h2></div>{selectedLocation ? <div className="clip-inspector"><strong title={selectedLocation.clip.name}>{selectedLocation.clip.name}</strong><small>{selectedLocation.clip.kind} · {selectedLocation.track.name}</small><label>Timeline start<input aria-label="Timeline start" type="number" min="0" step="0.1" value={Number(selectedLocation.clip.start.toFixed(2))} onChange={(event) => commit(moveClip(project, selectedLocation.clip.id, Number(event.target.value)))} /></label><label>Duration<input aria-label="Clip duration" type="number" min="0.1" step="0.1" value={Number(selectedLocation.clip.duration.toFixed(2))} onChange={(event) => commit(trimClip(project, selectedLocation.clip.id, selectedLocation.clip.start, Number(event.target.value)))} /></label><label>Source start<input aria-label="Source start" type="number" min="0" step="0.1" value={Number(selectedLocation.clip.sourceStart.toFixed(2))} onChange={(event) => commit(updateClip(project, selectedLocation.clip.id, { sourceStart: Math.max(0, Number(event.target.value)) }))} /></label><div className="inspector-actions"><button onClick={splitSelected}>Split at playhead</button><button onClick={duplicateSelected}>Duplicate</button><button className="danger" onClick={deleteSelected}>Delete clip</button></div></div> : <><label>Canvas<select value={`${project.canvas.width}x${project.canvas.height}`} onChange={(event) => { const [width, height] = event.target.value.split("x").map(Number); commit(touchProject(project, { canvas: { ...project.canvas, width, height } })); }}><option value="1920x1080">Landscape 16:9</option><option value="1080x1920">Portrait 9:16</option><option value="1080x1080">Square 1:1</option><option value="1440x1080">Classic 4:3</option></select></label><label>Frame rate<select value={project.canvas.frameRate} onChange={(event) => commit(touchProject(project, { canvas: { ...project.canvas, frameRate: Number(event.target.value) } }))}><option>24</option><option>25</option><option>30</option><option>60</option></select></label><div className="trust-card"><strong>Privacy by design</strong><p>No account, analytics, ads, trackers, or media uploads.</p><button onClick={async () => { setStorage(await storageEstimate()); setDialog("privacy"); }}>View privacy details</button></div></>}</aside>
      <section className="timeline" aria-label="Timeline"><div className="timeline-head" style={{gridTemplateColumns:`190px ${timelineWidth}px`}}><div className="timeline-tools"><span>Timeline</span><button onClick={() => setTimelineZoom((zoom) => Math.max(.5, zoom - .25))} aria-label="Zoom out">−</button><output>{Math.round(timelineZoom*100)}%</output><button onClick={() => setTimelineZoom((zoom) => Math.min(4, zoom + .25))} aria-label="Zoom in">＋</button></div><div className="ruler" onClick={(event) => { const rect=event.currentTarget.getBoundingClientRect(); setTime(Math.max(0,(event.clientX-rect.left)/pixelsPerSecond)); }}>{Array.from({length:Math.floor(Math.max(20,totalDuration)/5)+1},(_,index) => <span key={index} style={{left:index*5*pixelsPerSecond}}>{formatTime(index*5).slice(3,8)}</span>)}</div></div>{project.tracks.map((track) => <div className={`track ${track.locked ? "locked" : ""}`} style={{gridTemplateColumns:`190px ${timelineWidth}px`}} key={track.id}><div className="track-label"><strong>{track.name}</strong><div><button aria-pressed={track.kind === "audio" ? track.muted : track.hidden} onClick={() => commit(updateTrack(project, track.id, track.kind === "audio" ? {muted:!track.muted} : {hidden:!track.hidden}))} aria-label={`${track.kind === "audio" ? "Mute" : "Hide"} ${track.name}`}>{track.kind === "audio" ? (track.muted ? "M" : "♫") : (track.hidden ? "○" : "◉")}</button><button aria-pressed={track.locked} onClick={() => commit(updateTrack(project, track.id, {locked:!track.locked}))} aria-label={`Lock ${track.name}`}>{track.locked ? "▣" : "⌑"}</button></div></div><div className="track-lane" onClick={(event) => { if (event.target !== event.currentTarget) return; const rect=event.currentTarget.getBoundingClientRect(); setTime(Math.max(0,(event.clientX-rect.left)/pixelsPerSecond)); }}><div className="playhead" style={{left:`${time*pixelsPerSecond}px`}} />{track.clips.map((clip) => { const asset = project.assets.find((item) => item.id === clip.assetId); return <button key={clip.id} className={`timeline-clip ${clip.kind} ${clip.id === selectedClipId ? "selected" : ""}`} style={{left:`${clip.start*pixelsPerSecond}px`,width:`${Math.max(24,clip.duration*pixelsPerSecond)}px`}} onClick={(event) => { event.stopPropagation(); setSelectedAssetId(clip.assetId); setSelectedClipId(clip.id); setTime(clip.start); }} disabled={track.locked} title={`${clip.name}, ${clip.duration.toFixed(1)} seconds`}>{asset?.thumbnail && <img src={asset.thumbnail} alt="" />}<span>{clip.name}</span></button>; })}</div></div>)}</section>
    </main>
    <footer className="statusbar"><span>{status}</span><span>{savedAt ? `Saved ${savedAt}` : "Saving locally…"}</span><span className="status-right">Schema v{project.version} · Offline-ready</span></footer>
    <input ref={fileInput} type="file" hidden accept=".json,.videosplat.json,application/json" onChange={(event) => importProject(event.target.files?.[0])} />
    <input ref={mediaInput} type="file" hidden multiple accept="video/*,audio/*,image/*" onChange={(event) => event.target.files && addFiles(event.target.files)} />
    {dialog && <div className="backdrop" onMouseDown={() => setDialog(null)}><section className={`dialog ${dialog === "optimizer" ? "optimizer-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby={dialog === "optimizer" ? "optimizer-title" : "dialog-title"} onMouseDown={(event) => event.stopPropagation()}>
      {dialog !== "optimizer" && <button className="dialog-close" onClick={() => setDialog(null)} aria-label="Close">×</button>}
      {dialog === "optimizer" && <OptimizerDialog onClose={() => setDialog(null)} onAdd={async (file) => addFiles([file])} onStatus={setStatus} />}
      {dialog === "projects" && <><h2 id="dialog-title">Open a local project</h2><button className="primary wide" onClick={() => fileInput.current?.click()}>Open .videosplat.json file</button><p className="hint">Portable project files contain edit instructions, not the source media. Media stored by this browser reconnects automatically; otherwise import the original files again.</p><h3>Autosaved projects</h3>{recent.length ? <ul className="recent-list">{recent.map((item) => <li key={item.id}><button onClick={() => openRecent(item)}><strong>{item.name}</strong><small>{new Date(item.updatedAt).toLocaleString()} · {item.assets.length} media</small></button><button className="danger" aria-label={`Delete ${item.name}`} onClick={async () => { await deleteProject(item.id); refreshProjects(); }}>Delete</button></li>)}</ul> : <p>No autosaved projects yet.</p>}</>}
      {dialog === "privacy" && <><h2 id="dialog-title">Privacy & device storage</h2><p className="lead">Core editing is local. VideoSplat does not require an account and does not include analytics, advertising, tracking, or remote media processing.</p><div className="privacy-grid"><div><strong>Network</strong><span>Same-origin app files only</span></div><div><strong>Permissions</strong><span>File access only after selection</span></div><div><strong>Storage used</strong><span>{storage ? formatBytes(storage.usage) : "Unavailable"}</span></div><div><strong>Storage quota</strong><span>{storage ? formatBytes(storage.quota) : "Unavailable"}</span></div></div><h3>Browser capabilities</h3><ul className="capabilities">{capabilities.map((capability) => <li key={capability.name}><span className={capability.available ? "ok" : "warn"}>{capability.available ? "✓" : "–"}</span><span><strong>{capability.name}</strong><small>{capability.detail}</small></span></li>)}</ul><button className="danger wide" onClick={async () => { if (confirm("Delete every autosaved VideoSplat project and stored media file from this browser? Download copies first if needed.")) { await clearAllLocalData(); newProject(); setDialog(null); setStatus("All local VideoSplat projects and media deleted"); } }}>Clear all local project data and media</button></>}
      {dialog === "shortcuts" && <><h2 id="dialog-title">Keyboard shortcuts</h2><dl className="shortcuts"><div><dt>Save project copy</dt><dd>Ctrl/⌘ S</dd></div><div><dt>Undo</dt><dd>Ctrl/⌘ Z</dd></div><div><dt>Redo</dt><dd>Ctrl/⌘ Shift Z</dd></div><div><dt>Split selected clip</dt><dd>S</dd></div><div><dt>Delete selected clip</dt><dd>Delete</dd></div></dl></>}
    </section></div>}
  </div>;
}
