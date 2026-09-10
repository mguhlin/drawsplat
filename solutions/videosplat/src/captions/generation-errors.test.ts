import { afterEach, expect, it, vi } from 'vitest';

const { pipeline } = vi.hoisted(() => ({ pipeline: vi.fn() }));
vi.mock('@huggingface/transformers', () => ({
  env: { backends: { onnx: { wasm: {} } } },
  pipeline,
  TextStreamer: class {},
}));
vi.mock('onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url', () => ({ default: 'test.wasm' }));
vi.mock('onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url', () => ({ default: 'test.mjs' }));

afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); vi.resetModules(); });

async function runWorkerMessages(seconds = 1) {
  const worker = { onmessage: undefined as unknown as (event: unknown) => Promise<void>, postMessage: vi.fn() };
  vi.stubGlobal('self', worker);
  await import('../../node_modules/@splat/local-subtitles/worker');
  await worker.onmessage({ data: { audio: new Float32Array(seconds * 16000).fill(.1) } });
  return worker.postMessage.mock.calls.map(([message]) => message);
}

async function runWorker() { return (await runWorkerMessages()).find(message => message.type === 'error').message as string; }

it('suggests checking the connection only when the model fails to load', async () => {
  pipeline.mockRejectedValue(new Error('Download failed'));
  expect(await runWorker()).toContain('Check your connection');
});

it('explains unrecognized audio without reporting a download failure', async () => {
  const transcriber = Object.assign(vi.fn().mockResolvedValue({ text: '', chunks: [] }), { dispose: vi.fn() });
  pipeline.mockResolvedValue(transcriber);
  const message = await runWorker();
  expect(message).toContain('model loaded');
  expect(message).toContain('voice is audible');
  expect(message).not.toContain('connection');
  expect(transcriber.dispose).toHaveBeenCalled();
});

it('distinguishes recognized words with unusable timestamps from missing speech', async () => {
  pipeline.mockResolvedValue(Object.assign(vi.fn().mockResolvedValue({ text: 'Hello there', chunks: [] }), { dispose: vi.fn() }));
  expect(await runWorker()).toContain('caption timings could not be generated');
});

it('recovers an empty timestamp result with word alignment and preserves zero-duration words', async () => {
  const transcriber = Object.assign(vi.fn()
    .mockResolvedValueOnce({ text: '', chunks: [] })
    .mockResolvedValueOnce({ text: 'I am working.', chunks: [
      { text: ' I', timestamp: [0, 0] },
      { text: ' am', timestamp: [0, .3] },
      { text: ' working.', timestamp: [.3, .9] },
    ] }), { dispose: vi.fn() });
  pipeline.mockResolvedValue(transcriber);
  const messages = await runWorkerMessages();
  expect(messages.find(message => message.type === 'complete').cues).toEqual([{ start: 0, end: .9, text: 'I am working.' }]);
  expect(transcriber.mock.calls[1][1]).toEqual({ return_timestamps: 'word' });
  expect(messages.some(message => message.type === 'error')).toBe(false);
});

it('keeps successful sections and offsets captions recovered in a later section', async () => {
  const transcriber = Object.assign(vi.fn()
    .mockResolvedValueOnce({ text: 'First.', chunks: [{ text: 'First.', timestamp: [0, 2] }] })
    .mockResolvedValueOnce({ text: '', chunks: [] })
    .mockResolvedValueOnce({ text: 'Later.', chunks: [{ text: 'Later.', timestamp: [1, 2] }] }), { dispose: vi.fn() });
  pipeline.mockResolvedValue(transcriber);
  const messages = await runWorkerMessages(26);
  const cues = messages.find(message => message.type === 'complete').cues;
  expect(cues).toHaveLength(2);
  expect(cues[0]).toEqual({ start: 0, end: 2, text: 'First.' });
  expect(cues[1]).toEqual({ start: 21.05, end: 22.05, text: 'Later.' });
  expect(transcriber).toHaveBeenCalledTimes(3);
});
