# Local media acceleration

MediaSplat and VideoSplat check browser capabilities; they do not require NVIDIA or upload media to a GPU service. Processing does not invoke GitHub Actions.

## Speech and SRT

The shared subtitle generator defaults to **Auto**. It requests a high-performance WebGPU adapter, skips known software GPU emulators, then uses Transformers.js with pinned Whisper models. GPU execution uses a floating-point encoder and a 4-bit decoder (fp16/q4f16 when shader-f16 is available, otherwise fp32/q4); CPU execution retains q8. Integer q8 matrix operations would otherwise fall back to CPU and undermine acceleration. **CPU · compatibility mode** bypasses GPU probing. The preference is saved locally. Local GGML `.bin` models continue to use their CPU engine.

If GPU initialization or inference fails, the engine disposes its GPU pipeline and retries the current audio window once on CPU. Completed checkpoints stay intact; uncommitted cues from the failed window are discarded. CPU errors are surfaced normally. Status reports the selected execution backend; individual operations can still run on CPU inside ONNX Runtime. GPU model variants are cached separately and may require larger downloads; the UI shows the maximum GPU download size. CPU fallback can require its separate q8 download. GPU availability does not guarantee improved speed.

## VideoSplat export

**Auto** tries WebCodecs hardware encoding first, then software encoding. Supported MP4 uses AVC/AAC; WebM uses VP9 or VP8 with Opus. Codec probes include the selected dimensions and bitrate. Hardware preference is a browser hint, not confirmation of a particular physical encoder.

Fast export decodes source video at timeline timestamps, composites with the same renderer as compatible export, mixes stereo audio in bounded windows, and directly muxes the requested format. It honors trimming, timeline gaps, mute, volume, fades, overlays, subtitles, and chroma key. Export progress advances with processed frames, rather than elapsed playback time. Output files are still held in memory, as before.

**CPU · software frame encoding** requests software WebCodecs encoding. **Compatible** retains the original Canvas/MediaRecorder exporter. OGM always uses compatible export plus FFmpeg conversion. Unsupported formats, decoder failures, or encoder failures or invalid output dimensions/duration restart the export through the compatible path, with a visible status message. Cancellation disposes resources and never starts a fallback. The browser may itself use hardware in compatible mode; that mode offers no hardware control.

MediaSplat's FFmpeg cutting, joining, and subtitle burning are unchanged. This release accelerates its transcription and VideoSplat's composition exports, not every media operation.

## Validation

Tests cover GPU selection and CPU overrides, GPU inference failure and checkpoint behavior, encoder selection, decoded export duration and audible sound, chroma-key output pixels, cancellation, and the compatible export fallback. Hardware speed varies with browser, OS, drivers, codec, model, and GPU memory. A software WebGPU adapter can validate engine compatibility but cannot benchmark a physical NVIDIA GPU.
