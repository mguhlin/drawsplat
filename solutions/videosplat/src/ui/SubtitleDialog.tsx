import { useEffect, useRef, useState } from "react";
import { defaultSubtitles, parseSubtitleFile, validateSubtitleOptions, type SubtitleOptions } from "../captions/subtitles";
export function SubtitleDialog({ onImport, onClose }: { onImport: (file: File, options: SubtitleOptions) => Promise<void>; onClose: () => void }) {
 const panel = useRef<HTMLElement>(null);
 useEffect(() => { const previous = document.activeElement as HTMLElement | null; panel.current?.querySelector<HTMLButtonElement>("button")?.focus(); return () => previous?.focus(); }, []);
 const [file, setFile] = useState<File>(); const [options, setOptions] = useState(defaultSubtitles); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
 return <div className="backdrop"><section ref={panel} onKeyDown={event => {
  if (event.key === "Escape") { event.stopPropagation(); if (!busy) onClose(); }
  if (event.key === "Tab") {
   const controls = [...(panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled)") ?? [])];
   const first = controls[0], last = controls.at(-1);
   if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
   else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
 }} role="dialog" aria-modal="true" aria-label="Burn in subtitles" className="dialog"><button disabled={busy} onClick={onClose} aria-label="Close subtitle import">×</button><h2>Burn in subtitles</h2><p>Import timed SRT or VTT captions, preview them on the timeline, then export video with Burn in subtitles enabled. Burned subtitles are permanent in the exported video.</p><fieldset disabled={busy}><label>Subtitle file<input type="file" accept=".srt,.vtt" onChange={e => setFile(e.target.files?.[0])}/></label><div className="optimizer-grid">{(["fontSize", "margin", "outline", "offset"] as const).map(key => <label key={key}>{{fontSize: "Font size (at 1080p)", margin: "Bottom margin (at 1080p)", outline: "Outline width", offset: "Timing offset (seconds; positive = later)"}[key]}<input type="number" step={key === "offset" ? "0.1" : "1"} min={key === "offset" ? -86400 : key === "fontSize" ? 12 : 0} max={key === "offset" ? 86400 : key === "fontSize" ? 120 : key === "outline" ? 10 : 300} value={options[key]} onChange={e => setOptions({...options, [key]: e.target.valueAsNumber})}/></label>)}</div><label><input type="checkbox" checked={options.background} onChange={e => setOptions({...options, background: e.target.checked})}/>Black subtitle background</label><p>Times are relative to the project timeline. Existing captions are kept; remove their track first to replace them.</p><button disabled={!file} onClick={async () => { if (!file) return; setBusy(true); try { validateSubtitleOptions(options); parseSubtitleFile(await file.text(), options.offset); await onImport(file, options); onClose(); } catch (error) { setError(error instanceof Error ? error.message : "Caption import failed"); } finally { setBusy(false); } }}>Add subtitles to timeline</button></fieldset>{error && <p role="alert">{error}</p>}</section></div>;
}
