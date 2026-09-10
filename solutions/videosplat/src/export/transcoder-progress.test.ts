import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ instances: [] as any[], hold: false }));
vi.mock('@ffmpeg/ffmpeg', () => ({ FFmpeg: class {
  listeners = new Set<(event: {progress:number;time:number}) => void>(); reject?: (error: Error) => void;
  constructor() { state.instances.push(this); }
  on(_event: string, callback: any) { this.listeners.add(callback); }
  off(_event: string, callback: any) { this.listeners.delete(callback); }
  async load() {} async writeFile() {} async deleteFile() {}
  async readFile() { return new Uint8Array([1,2,3]); }
  async exec() { for(const callback of this.listeners) callback({progress:-50, time:5000000}); if(state.hold) return new Promise<number>((_,reject)=>{this.reject=reject;}); return 0; }
  terminate() { this.reject?.(new Error('terminated')); }
} }));
import { transcodeExport } from './transcoder';
afterEach(() => vi.unstubAllGlobals());
it('uses encoded time, routes repeated exports to fresh callbacks, and cancels conversion', async () => {
  vi.stubGlobal('fetch', vi.fn(async()=>new Response(new Uint8Array([0,0x61,0x73,0x6d]))));
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:test' });
  const source = { arrayBuffer: async () => new ArrayBuffer(4) } as Blob;
  const first = vi.fn(), second = vi.fn();
  await transcodeExport(source, 'mp4', first, 10);
  expect(first.mock.calls.map(args=>args[0])).toEqual([.5,1]);
  await transcodeExport(source, 'mp4', second, 10);
  expect(first).toHaveBeenCalledTimes(2);
  expect(second.mock.calls.map(args=>args[0])).toEqual([.5,1]);
  expect(state.instances[0].listeners.size).toBe(0);
  state.hold=true;const controller=new AbortController();
  const promise=transcodeExport(source, 'mp4', vi.fn(), 10, controller.signal);
  const rejection=expect(promise).rejects.toMatchObject({ name:'AbortError' });
  await vi.waitFor(()=>expect(state.instances[0].reject).toBeDefined());
  controller.abort(); await rejection;
  expect(state.instances[0].listeners.size).toBe(0);
  state.hold=false;
  await transcodeExport(source, 'mp4', vi.fn(), 10);
  expect(state.instances).toHaveLength(2);
});
