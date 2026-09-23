export type Acceleration = 'auto' | 'cpu';
const KEY = 'splat.transcription.acceleration';
export function preferredAcceleration(): Acceleration {
  try { return localStorage.getItem(KEY) === 'cpu' ? 'cpu' : 'auto'; } catch { return 'auto'; }
}
export function rememberAcceleration(value: Acceleration) {
  try { localStorage.setItem(KEY, value); } catch { /* Session preference still works. */ }
}
// Probe what this browser can actually use, rather than inferring from a GPU brand.
export async function gpuPrecision(): Promise<'fp16' | 'fp32' | undefined> {
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter(options: { powerPreference: string }): Promise<{ features?: { has(name: string): boolean }; isFallbackAdapter?: boolean; info?: { isFallbackAdapter?: boolean; architecture?: string; description?: string } } | null> } }).gpu;
    const adapter = await gpu?.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter || adapter.isFallbackAdapter || adapter.info?.isFallbackAdapter) return undefined;
    // Software GPU emulation can be dramatically slower than the CPU speech engine.
    if (/swiftshader|llvmpipe|software rasterizer/i.test(`${adapter.info?.architecture ?? ''} ${adapter.info?.description ?? ''}`)) return undefined;
    return adapter.features?.has('shader-f16') ? 'fp16' : 'fp32';
  } catch { return undefined; }
}
