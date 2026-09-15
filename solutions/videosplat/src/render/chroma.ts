export interface ChromaSettings { enabled: boolean; color: string; tolerance: number; softness: number; spill: boolean }
export const defaultChroma: ChromaSettings = { enabled: false, color: '#00ff00', tolerance: 45, softness: 25, spill: false };
const bounded = (v: unknown, fallback: number, max: number) => Number.isFinite(Number(v)) ? Math.max(0, Math.min(max, Number(v))) : fallback;
export function chromaSettings(p: Record<string, unknown>): ChromaSettings {
  return { enabled: p.chromaEnabled === true, color: /^#[\da-f]{6}$/i.test(String(p.chromaColor)) ? String(p.chromaColor) : defaultChroma.color, tolerance: bounded(p.chromaTolerance ?? 45, 45, 255), softness: bounded(p.chromaSoftness ?? 25, 25, 100), spill: p.chromaSpill === true };
}
export function chromaProperties(s: ChromaSettings) { return { chromaEnabled: s.enabled, chromaColor: s.color, chromaTolerance: s.tolerance, chromaSoftness: s.softness, chromaSpill: s.spill }; }
export function keyPixels(data: Uint8ClampedArray, settings: ChromaSettings) {
  if (!settings.enabled) return;
  const target = settings.color.slice(1).match(/../g)!.map(v => parseInt(v, 16));
  const channel = target[1] > target[0] && target[1] > target[2] ? 1 : target[2] > target[0] && target[2] > target[1] ? 2 : -1;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const r = data[i] - target[0], g = data[i + 1] - target[1], b = data[i + 2] - target[2];
    const distance = Math.sqrt((r*r + g*g + b*b) / 3);
    const keep = distance <= settings.tolerance ? 0 : settings.softness ? Math.min(1, (distance - settings.tolerance) / settings.softness) : 1;
    data[i + 3] = Math.round(data[i + 3] * keep);
    if (settings.spill && channel >= 0) data[i + channel] = Math.min(data[i + channel], Math.max(data[i], data[i + (channel === 1 ? 2 : 1)]));
  }
}
export function createChromaRenderer() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  return (source: CanvasImageSource, width: number, height: number, settings: ChromaSettings) => {
    width = Math.max(1, Math.round(width)); height = Math.max(1, Math.round(height));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.clearRect(0, 0, width, height); ctx.drawImage(source, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height); keyPixels(pixels.data, settings); ctx.putImageData(pixels, 0, 0);
    return canvas;
  };
}
