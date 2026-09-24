// @vitest-environment node
import { createHash, webcrypto } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { hashBlob, importMedia } from "./importer";

afterEach(() => vi.unstubAllGlobals());

it("hashes multi-chunk videos with the same SHA-256 as existing projects", async () => {
  const bytes = new Uint8Array(9 * 1024 * 1024 + 17).fill(37);
  const blob = new Blob([bytes]);
  const wholeRead = vi.spyOn(blob, "arrayBuffer").mockRejectedValue(new Error("whole-file allocation"));
  expect(await hashBlob(blob)).toBe(createHash("sha256").update(bytes).digest("hex"));
  expect(wholeRead).not.toHaveBeenCalled();
});

it("imports a recording over 512 MB with bounded reads and full twenty-minute duration", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const size = 513 * 1024 * 1024;
  // Virtual zero-filled file exercises every byte of hashing without holding
  // another 513 MB test fixture in memory.
  const slice = vi.fn((start: number, end: number) => new Blob([new Uint8Array(Math.min(end, size) - start)]));
  const file = { name: "twenty-minutes.mp4", type: "video/mp4", size, slice,
    arrayBuffer: vi.fn(() => { throw new Error("whole-file allocation"); }) } as unknown as File;
  vi.stubGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL: vi.fn() });
  const video = {
    duration: 1200, videoWidth: 1920, videoHeight: 1080,
    onloadedmetadata: () => {}, onseeked: () => {},
    set src(_: string) { queueMicrotask(() => this.onloadedmetadata()); },
    set currentTime(_: number) { queueMicrotask(() => this.onseeked()); },
    removeAttribute() {}, load() {},
  };
  vi.stubGlobal("document", { createElement: (tag: string) => tag === "video" ? video : {
    getContext: () => ({ drawImage() {} }), toDataURL: () => "thumbnail",
  } });
  const imported = await importMedia(file);
  expect(imported.asset.duration).toBe(1200);
  expect(imported.asset.size).toBe(size);
  expect(imported.asset.contentHash).toMatch(/^[a-f0-9]{64}$/);
  expect(file.arrayBuffer).not.toHaveBeenCalled();
  expect(slice.mock.calls.every(([start, end]) => end - start <= 4 * 1024 * 1024)).toBe(true);
}, 20000);
