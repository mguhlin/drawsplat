import { useEffect, useRef, useState } from 'react';
import { transcribe, type Source } from './client';
import { cuesToSrt, validateCues, type Cue } from './core';
import './styles.css';
export type { Source, Cue };
export function SubtitleGenerator({ source, onUse, autoStart = false, actionLabel = 'Use these subtitles', downloadTranscript = false }: {
  source: Source; onUse?: (cues: Cue[]) => void | Promise<void>; autoStart?: boolean; actionLabel?: string; downloadTranscript?: boolean;
}) {
  const [cues, setCues] = useState<Cue[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const started = useRef(false);
  const generate = async () => {
    if (controller.current) return;
    const job = new AbortController(); controller.current = job;
    setBusy(true); setError('');
    try {
      const result = await transcribe(source, job.signal, setStatus);
      if (!job.signal.aborted) { setCues(result); setStatus(`${result.length} captions ready. Review the words and timing before using them.`); }
    } catch (error) {
      if (!job.signal.aborted) { setStatus(''); setError(error instanceof Error ? error.message : 'Subtitle generation failed.'); }
    } finally { if (controller.current === job) { controller.current = null; setBusy(false); } }
  };
  const cancel = () => { controller.current?.abort(); controller.current = null; setBusy(false); setStatus('Subtitle generation cancelled.'); };
  useEffect(() => { const timer = setTimeout(() => { if (autoStart && !started.current) { started.current = true; void generate(); } }, 0); return () => { clearTimeout(timer); controller.current?.abort(); controller.current = null; }; }, []);
  const attempt = async (action: () => void | Promise<void>) => { setError(''); try { validateCues(cues); await action(); } catch (error) { setError(error instanceof Error ? error.message : 'Could not use subtitles.'); } };
  const edit = (index: number, patch: Partial<Cue>) => setCues(current => current.map((cue, i) => i === index ? { ...cue, ...patch } : cue));
  return <section className="subtitle-generator" aria-label="Automatic subtitles">
    <h3>Generate subtitles</h3>
    <p>Transcribe English speech in <strong>{source.name}</strong> on this device. First use downloads a speech model from Hugging Face (about 42 MB), then caches it when browser storage allows. Your audio and video are never uploaded.</p>
    <p>Up to 30 minutes per clip and 512 MB per file. Long clips can take several minutes. Keep this tab open and review automatic captions for mistakes.</p>
    <div className="subtitle-generator-actions">{busy ? <button type="button" onClick={cancel}>Cancel generation</button> : <button type="button" onClick={() => void generate()}>{cues.length ? 'Generate again' : 'Generate subtitles'}</button>}</div>
    <p role="status" aria-live="polite">{status}</p>
    {busy && <progress aria-label="Subtitle generation progress" />}
    {error && <p role="alert">{error}</p>}
    {cues.length > 0 && <>
      <div className="subtitle-cue-list">{cues.map((cue, index) => <div className="subtitle-cue" key={index}>
        <label>Start (seconds)<input aria-label={`Caption ${index + 1} start`} type="number" min="0" step="0.01" disabled={busy} value={Number.isNaN(cue.start) ? '' : cue.start} onChange={e => edit(index, { start: e.target.valueAsNumber })}/></label>
        <label>End (seconds)<input aria-label={`Caption ${index + 1} end`} type="number" min="0" step="0.01" disabled={busy} value={Number.isNaN(cue.end) ? '' : cue.end} onChange={e => edit(index, { end: e.target.valueAsNumber })}/></label>
        <label className="subtitle-cue-text">Caption {index + 1}<textarea aria-label={`Caption ${index + 1} text`} disabled={busy} value={cue.text} onChange={e => edit(index, { text: e.target.value })}/></label>
        <button type="button" disabled={busy} onClick={() => setCues(current => current.filter((_, i) => i !== index))} aria-label={`Delete caption ${index + 1}`}>Delete</button>
      </div>)}</div>
      <div className="subtitle-generator-actions">{onUse && <button type="button" disabled={busy} onClick={() => void attempt(() => onUse(cues))}>{actionLabel}</button>}<button type="button" disabled={busy} onClick={() => void attempt(() => {
        const url = URL.createObjectURL(new Blob([cuesToSrt(cues)], { type: 'application/x-subrip' }));
        const link = document.createElement('a'); link.href = url; link.download = `${source.name.replace(/\.[^.]+$/, '') || 'subtitles'}.srt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      })}>Download SRT</button>{downloadTranscript && <button type="button" disabled={busy} onClick={() => void attempt(() => {
        const url = URL.createObjectURL(new Blob([cues.map(cue => cue.text.trim()).join('\n\n') + '\n'], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = `${source.name.replace(/\.[^.]+$/, '') || 'transcript'}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      })}>Download transcript (.txt)</button>}</div>
    </>}
  </section>;
}

export function SubtitleGenerationDialog({ source, autoStart, onUse, onClose, actionLabel, description }: {
  source: Source; autoStart?: boolean; onUse: (cues: Cue[]) => void | Promise<void>; onClose: () => void; actionLabel?: string; description?: string;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; panel.current?.querySelector('button')?.focus(); return () => previous?.focus(); }, []);
  return <div className="subtitle-generation-backdrop"><section className="subtitle-generation-dialog" ref={panel} role="dialog" aria-modal="true" aria-label="Generate subtitles" onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape') onClose();
    if (event.key === 'Tab') {
      const controls = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled)') ?? [])];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}><button aria-label="Close subtitle generation" onClick={onClose}>×</button><h2>Automatic subtitles</h2>{description && <p>{description}</p>}<SubtitleGenerator source={source} autoStart={autoStart} onUse={onUse} actionLabel={actionLabel}/></section></div>;
}
