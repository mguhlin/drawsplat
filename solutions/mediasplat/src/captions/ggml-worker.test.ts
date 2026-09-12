import { afterEach, expect, it, vi } from 'vitest';
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('../../node_modules/@splat/local-subtitles/ggml/runtime.js', () => ({ default: create }));
vi.mock('../../node_modules/@splat/local-subtitles/ggml/splat-whisper.wasm?url', () => ({ default: 'local-engine.wasm' }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); vi.resetModules(); });
it('mounts a model once, retains it across windows, and handles WASM addresses above 2 GiB', async () => {
  const runtime = {
    FS: { mkdir: vi.fn(), mount: vi.fn(), unmount: vi.fn() },
    WORKERFS: { stream_ops: { read: vi.fn() }, reader: { readAsArrayBuffer: vi.fn() } },
    HEAPF32: { set: vi.fn() }, UTF8ToString: vi.fn().mockReturnValue('Hello there.'),
    _malloc: vi.fn().mockReturnValue(-2147483648), _free: vi.fn(),
    _splat_init: vi.fn().mockReturnValue(1), _splat_transcribe: vi.fn().mockReturnValue(0),
    _splat_count: () => 1, _splat_start: () => 0, _splat_end: () => 1,
    _splat_text: () => -2147483644, _splat_free: vi.fn(),
  };
  create.mockResolvedValue(runtime);
  const worker = { onmessage: undefined as unknown as (event: unknown) => Promise<void>, postMessage: vi.fn() };
  vi.stubGlobal('self', worker);
  await import('../../node_modules/@splat/local-subtitles/ggml-worker');
  const audio = new Float32Array(16000), modelFile = new Blob(['model']);
  await worker.onmessage({ data: { audio, modelFile } });
  await worker.onmessage({ data: { audio } });
  expect(create).toHaveBeenCalledTimes(1);
  expect(runtime.FS.mount).toHaveBeenCalledWith(runtime.WORKERFS, { blobs: [{ name: 'model.bin', data: modelFile }] }, '/model');
  expect(runtime.FS.unmount).toHaveBeenCalledWith('/model');
  expect(runtime._splat_init).toHaveBeenCalledTimes(1);
  expect(runtime.HEAPF32.set).toHaveBeenCalledWith(audio, 536870912);
  expect(runtime.UTF8ToString).toHaveBeenCalledWith(2147483652);
  expect(runtime._free).toHaveBeenCalledWith(2147483648);
  expect(worker.postMessage.mock.calls.filter(([message]) => message.type === 'complete')).toHaveLength(2);
  runtime._splat_transcribe.mockReturnValue(1);
  await worker.onmessage({ data: { audio } });
  expect(runtime._splat_free).toHaveBeenCalledOnce();
  expect(worker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'error' }));
});
