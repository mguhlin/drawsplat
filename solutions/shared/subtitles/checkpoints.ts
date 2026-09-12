import { getWhisperModel, type WhisperModelId } from './models';
import { validateCues, type Cue } from './core';
export interface Checkpoint {
  key: string; cues: Cue[]; nextSample: number; totalSamples: number; complete: boolean; updatedAt: number;
}
const DB_NAME = 'splat-transcription-progress-v1';
const STORE = 'checkpoints';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Saved progress is unavailable in this browser.'));
  });
}
export async function readCheckpoint(key: string, totalSamples: number): Promise<Checkpoint | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get(key);
      request.onsuccess = () => {
        const value = request.result as Checkpoint | undefined;
        if (!value || value.totalSamples !== totalSamples || !Number.isInteger(value.nextSample) || value.nextSample < 0 || value.nextSample > totalSamples || value.updatedAt < Date.now() - MAX_AGE || (value.complete && value.nextSample !== totalSamples)) return resolve(undefined);
        try { if (value.cues.length) validateCues(value.cues); } catch { return resolve(undefined); }
        resolve(value);
      };
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
export async function saveCheckpoint(value: Checkpoint): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.put(value);
      // Retain a small local history, not an unlimited transcript archive.
      const request = store.getAll();
      request.onsuccess = () => {
        const saved = (request.result as Checkpoint[]).sort((a, b) => b.updatedAt - a.updatedAt);
        saved.forEach((entry, i) => { if (i >= 20 || entry.updatedAt < Date.now() - MAX_AGE) store.delete(entry.key); });
      };
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function deleteCheckpoint(key: string): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
/** Hash all bytes in bounded chunks; names/mtime alone can match different recordings. */
export async function fingerprint(blob: Blob, start: number, duration: number, signal: AbortSignal, model: WhisperModelId = 'tiny'): Promise<string> {
  const hashes: Uint8Array[] = [];
  for (let offset = 0; offset < blob.size; offset += 1024 * 1024) {
    signal.throwIfAborted();
    const bytes = await blob.slice(offset, offset + 1024 * 1024).arrayBuffer();
    hashes.push(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
  }
  signal.throwIfAborted();
  const meta = new TextEncoder().encode(`${getWhisperModel(model).checkpointNamespace}:${blob.size}:${start}:${duration}:`);
  const joined = new Uint8Array(meta.length + hashes.length * 32); joined.set(meta);
  hashes.forEach((hash, index) => joined.set(hash, meta.length + index * 32));
  const digest = await crypto.subtle.digest('SHA-256', joined);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
