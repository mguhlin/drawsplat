export interface Capability { name: string; available: boolean; detail: string }
export const getCapabilities = (): Capability[] => [
  { name: "WebCodecs", available: "VideoDecoder" in window, detail: "Fast frame-level media decoding" },
  { name: "WebGPU", available: "gpu" in navigator, detail: "Accelerated effects and local AI" },
  { name: "IndexedDB", available: "indexedDB" in window, detail: "Local project autosave" },
  { name: "Origin-private files", available: "storage" in navigator && "getDirectory" in navigator.storage, detail: "Large local proxy storage" },
  { name: "Offline app", available: "serviceWorker" in navigator, detail: "Reload after the first visit without a network" },
  { name: "Cross-origin isolation", available: window.crossOriginIsolated, detail: "High-performance WASM workers" },
];

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
