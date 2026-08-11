import type { AudioProject, AudioSourceRecord, StoredProject } from "./types";

const DB_NAME = "audiosplat";
const DB_VERSION = 1;
const STORE = "workspace";
const TAB_KEY = "audiosplat.workspace-tab";

function workspaceKey(): string {
  let tabId = sessionStorage.getItem(TAB_KEY);
  if (!tabId) {
    tabId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem(TAB_KEY, tabId);
  }
  return `tab:${tabId}`;
}

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export async function saveWorkspace(
  project: AudioProject,
  sources: AudioSourceRecord[],
): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(
      { project, sources } satisfies StoredProject,
      workspaceKey(),
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadWorkspace(): Promise<StoredProject | null> {
  const db = await openDatabase();
  const value = await new Promise<StoredProject | undefined>(
    (resolve, reject) => {
      const request = db
        .transaction(STORE)
        .objectStore(STORE)
        .get(workspaceKey());
      request.onsuccess = () =>
        resolve(request.result as StoredProject | undefined);
      request.onerror = () => reject(request.error);
    },
  );
  db.close();
  return value ?? null;
}

export async function clearWorkspace(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .delete(workspaceKey());
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Invalid embedded audio");
  return response.blob();
}
