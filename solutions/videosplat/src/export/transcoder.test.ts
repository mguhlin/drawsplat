import { describe, expect, it, vi } from "vitest";
import { fetchWasmChunks } from "./transcoder";

describe("local export transcoder", () => {
  it("reassembles the Cloudflare-safe FFmpeg WebAssembly chunks", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) =>
      new Response(
        String(url).endsWith("01")
          ? new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 2])
          : new Uint8Array([3, 4]),
      ),
    ) as typeof fetch;
    const blob = await fetchWasmChunks("/ffmpeg", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
    expect(Array.from(bytes)).toEqual([
      0, 0x61, 0x73, 0x6d, 1, 2, 3, 4,
    ]);
    expect(blob.type).toBe("application/wasm");
  });

  it("rejects an HTML fallback instead of passing it to WebAssembly", async () => {
    const fetcher = vi.fn(async () => new Response("<!doctype html>")) as typeof fetch;
    await expect(fetchWasmChunks("/ffmpeg", fetcher)).rejects.toThrow("invalid");
  });
});
