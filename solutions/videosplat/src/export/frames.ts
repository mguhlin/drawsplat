import { Input, ALL_FORMATS, BlobSource, CanvasSink, AudioBufferSink, Output, BufferTarget, CanvasSource, AudioBufferSource, Mp4OutputFormat, WebMOutputFormat, canEncodeVideo, canEncodeAudio, type VideoCodec, type WrappedCanvas, type InputVideoTrack } from 'mediabunny';
import type { VideoSplatProject, Clip } from '../domain/project';
import type { ExportOptions } from './exporter';
import { activeVisualClips, projectDuration } from '../timeline/engine';
import { createChromaRenderer } from '../render/chroma';
import { waitForMedia } from '../media/ready';
import { audioGain, drawComposition, type VisualSource } from './composition';

export async function chooseEncoder(options: ExportOptions) {
  const candidates: VideoCodec[] = options.format === 'mp4' ? ['avc'] : ['vp8', 'vp9'];
  const preferences = options.acceleration === 'software' ? ['prefer-software'] as const : ['prefer-hardware', 'prefer-software'] as const;
  for (const hardwareAcceleration of preferences) for (const codec of candidates) {
    if (await canEncodeVideo(codec, { width: options.width, height: options.height, bitrate: options.videoBitsPerSecond, hardwareAcceleration })) return { codec, hardwareAcceleration };
  }
  throw new Error('No compatible WebCodecs video encoder');
}

// Decode and mix bounded windows, not a full-project AudioBuffer.
async function mixAudio(project: VideoSplatProject, sinks: Map<string, AudioBufferSink>, start: number, end: number, signal?: AbortSignal) {
  const rate = 48000, from = Math.max(0, start - .1);
  const context = new OfflineAudioContext(2, Math.max(1, Math.round((end - from) * rate)), rate);
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -3; limiter.knee.value = 6; limiter.ratio.value = 12;
  limiter.attack.value = .003; limiter.release.value = .25; limiter.connect(context.destination);
  const nodes: AudioBufferSourceNode[] = [];
  try {
    for (const track of project.tracks) {
      if (track.muted) continue;
      for (const clip of track.clips) {
        const sink = clip.assetId && sinks.get(clip.assetId);
        const begin = Math.max(from, clip.start), finish = Math.min(end, clip.start + clip.duration);
        if (!sink || finish <= begin) continue;
        const sourceFrom = clip.sourceStart + begin - clip.start, sourceTo = clip.sourceStart + finish - clip.start;
        for await (const { buffer, timestamp } of sink.buffers(sourceFrom, sourceTo)) {
          signal?.throwIfAborted();
          const a = Math.max(sourceFrom, timestamp), b = Math.min(sourceTo, timestamp + buffer.duration);
          if (b <= a) continue;
          const node = context.createBufferSource(); node.buffer = buffer; nodes.push(node);
          const gain = context.createGain(); node.connect(gain); gain.connect(limiter);
          const timelineStart = clip.start + a - clip.sourceStart;
          const count = Math.max(2, Math.ceil((b - a) * 200));
          const curve = Float32Array.from({ length: count }, (_, i) => audioGain(clip, timelineStart + i / (count - 1) * (b - a)));
          gain.gain.setValueCurveAtTime(curve, timelineStart - from, b - a);
          node.start(timelineStart - from, a - timestamp, b - a);
        }
      }
    }
    signal?.throwIfAborted();
    const rendered = await context.startRendering();
    signal?.throwIfAborted();
    const offset = Math.round((start - from) * rate);
    const buffer = new AudioBuffer({ numberOfChannels: 2, length: Math.max(1, Math.round((end - start) * rate)), sampleRate: rate });
    for (let c = 0; c < 2; c++) buffer.copyToChannel(rendered.getChannelData(c).subarray(offset, offset + buffer.length), c);
    return buffer;
  } finally { for (const node of nodes) { node.disconnect(); node.buffer = null; } }
}

export async function exportFrames(project: VideoSplatProject, urls: Record<string, string>, options: ExportOptions,
  onProgress: (ratio: number) => void, signal?: AbortSignal, onStatus: (message: string) => void = () => {}) {
  signal?.throwIfAborted();
  const start = Math.max(0, options.rangeStart ?? 0), end = Math.min(projectDuration(project), options.rangeEnd ?? projectDuration(project));
  const duration = end - start;
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(options.frameRate) || options.frameRate <= 0) throw new Error('Invalid export range or frame rate');
  const encoder = await chooseEncoder(options);
  const audioCodec = options.format === 'mp4' ? 'aac' : 'opus';
  if (options.includeAudio && !await canEncodeAudio(audioCodec, { numberOfChannels: 2, sampleRate: 48000, bitrate: 128000 })) throw new Error('Audio encoding is unavailable for this format');
  const canvas = document.createElement('canvas'); canvas.width = options.width; canvas.height = options.height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas rendering unavailable');
  const output = new Output({ target: new BufferTarget(), format: options.format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat() });
  const video = new CanvasSource(canvas, { ...encoder, bitrate: options.videoBitsPerSecond, keyFrameInterval: 2 });
  const audio = options.includeAudio ? new AudioBufferSource({ codec: audioCodec, bitrate: 128000 }) : undefined;
  output.addVideoTrack(video, { frameRate: options.frameRate });
  if (audio) output.addAudioTrack(audio);
  const inputs = new Map<string, Input>(), videoTracks = new Map<string, InputVideoTrack>(), audioSinks = new Map<string, AudioBufferSink>();
  const sources = new Map<string, VisualSource>();
  const iterators = new Map<string, AsyncGenerator<WrappedCanvas | null, void, unknown>>();
  const stop = () => { for (const input of inputs.values()) input.dispose(); void output.cancel().catch(() => {}); };
  signal?.addEventListener('abort', stop, { once: true });
  try {
    onStatus('Preparing frame export · checking local media');
    const clips = project.tracks.flatMap(track => track.clips).filter(clip => clip.start < end && clip.start + clip.duration > start);
    for (const clip of clips) {
      signal?.throwIfAborted();
      if (!clip.assetId) continue;
      const asset = project.assets.find(asset => asset.id === clip.assetId);
      if (!asset || !urls[asset.id]) throw new Error(`Relink missing media: ${clip.name}`);
      if (asset.kind === 'image') {
        const image = new Image(); image.src = urls[asset.id]; await waitForMedia(image, signal); sources.set(clip.id, image);
      } else if (!inputs.has(asset.id)) {
        const response = await fetch(urls[asset.id], { signal });
        if (!response.ok) throw new Error(`Cannot read ${asset.name}`);
        const input = new Input({ source: new BlobSource(await response.blob()), formats: ALL_FORMATS }); inputs.set(asset.id, input);
        const v = await input.getPrimaryVideoTrack();
        if (v) { if (!await v.canDecode()) throw new Error(`Video decoding unavailable for ${asset.name}`); videoTracks.set(asset.id, v); }
        else if (asset.kind === 'video') throw new Error(`No video track in ${asset.name}`);
        if (audio) {
          const a = await input.getPrimaryAudioTrack();
          if (a) { if (!await a.canDecode()) throw new Error(`Audio decoding unavailable for ${asset.name}`); audioSinks.set(asset.id, new AudioBufferSink(a)); }
          else if (asset.kind === 'audio') throw new Error(`No audio track in ${asset.name}`);
        }
      }
    }
    const frameCount = Math.ceil(duration * options.frameRate);
    function* timestamps(clip: Clip, firstTimestamp: number) {
      for (let i = Math.max(0, Math.ceil((clip.start - start) * options.frameRate)); i < frameCount; i++) {
        const time = start + i / options.frameRate;
        if (time >= clip.start + clip.duration) break;
        yield Math.max(firstTimestamp, clip.sourceStart + time - clip.start);
      }
    }
    for (const clip of clips) {
      const track = clip.assetId && videoTracks.get(clip.assetId);
      // Each clip owns its canvas pool; overlapping copies must not overwrite each other.
      if (track) iterators.set(clip.id, new CanvasSink(track, { poolSize: 2 }).canvasesAtTimestamps(timestamps(clip, await track.getFirstTimestamp())));
    }
    await output.start();
    onStatus(encoder.hardwareAcceleration === 'prefer-hardware' ? 'Fast frame export · hardware encoding requested' : 'Fast frame export · software encoding');
    const renderChroma = createChromaRenderer();
    let audioUntil = 0;
    for (let i = 0; i < frameCount; i++) {
      signal?.throwIfAborted();
      const elapsed = i / options.frameRate, time = start + elapsed;
      if (audio && elapsed >= audioUntil - 1e-8) {
        const next = Math.min(duration, audioUntil + 1);
        await audio.add(await mixAudio(project, audioSinks, start + audioUntil, start + next, signal)); audioUntil = next;
      }
      for (const { clip } of activeVisualClips(project, time)) {
        const iterator = iterators.get(clip.id); if (!iterator) continue;
        const { value } = await iterator.next();
        if (!value) throw new Error(`A video frame could not be decoded for ${clip.name}`);
        sources.set(clip.id, value.canvas);
      }
      drawComposition(project, time, canvas, context, sources, renderChroma, options);
      await video.add(elapsed, Math.min(1 / options.frameRate, duration - elapsed));
      onProgress((i + 1) / frameCount * .98);
      if (i % 8 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    video.close(); audio?.close(); signal?.throwIfAborted();
    await output.finalize(); signal?.throwIfAborted();
    if (!output.target.buffer?.byteLength) throw new Error('Encoder returned an empty file');
    const blob = new Blob([output.target.buffer], { type: options.format === 'mp4' ? 'video/mp4' : 'video/webm' });
    // A positive capability probe can still produce an invalid encoder configuration.
    // Validate the actual file before offering it, and let the caller fall back on failure.
    const url = URL.createObjectURL(blob), preview = document.createElement('video');
    try {
      preview.preload = 'auto'; preview.muted = true; preview.src = url;
      await waitForMedia(preview, signal);
      if (preview.videoWidth !== options.width || preview.videoHeight !== options.height ||
        !Number.isFinite(preview.duration) || Math.abs(preview.duration - duration) > Math.max(.15, 1 / options.frameRate)) {
        throw new Error('The browser encoder produced incorrect dimensions or duration');
      }
    } finally { preview.removeAttribute('src'); preview.load(); URL.revokeObjectURL(url); }
    onProgress(1);
    return blob;
  } finally {
    signal?.removeEventListener('abort', stop);
    for (const iterator of iterators.values()) await iterator.return().catch(() => {});
    for (const input of inputs.values()) input.dispose();
    if (output.state !== 'finalized') await output.cancel().catch(() => {});
  }
}
