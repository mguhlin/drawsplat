import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("upgrading AudioSplat preserves other apps' offline and speech-model caches", async () => {
  const handlers: Record<string, (event: { waitUntil(promise: Promise<unknown>): void }) => void> = {};
  const remove = vi.fn(async (_name: string) => true);
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self: { addEventListener: (event: string, handler: typeof handlers[string]) => { handlers[event] = handler; }, clients: { claim: async () => {} } },
    caches: {
      keys: async () => ["audiosplat-v0.1.1", "audiosplat-v0.1.2", "videosplat-shell-v24", "mediasplat-v9", "transformers-cache"],
      delete: remove,
    },
  });
  let activation: Promise<unknown> | undefined;
  handlers.activate({ waitUntil: promise => { activation = promise; } });
  await activation;
  expect(remove.mock.calls.map(call => call[0])).toEqual(["audiosplat-v0.1.1"]);
});
