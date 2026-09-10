import { subtitlesToAss, type SubtitleOptions } from "../captions/subtitles";
import { burnSubtitlesCommand } from "./commands";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { concatManifest, extensionOf, joinCommand, outputExtension, safeStem, trimCommand, type ProcessingMode, type TimeRange } from "./commands";

export interface ResultFile { name: string; blob: Blob }
export type ProcessorEvent = { kind: "progress"; value: number; time?: number } | { kind: "log"; message: string };
let ffmpeg: FFmpeg | undefined;
let loaded = false;
let currentNotify: (event: ProcessorEvent) => void = () => {};
let wasmObjectURL: string | undefined;
const coreBase = `${import.meta.env.BASE_URL}ffmpeg`;
const localWasmURL = async () => {
  if (wasmObjectURL) return wasmObjectURL;
  const responses = await Promise.all([1, 2].map(part => fetch(`${coreBase}/ffmpeg-core.part-0${part}`)));
  if (responses.some(response => !response.ok)) throw new Error("The local media engine could not be downloaded. Check the connection and retry.");
  wasmObjectURL = URL.createObjectURL(new Blob(await Promise.all(responses.map(response => response.arrayBuffer())), { type: "application/wasm" }));
  return wasmObjectURL;
};
const getEngine = async (notify: (event: ProcessorEvent) => void) => {
  currentNotify = notify;
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress, time }) => currentNotify({ kind: "progress", value: progress, time: time / 1000000 }));
    ffmpeg.on("log", ({ message }) => currentNotify({ kind: "log", message }));
  }
  if (!loaded) { notify({ kind: "log", message: "Loading the local media engine…" }); await ffmpeg.load({ coreURL: `${coreBase}/ffmpeg-core.js`, wasmURL: await localWasmURL() }); loaded = true; }
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
export const cancelProcessing = () => { ffmpeg?.terminate(); ffmpeg = undefined; loaded = false; if (wasmObjectURL) URL.revokeObjectURL(wasmObjectURL); wasmObjectURL = undefined; };

export async function burnSubtitles(file: File, source: string, options: SubtitleOptions, notify: (event: ProcessorEvent) => void, knownDuration?: number): Promise<ResultFile[]> {
  subtitlesToAss(source, options); // Validate before loading the engine.
  let total = knownDuration ?? 0, encoding = false, completed = 0;
  const engine = await getEngine(event => {
    if (!encoding) { if (event.kind === "log" && event.message.startsWith("Loading the local")) notify(event); return; }
    const match = event.kind === "log" ? event.message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/) : undefined;
    const seconds = event.kind === "progress" ? event.time : match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : undefined;
    const ratio = total > 0 && seconds !== undefined ? seconds / total : event.kind === "progress" ? event.value : undefined;
    if (ratio !== undefined && Number.isFinite(ratio) && ratio >= 0) {
      completed = Math.max(completed, Math.min(.99, ratio));
      notify({ kind: "progress", value: completed });
    }
  });
  const input = `source.${extensionOf(file.name)}`, output = `${safeStem(file.name)}-subtitled.mp4`;
  try {
    notify({ kind: "log", message: "Preparing the video and subtitle font…" });
    await engine.createDir("fonts");
    const font = await fetch(`${coreBase}/DejaVuSans.ttf`);
    if (!font.ok) throw new Error("The local subtitle font could not be loaded.");
    await engine.writeFile("fonts/DejaVuSans.ttf", new Uint8Array(await font.arrayBuffer()));
    await engine.writeFile(input, await fetchFile(file));
    await engine.ffprobe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,duration:stream_side_data=rotation:format=duration", "-of", "json", input, "-o", "subtitle-probe.json"]);
    // This core leaves ffprobe.ret at -1 on success; validate its JSON output instead.
    const probe = await engine.readFile("subtitle-probe.json", "utf8");
    const metadata = JSON.parse(String(probe));
    const video = metadata.streams?.[0];
    const probedDuration = Number(video?.duration ?? metadata.format?.duration);
    if (Number.isFinite(probedDuration) && probedDuration > 0) total = probedDuration;
    if (!(video?.width > 0 && video?.height > 0)) throw new Error("Choose a file containing video to burn subtitles into.");
    const rotation = Number(video.side_data_list?.find((entry: { rotation?: number }) => entry.rotation !== undefined)?.rotation ?? 0);
    const aspect = Math.abs(rotation) % 180 === 90 ? video.height / video.width : video.width / video.height;
    await engine.writeFile("captions.ass", subtitlesToAss(source, options, aspect));
    encoding = true;
    notify({ kind: "log", message: "Burning subtitles into MP4 locally…" });
    if (await engine.exec(burnSubtitlesCommand(input, output)) !== 0) throw new Error("Subtitle export failed. Check that the source contains video and try a smaller file.");
    encoding = false;
    notify({ kind: "log", message: "Finishing the MP4 download…" });
    return [await readResult(engine, output)];
  } finally {
    await cleanup(engine, [input, output, "subtitle-probe.json", "captions.ass", "fonts/DejaVuSans.ttf"]);
    try { await engine.deleteDir("fonts"); } catch { /* cancelled engine */ }
  }
}
