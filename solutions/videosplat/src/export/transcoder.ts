import { FFmpeg } from "@ffmpeg/ffmpeg";

export type ExportFormat = "webm" | "mp4" | "ogm";

let engine: FFmpeg | undefined;
let loaded = false;
let wasmUrl: string | undefined;
const engineBase = "/solutions/mediasplat/ffmpeg";

const loadWasm = async () => {
  if (wasmUrl) return wasmUrl;
  const responses = await Promise.all(
    [1, 2].map((part) => fetch(`${engineBase}/ffmpeg-core.part-0${part}`)),
  );
  if (responses.some((response) => !response.ok))
    throw new Error("The local format engine could not be loaded. Make sure MediaSplat is installed beside VideoSplat.");
  wasmUrl = URL.createObjectURL(new Blob(
    await Promise.all(responses.map((response) => response.arrayBuffer())),
    { type: "application/wasm" },
  ));
  return wasmUrl;
};

const getEngine = async (onProgress: (ratio: number) => void) => {
  if (!engine) {
    engine = new FFmpeg();
    engine.on("progress", ({ progress }) => onProgress(Math.max(0, Math.min(1, progress))));
  }
  if (!loaded) {
    await engine.load({ coreURL: `${engineBase}/ffmpeg-core.js`, wasmURL: await loadWasm() });
    loaded = true;
  }
  return engine;
};

const commands = {
  mp4: ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart"],
  ogm: ["-c:v", "libtheora", "-q:v", "7", "-c:a", "libvorbis", "-q:a", "5"],
} satisfies Record<Exclude<ExportFormat, "webm">, string[]>;

export async function transcodeExport(
  source: Blob,
  format: Exclude<ExportFormat, "webm">,
  onProgress: (ratio: number) => void,
): Promise<Blob> {
  const ffmpeg = await getEngine(onProgress);
  const input = "videosplat-master.webm";
  const output = `videosplat-export.${format}`;
  try {
    await ffmpeg.writeFile(input, new Uint8Array(await source.arrayBuffer()));
    const code = await ffmpeg.exec(["-i", input, ...commands[format], output]);
    if (code !== 0) throw new Error(`Local ${format.toUpperCase()} conversion failed.`);
    const data = await ffmpeg.readFile(output);
    if (typeof data === "string") throw new Error("The local format engine returned invalid media.");
    return new Blob([new Uint8Array(data)], { type: format === "mp4" ? "video/mp4" : "video/ogg" });
  } finally {
    for (const name of [input, output])
      try { await ffmpeg.deleteFile(name); } catch { /* best effort */ }
  }
}
