import { WHISPER_MODELS, preferredModel, rememberModel, getWhisperModel, type SpeechModelId } from './models';
import { LOCAL_MODEL_HELP } from './local-model';
import { useEffect, useRef, useState } from 'react';
import { transcribe, type Source, type TranscriptionProgress } from './client';
import { cuesToSrt, validateCues, type Cue } from './core';
import './styles.css';
export type { Source, Cue };
export function SubtitleGenerator({ source, onUse, autoStart = false, actionLabel = 'Use these subtitles', downloadTranscript = false }: {
  source: Source; onUse?: (cues: Cue[]) => void | Promise<void>; autoStart?: boolean; actionLabel?: string; downloadTranscript?: boolean;
}) {
  const [model, setModel] = useState<SpeechModelId>(preferredModel);
  const selectedModel = model === 'local' ? null : getWhisperModel(model);
  const [modelFile, setModelFile] = useState<File | undefined>();
  const [cues, setCues] = useState<Cue[]>([]);
  const [partial, setPartial] = useState<TranscriptionProgress | null>(null);
  const [page, setPage] = useState(0);
  const complete = partial?.complete ?? false;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const started = useRef(false);
  const generate = async (restart = false) => {
    if (controller.current) return;
    const job = new AbortController(); controller.current = job;
    setBusy(true); setError(''); setPage(0);
    try {
      const result = await transcribe(source, job.signal, setStatus, { model, modelFile, restart, onPartial: progress => { if (!job.signal.aborted) { setPartial(progress); setCues(progress.cues); } } });
      if (!job.signal.aborted) { setCues(result); setStatus(`${result.length} captions ready. Review the words and timing before using them.`); }
    } catch (error) {
      if (!job.signal.aborted) { setStatus(''); setError(error instanceof Error ? error.message : 'Subtitle generation failed.'); }
    } finally { if (controller.current === job) { controller.current = null; setBusy(false); } }
  };
  const cancel = () => { controller.current?.abort(); controller.current = null; setBusy(false); setStatus('Subtitle generation cancelled. Completed sections can be resumed.'); };
  useEffect(() => { const timer = setTimeout(() => { if (autoStart && !started.current) { started.current = true; void generate(); } }, 0); return () => { clearTimeout(timer); controller.current?.abort(); controller.current = null; }; }, []);
  const attempt = async (action: () => void | Promise<void>) => { setError(''); try { validateCues(cues); await action(); } catch (error) { setError(error instanceof Error ? error.message : 'Could not use subtitles.'); } };
  useEffect(() => { setPage(current => Math.min(current, Math.max(0, Math.ceil(cues.length / 50) - 1))); }, [cues.length]);
  const edit = (index: number, patch: Partial<Cue>) => setCues(current => current.map((cue, i) => i === index ? { ...cue, ...patch } : cue));
  return <section className="subtitle-generator" aria-label="Automatic subtitles">
    <h3>Generate subtitles</h3>
    <p>Transcribe English speech in <strong>{source.name}</strong> on this device. {selectedModel ? <>First use downloads the selected model from Hugging Face (about {selectedModel.downloadMB} MB), then caches it when browser storage allows.</> : <>Your selected model is read from this device. Only the app’s bundled engine needs to load.</>} Your audio and video are never uploaded.</p>
    <p>Up to 120 minutes (2 hours) per clip and 512 MB per file. Long clips can take several minutes. Keep this tab open and review automatic captions for mistakes. Completed sections are saved on this device when storage allows. Select the same file and generate again to resume after an interruption. Reviewed edits are only kept in your downloads.</p>
    <label className="subtitle-model">English speech model<select aria-describedby="subtitle-model-help" value={model} disabled={busy} onChange={event => {
      const next = event.target.value === 'local' ? 'local' : getWhisperModel(event.target.value).id;
      setModel(next); setModelFile(undefined); rememberModel(next); setCues([]); setPartial(null); setPage(0); setError(''); setStatus('Model changed. Generate to start or restore progress for this model.');
    }}>{Object.values(WHISPER_MODELS).map(option => <option key={option.id} value={option.id}>{option.label}</option>)}<option value="local">Use local GGML model (.bin)…</option></select></label>
    <p id="subtitle-model-help">{selectedModel?.description ?? LOCAL_MODEL_HELP} Progress is saved separately for each model. Select Tiny to resume work created before model selection was added.</p>
    {model === 'local' && <label className="subtitle-model">Local Whisper model (.bin)<input type="file" accept=".bin" disabled={busy} onChange={event => {
      setModelFile(event.target.files?.[0]); setCues([]); setPartial(null); setPage(0); setError(''); setStatus('Local model changed. Generate to start or restore its saved progress.');
    }}/></label>}
    <div className="subtitle-generator-actions">{busy ? <button type="button" onClick={cancel}>Cancel generation</button> : <button type="button" disabled={model === 'local' && !modelFile} onClick={() => void generate()}>{cues.length ? 'Resume / restore subtitles' : 'Generate subtitles'}</button>}{!busy && cues.length > 0 && <button type="button" onClick={() => void generate(true)}>Start over</button>}</div>
    <p role="status" aria-live="polite">{status}</p>
    {busy && <progress aria-label="Subtitle generation progress" max={partial?.totalSeconds || 1} value={partial?.processedSeconds || 0} />}
    {partial && <p>{complete ? 'Complete transcript' : 'Partial transcript'} · {(partial.processedSeconds / 60).toFixed(1)} of {(partial.totalSeconds / 60).toFixed(1)} minutes processed. {partial.saved ? 'Generated progress is saved locally. Resume is available for 30 days (20 recent recordings).' : 'Saving is unavailable. Download partial results before closing this tab.'}</p>}
    {error && <p role="alert">{error}</p>}
    {cues.length > 0 && <>
      <div className="subtitle-cue-list">{cues.slice(page * 50, (page + 1) * 50).map((cue, offset) => { const index = page * 50 + offset; return <div className="subtitle-cue" key={index}>
        <label>Start (seconds)<input aria-label={`Caption ${index + 1} start`} type="number" min="0" step="0.01" disabled={busy} value={Number.isNaN(cue.start) ? '' : cue.start} onChange={e => edit(index, { start: e.target.valueAsNumber })}/></label>
        <label>End (seconds)<input aria-label={`Caption ${index + 1} end`} type="number" min="0" step="0.01" disabled={busy} value={Number.isNaN(cue.end) ? '' : cue.end} onChange={e => edit(index, { end: e.target.valueAsNumber })}/></label>
        <label className="subtitle-cue-text">Caption {index + 1}<textarea aria-label={`Caption ${index + 1} text`} disabled={busy} value={cue.text} onChange={e => edit(index, { text: e.target.value })}/></label>
        <button type="button" disabled={busy} onClick={() => setCues(current => current.filter((_, i) => i !== index))} aria-label={`Delete caption ${index + 1}`}>Delete</button>
      </div>; })}</div>
      {cues.length > 50 && <div className="subtitle-generator-actions"><button disabled={page === 0} onClick={() => setPage(current => current - 1)}>Previous captions</button><span>Page {page + 1} of {Math.ceil(cues.length / 50)}</span><button disabled={(page + 1) * 50 >= cues.length} onClick={() => setPage(current => current + 1)}>Next captions</button></div>}
      <div className="subtitle-generator-actions">{onUse && <button type="button" disabled={busy || !complete} onClick={() => void attempt(() => onUse(cues))}>{actionLabel}</button>}<button type="button" onClick={() => void attempt(() => {
        const url = URL.createObjectURL(new Blob([cuesToSrt(cues)], { type: 'application/x-subrip' }));
        const link = document.createElement('a'); link.href = url; link.download = `${source.name.replace(/\.[^.]+$/, '') || 'subtitles'}${complete ? '' : '.partial'}.srt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      })}>Download SRT</button>{downloadTranscript && <button type="button" onClick={() => void attempt(() => {
        const url = URL.createObjectURL(new Blob([cues.map(cue => cue.text.trim()).join('\n\n') + '\n'], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = `${source.name.replace(/\.[^.]+$/, '') || 'transcript'}${complete ? '' : '.partial'}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      const controls = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)') ?? [])];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}><button aria-label="Close subtitle generation" onClick={onClose}>×</button><h2>Automatic subtitles</h2>{description && <p>{description}</p>}<SubtitleGenerator source={source} autoStart={autoStart} onUse={onUse} actionLabel={actionLabel}/></section></div>;
}
