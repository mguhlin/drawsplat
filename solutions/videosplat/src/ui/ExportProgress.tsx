import { useEffect, useRef, useState } from 'react';
import type { ExportFormat } from '../export/transcoder';
export const clockTime = (seconds: number) => {
  const value = Math.max(0, Math.floor(seconds));
  const tail = `${String(Math.floor(value / 60) % 60).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  return value >= 3600 ? `${Math.floor(value / 3600)}:${tail}` : `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
};
export const estimatedTime = (seconds: number) => {
  if (seconds < 60) return 'less than 1 min';
  const minutes = Math.ceil(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
};
export function exportStage(progress: number, format: ExportFormat) {
  const value = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const conversion = format !== 'webm' && value >= .85;
  return { conversion, fraction: conversion ? (value - .85) / .15 : value / (format === 'webm' ? 1 : .85) };
}
export function ExportProgress({ progress, format, busy, finished }: { progress: number; format: ExportFormat; busy: boolean; finished: boolean }) {
  const { conversion, fraction } = exportStage(progress, format);
  const [now, setNow] = useState(Date.now());
  const started = useRef(now), stageStarted = useRef(now), updated = useRef(now);
  useEffect(() => {
    if (!busy) return;
    started.current = stageStarted.current = updated.current = Date.now(); setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  useEffect(() => { stageStarted.current = updated.current = Date.now(); setNow(Date.now()); }, [conversion]);
  useEffect(() => { if (busy) updated.current = Date.now(); }, [progress, busy]);
  const elapsed = Math.max(0, (now - started.current) / 1000);
  const stageElapsed = Math.max(0, (now - stageStarted.current) / 1000);
  const waiting = busy && now - updated.current > 15000;
  const percentage = finished ? 100 : Math.max(0, Math.min(99, Math.floor(fraction * 100 + 1e-6)));
  const remaining = busy && !waiting && stageElapsed >= 5 && fraction >= .02 && fraction < .99 ? stageElapsed * (1 - fraction) / fraction : undefined;
  const title = finished ? 'Export complete' : conversion ? `Converting to ${format.toUpperCase()} · step 2 of 2` : `Rendering timeline${format === 'webm' ? '' : ' · step 1 of 2'}`;
  return <section className="export-progress" aria-label="Export progress" aria-busy={busy}>
    <div className="export-progress-heading"><span role="status">{title}</span><strong aria-label="Export percentage">{percentage}%</strong></div>
    <div className={`export-progress-meter${busy ? ' is-active' : ''}`} role="progressbar" aria-label={conversion ? 'Conversion progress' : 'Timeline rendering progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
      <div className="export-progress-fill" style={{ width: `${percentage}%` }}/>{busy && <div className="export-progress-shimmer"/>}
    </div>
    <div className="export-progress-details"><span>Elapsed {clockTime(elapsed)}</span><span>{finished ? 'Ready to download' : !busy ? 'Stopped' : waiting ? 'Waiting for the next progress update…' : percentage >= 99 ? 'Finishing the output file…' : remaining !== undefined ? `Estimated remaining: ${estimatedTime(remaining)}` : 'Calculating time remaining…'}</span>{remaining !== undefined && <span>Estimated stage total: {estimatedTime(stageElapsed + remaining)}</span>}</div>
    {busy && format !== 'webm' && <p className="export-progress-note">Estimates cover the current stage. Conversion is timed separately from timeline rendering.</p>}
  </section>;
}
