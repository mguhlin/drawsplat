// Same-origin, local-only transfer. Keep recordings until the destination has decoded them.
export const MAX_TRANSFER_BYTES = 1024 ** 3;
const DB = 'splat-video-handoff-v1';
async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('recordings', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction(mode, operation) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', mode);
      const request = operation(tx.objectStore('recordings'));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Local video transfer was interrupted.'));
    });
  } finally { db.close(); }
}
export async function saveTransfer(file, preset, original = file) {
  if (!file.size || file.size > MAX_TRANSFER_BYTES) throw new Error('ClipSplat accepts videos up to 1 GB. Download the original and choose a smaller recording.');
  if (!['reel', 'story', 'feed'].includes(preset)) throw new Error('Choose a ClipSplat format.');
  const id = crypto.randomUUID();
  await transaction('readwrite', store => store.put({ id, file, original, preset, createdAt: Date.now() }));
  return id;
}
export async function readTransfer(id) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error('Invalid local video transfer.');
  const item = await transaction('readonly', store => store.get(id));
  if (!item || !(item.file instanceof Blob) || !item.file.size || item.file.size > MAX_TRANSFER_BYTES || !['reel', 'story', 'feed'].includes(item.preset)) {
    throw new Error('This local recording is unavailable. Return to VideoSplat or choose a downloaded video.');
  }
  return item;
}
export async function removeTransfer(id) {
  await transaction('readwrite', store => store.delete(id));
}
