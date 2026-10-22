// SPDX-License-Identifier: AGPL-3.0-or-later
// Reusable worker client for editors embedding the BackdropSplat engine.
import { validateDimensions } from './pixels.mjs';
export function createBackgroundProcessor() {
  let worker, active, serial = 0;
  const allowed = () => globalThis.SplatPrivacy?.getState().optionalConnections !== false;
  function cancel(message = 'Processing cancelled. Original layers are unchanged.') {
    worker?.terminate(); worker = null;
    if (active) { const task = active; active = null; clearInterval(task.watch); task.reject(new Error(message)); }
  }
  function process(source, options, onProgress = () => {}) {
    if (active) return Promise.reject(new Error('Wait for the current image to finish.'));
    validateDimensions(source.width, source.height);
    if (options.mode === 'photo' && !allowed()) return Promise.reject(new Error('Optional connections are off. Enable them in Privacy for photo model downloads, or use White / Color locally.'));
    if (!worker) {
      worker = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (!active || data.id !== active.id) return;
        if (data.type === 'progress') { active.onProgress(data.text); return; }
        const task = active; active = null; clearInterval(task.watch);
        if (data.type === 'error') task.reject(new Error(data.message));
        else {
          const canvas = document.createElement('canvas'); canvas.width = data.width; canvas.height = data.height;
          canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.pixels), data.width, data.height), 0, 0);
          task.resolve({ canvas, note: data.note, usedModel: data.usedModel });
        }
      };
      worker.onerror = event => { event.preventDefault(); cancel('The background engine could not start. Reload and try again.'); };
    }
    const pixels = source.getContext('2d').getImageData(0, 0, source.width, source.height), id = ++serial;
    return new Promise((resolve, reject) => {
      const watch = options.mode === 'photo' ? setInterval(() => { if (!allowed()) cancel('Optional connections were turned off. Photo processing stopped.'); }, 250) : null;
      active = { id, resolve, reject, onProgress, watch };
      try { worker.postMessage({ id, width: source.width, height: source.height, pixels: pixels.data.buffer, options, allowRemote: allowed() }, [pixels.data.buffer]); }
      catch (error) { cancel(error.message); }
    });
  }
  return { process, cancel, dispose: cancel };
}
