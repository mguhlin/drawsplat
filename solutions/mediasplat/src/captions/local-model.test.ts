import { afterEach, expect, it, vi } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { validateLocalModel, localModelNamespace } from '../../../shared/subtitles/local-model';
function model(change = 0) {
  const values = [0x67676d6c, 51865, 1500, 1024, 16, 24, 448, 1024, 16, 24, 80, 1];
  const bytes = new Uint8Array(2048); const header = new DataView(bytes.buffer);
  values.forEach((value, i) => header.setInt32(i * 4, value, true)); bytes[100] = change;
  return new NodeBlob([bytes]) as unknown as Blob;
}
afterEach(() => vi.unstubAllGlobals());
it('accepts a Medium header and rejects wrong formats, damaged dimensions, and oversized models', async () => {
  await expect(validateLocalModel(model())).resolves.toBeUndefined();
  await expect(validateLocalModel(new NodeBlob(['not a model']) as unknown as Blob)).rejects.toThrow('complete');
  await expect(validateLocalModel(new NodeBlob([new Uint8Array(100)]) as unknown as Blob)).rejects.toThrow('GGML');
  const bad = new Uint8Array(await model().arrayBuffer()); new DataView(bad.buffer).setInt32(12, 2147483647, true);
  await expect(validateLocalModel(new NodeBlob([bad]) as unknown as Blob)).rejects.toThrow('header');
  const huge = { size: 2 * 1024 ** 3 + 1, slice: vi.fn() };
  await expect(validateLocalModel(huge as unknown as Blob)).rejects.toThrow('2 GB');
  expect(huge.slice).not.toHaveBeenCalled();
});
it('identifies the model by all bytes and keeps local progress separate from hosted models', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const signal = new AbortController().signal;
  const first = await localModelNamespace(model(), signal);
  expect(await localModelNamespace(model(), signal)).toBe(first);
  expect(await localModelNamespace(model(1), signal)).not.toBe(first);
  expect(first).toMatch(/^whisper-cpp-/);
});
it('honors cancellation even for a cached model identity', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const file = model(); await localModelNamespace(file, new AbortController().signal);
  const controller = new AbortController(); controller.abort();
  await expect(localModelNamespace(file, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
});
it('amortizes small filesystem reads and bounds cache memory across seeks and large reads', async () => {
  const { cacheModelReads } = await import('../../../shared/subtitles/ggml/model-reader');
  const bytes = new Uint8Array(18 * 1024 * 1024); bytes.forEach((_, i) => { bytes[i] = i % 251; });
  // A synchronous Blob double lets this verify the WORKERFS contract in Node.
  const file = { size: bytes.length, slice: (start: number, end: number) => bytes.slice(start, end) };
  const read = vi.fn((chunk: Uint8Array) => chunk.buffer);
  const original = vi.fn();
  const fs = { reader: { readAsArrayBuffer: read }, stream_ops: { read: original } };
  const release = cacheModelReads(fs as unknown as Parameters<typeof cacheModelReads>[0], () => {});
  const stream = { node: { contents: file, size: file.size } };
  const target = new Uint8Array(12 * 1024 * 1024);
  for (let i = 0; i < 100; i++) fs.stream_ops.read(stream, target, i * 4, 4, i * 4);
  expect(read).toHaveBeenCalledTimes(1);
  expect(target.slice(0, 400)).toEqual(bytes.slice(0, 400));
  expect(fs.stream_ops.read(stream, target, 0, target.length, 7 * 1024 * 1024)).toBe(11 * 1024 * 1024);
  expect(Buffer.compare(Buffer.from(target.subarray(0, 11 * 1024 * 1024)), Buffer.from(bytes.subarray(7 * 1024 * 1024)))).toBe(0);
  expect(read.mock.calls.every(([chunk]) => chunk.length <= 8 * 1024 * 1024)).toBe(true);
  expect(fs.stream_ops.read(stream, target, 0, 4, file.size)).toBe(0);
  release(); expect(fs.stream_ops.read).toBe(original);
});
