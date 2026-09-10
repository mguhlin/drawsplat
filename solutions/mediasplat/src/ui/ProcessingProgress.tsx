import { useEffect, useRef, useState } from "react";
export const elapsedLabel = (seconds: number) => {
  const value = Math.max(0, Math.floor(seconds));
  return value >= 3600 ? `${Math.floor(value / 3600)}:${String(Math.floor(value / 60) % 60).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}` : `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
};
export const estimateLabel = (seconds: number) => {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
};
export function ProcessingProgress({ busy, progress, status, estimate = false }: { busy: boolean; progress: number; status: string; estimate?: boolean }) {
  const started = useRef(0), updated = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!busy) return;
    started.current = updated.current = Date.now(); setElapsed(0);
    const timer = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  useEffect(() => { if (busy) updated.current = Date.now(); }, [progress, busy]);
  const fraction = Number.isFinite(progress) ? Math.max(0, Math.min(busy ? .99 : 1, progress)) : 0;
  const percentage = Math.floor(fraction * 100);
  const waiting = busy && elapsed > 15 && Date.now() - updated.current > 15000;
  const remaining = estimate && busy && !waiting && elapsed >= 5 && fraction >= .02 && fraction < .99 ? elapsed * (1 - fraction) / fraction : undefined;
  return <div className="processing-progress" aria-busy={busy}>
    <div className="processing-heading"><span role="status">{status}</span><strong aria-label="Processing percentage">{percentage}%</strong></div>
    <div className={`processing-meter${busy ? ' is-active' : ''}${busy && !fraction ? ' is-pending' : ''}`} role="progressbar" aria-label="Media processing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
      <div className="processing-fill" style={{ width: `${percentage}%` }}/>{busy && <div className="processing-shimmer"/>}
    </div>
    {(busy || elapsed > 0) && <div className="processing-details"><span>Elapsed {elapsedLabel(elapsed)}</span><span>{waiting ? 'Waiting for the next encoding update…' : remaining !== undefined ? `About ${estimateLabel(remaining)} remaining` : busy ? percentage >= 99 ? 'Finishing the output file…' : 'Calculating time remaining…' : percentage === 100 ? 'Complete' : 'Stopped'}</span>{remaining !== undefined && <span>Estimated total: {estimateLabel(elapsed + remaining)}</span>}</div>}
  </div>;
}
