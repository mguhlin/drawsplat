import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { concatManifest, extensionOf, joinCommand, outputExtension, safeStem, trimCommand, type ProcessingMode, type TimeRange } from "./commands";

export interface ResultFile { name: string; blob: Blob }
export type ProcessorEvent = { kind: "progress"; value: number } | { kind: "log"; message: string };
let ffmpeg: FFmpeg | undefined;
let loaded = false;
const coreBase = `${import.meta.env.BASE_URL}ffmpeg`;
const getEngine = async (notify: (event: ProcessorEvent) => void) => {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => notify({ kind: "progress", value: Math.max(0, Math.min(1, progress)) }));
    ffmpeg.on("log", ({ message }) => notify({ kind: "log", message }));
  }
  if (!loaded) { notify({ kind: "log", message: "Loading the local media engine…" }); await ffmpeg.load({ coreURL: `${coreBase}/ffmpeg-core.js`, wasmURL: `${coreBase}/ffmpeg-core.wasm` }); loaded = true; }
  return ffmpeg;
};
const mimeFor = (ext: string) => ({ mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", oga: "audio/ogg", m4a: "audio/mp4" }[ext] ?? "application/octet-stream");
const readResult = async (engine: FFmpeg, name: string): Promise<ResultFile> => { const data = await engine.readFile(name); if (typeof data === "string") throw new Error("The media engine returned an invalid output."); return { name, blob: new Blob([new Uint8Array(data)], { type: mimeFor(extensionOf(name)) }) }; };
const cleanup = async (engine: FFmpeg, names: string[]) => { for (const name of names) try { await engine.deleteFile(name); } catch { /* best-effort virtual filesystem cleanup */ } };

export async function splitMedia(file: File, ranges: TimeRange[], mode: ProcessingMode, notify: (event: ProcessorEvent) => void): Promise<ResultFile[]> {
  const engine = await getEngine(notify); const input = `input.${extensionOf(file.name)}`; const ext = outputExtension(file, mode); const outputs = ranges.map((_, i) => `${safeStem(file.name)}-part-${String(i + 1).padStart(2, "0")}.${ext}`); const names = [input, ...outputs];
  try { await engine.writeFile(input, await fetchFile(file)); const results: ResultFile[] = []; for (let i = 0; i < ranges.length; i++) { notify({ kind: "log", message: `Creating part ${i + 1} of ${ranges.length}…` }); const code = await engine.exec(trimCommand(input, outputs[i], ranges[i], mode)); if (code !== 0) throw new Error(`FFmpeg could not create part ${i + 1}. Try Precise mode for this format.`); results.push(await readResult(engine, outputs[i])); notify({ kind: "progress", value: (i + 1) / ranges.length }); } return results; } finally { await cleanup(engine, names); }
}
export async function joinMedia(files: File[], mode: ProcessingMode, notify: (event: ProcessorEvent) => void): Promise<ResultFile[]> {
  if (files.length < 2) throw new Error("Choose at least two files to join."); const engine = await getEngine(notify); const ext = mode === "fast" ? extensionOf(files[0].name) : outputExtension(files[0], mode); const inputs = files.map((file, i) => `join-${i}.${extensionOf(file.name)}`); const manifest = "join-list.txt"; const output = `joined-media.${ext}`; const names = [...inputs, manifest, output];
  try { for (let i = 0; i < files.length; i++) { notify({ kind: "log", message: `Preparing file ${i + 1} of ${files.length}…` }); await engine.writeFile(inputs[i], await fetchFile(files[i])); } await engine.writeFile(manifest, concatManifest(inputs)); const code = await engine.exec(joinCommand(manifest, output, mode)); if (code !== 0) throw new Error(mode === "fast" ? "These streams are not compatible for lossless joining. Choose Normalize mode." : "The selected files could not be normalized and joined."); return [await readResult(engine, output)]; } finally { await cleanup(engine, names); }
}
export const cancelProcessing = () => { ffmpeg?.terminate(); ffmpeg = undefined; loaded = false; };
