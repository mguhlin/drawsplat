import type { VideoSplatProject } from "../domain/project";

const DATABASE = "videosplat-local";
const STORE = "projects";
const MEDIA_STORE = "media";
const DB_VERSION = 2;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
      if (!request.result.objectStoreNames.contains(MEDIA_STORE)) request.result.createObjectStore(MEDIA_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
  });
}

const transaction = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local storage operation failed."));
    tx.oncomplete = () => database.close();
  });
};

export const saveProject = (project: VideoSplatProject) => transaction("readwrite", (store) => store.put(project));
export const loadProject = (projectId: string) => transaction<VideoSplatProject | undefined>("readonly", (store) => store.get(projectId));
export const listProjects = () => transaction<VideoSplatProject[]>("readonly", (store) => store.getAll());
export const deleteProject = (projectId: string) => transaction("readwrite", (store) => store.delete(projectId));
export const clearProjects = async () => { const database = await openDatabase(); await new Promise<void>((resolve, reject) => { const tx = database.transaction(STORE, "readwrite"); tx.objectStore(STORE).clear(); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); database.close(); };

interface StoredMediaBytes { format: "videosplat-media-bytes"; bytes: ArrayBuffer; type: string }

export async function saveMedia(assetId: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  const write = (value: Blob | StoredMediaBytes) => new Promise<void>((resolve, reject) => {
    const tx = database.transaction(MEDIA_STORE, "readwrite");
    const request = tx.objectStore(MEDIA_STORE).put(value, assetId);
    let failure: DOMException | null = null;
    request.onerror = () => { failure = request.error; };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(failure ?? tx.error ?? new Error("Could not store media locally."));
  });
  try {
    try { await write(blob); }
    catch (error) {
      // Some WebKit environments cannot serialize Blob/File into IndexedDB.
      // Keep the existing Blob representation when supported, and never treat
      // quota failures as a reason to allocate another full copy of the file.
      if (!(error instanceof DOMException) || !["UnknownError", "DataCloneError"].includes(error.name)) throw error;
      await write({ format: "videosplat-media-bytes", bytes: await blob.arrayBuffer(), type: blob.type });
    }
  } finally { database.close(); }
}

export async function loadMedia(assetId: string): Promise<Blob | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(MEDIA_STORE, "readonly");
    const request = tx.objectStore(MEDIA_STORE).get(assetId);
    request.onsuccess = () => {
      const value = request.result as Blob | StoredMediaBytes | undefined;
      resolve(value && !(value instanceof Blob) && value.format === "videosplat-media-bytes"
        ? new Blob([value.bytes], { type: value.type }) : value as Blob | undefined);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => database.close();
  });
}

export async function deleteMedia(assetId: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(MEDIA_STORE, "readwrite");
    tx.objectStore(MEDIA_STORE).delete(assetId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  database.close();
}

export async function clearAllLocalData(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction([STORE, MEDIA_STORE], "readwrite");
    tx.objectStore(STORE).clear();
    tx.objectStore(MEDIA_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  database.close();
}
