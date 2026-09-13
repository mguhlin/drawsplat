# Local subtitle generation

Shared browser-only subtitle generator used by VideoSplat, MediaSplat, and AudioSplat.
Apps install this package from `../shared/subtitles` with `install-links=true`.
After editing shared code, reinstall the local package in each app before building:

```sh
npm ci --prefix solutions/videosplat
npm ci --prefix solutions/mediasplat
npm ci --prefix solutions/audiosplat
```

The worker runs Transformers.js 3.8.1 with quantized Whisper models for English transcription.
The model registry in `models.ts` pins Tiny (~42 MB), Small (~250 MB, default),
Medium (~990 MB), and optional Large v3 Turbo (~1.1 GB) to specific Hugging Face revisions. Larger models need
more memory and processing time. The selector remembers the user's preference.
ONNX Runtime's JavaScript and WebAssembly are bundled with each app and served
from the same origin. Model data is downloaded only when generation starts,
including by choosing the recorder's generation option. No source media or
transcribed text is sent to Hugging Face. Model caching uses Transformers.js's
browser cache; site-data removal or storage eviction can require another download.
The host sees ordinary model download requests, including the client's IP address.

Audio is decoded locally in windows of at most 25 seconds with Mediabunny's
BlobSource and AudioBufferSink, then mixed to mono and resampled to 16 kHz using
Web Audio. Compressed source reads use an 8 MiB cache. Each decoded window is
released after recognition; the entire source is never decoded for the streaming
path. Quiet boundaries near the end of each window preserve contiguous sample
positions. Limits: English speech, 120 minutes (2 hours) per source range and
512 MB per file. Supported formats/codecs depend on browser decoding support.

For older browsers or unsupported streaming codecs, a compatibility fallback
uses full-file Web Audio decoding only for sources no longer than 30 minutes and
no larger than 64 MiB. Longer files require a browser/format with streaming
decoding support; there is no automatic whole-file fallback for multi-hour audio.
Native decoding of the current short window may finish after cancellation, but
cannot publish captions. The recognition worker is retained across windows and
terminated when the job finishes or is cancelled.

## Saved progress and partial downloads

Completed windows are checkpointed in IndexedDB after every section, including
silence. A SHA-256 fingerprint of all file bytes (read in 1 MiB chunks), selected
range, selected model, and engine version identifies a recording. No source media is stored or
uploaded. Selecting the same file/range and generating again restores completed
sections and resumes at the exact saved sample boundary. Completed transcripts
can also be restored; **Start over** discards that checkpoint and regenerates.
A Web Lock prevents simultaneous jobs for the same file/range where supported.

Saved records contain generated caption text and timing on this device. Resume
is available for 30 days; saves prune expired entries and keep at most 20 recent
file/range records. Clearing the site's browser data deletes this progress.
Storage failure/eviction does not stop transcription: the UI reports it and
partial downloads remain available. User edits are not autosaved to checkpoints;
download reviewed captions/text to keep those edits.

Both transcription interfaces show completed duration, offer partial SRT/text
downloads during processing or after cancellation, and paginate reviews in groups
of 50 captions. Partial filenames include `.partial`; complete exports retain the
normal filename. MediaSplat enables subtitle burn-in only after generation is
complete. Recovered/generated times and words still need review, especially with
noise, music, names, and accents. This is transcription, not translation.

If a section produces no usable captions with segment timestamps, the worker
retries that section with word alignment using the same model. This recovers
clear speech that timestamp-token decoding sometimes returns as empty. Aligned
words are grouped into readable captions before timing validation, preserving
short words with identical start and end times. The retry remains on-device.

VideoSplat adds a separate editable caption track aligned to the selected clip.
Captions are ordinary timeline clips: moving or trimming the source video later
does not automatically move its caption track. Download SRT in the generation
window uses clip-relative times; File → Save captions as SRT uses project times.
MediaSplat can download SRT directly or use the reviewed captions in its existing
FFmpeg burn-in path. Generated progress can be restored; download reviewed edits or use them in the project to keep them.

Tests cover timestamp normalization, silent audio, timeline offsets, trimming,
editing, validation, cancellation, and SRT export. Set `RUN_SPEECH_MODEL_TESTS=1`
for real model-download/transcription/cache tests in the apps' Playwright suites.

Mediabunny API references: [media sinks](https://mediabunny.dev/guide/media-sinks) and [BlobSource](https://mediabunny.dev/api/BlobSource).

Dependencies: Mediabunny (MPL-2.0), Transformers.js (Apache-2.0), ONNX Runtime (MIT), converted Whisper model weights (Tiny/Small Apache-2.0 model cards; Medium/Turbo timestamped exports MIT; upstream OpenAI Whisper MIT). No remote executable scripts are loaded. `sharp` is a transitive
Node-only dependency of Transformers.js; it is not bundled or executed by these
browser applications.

Checkpoints are isolated by model. Tiny retains its original fingerprint namespace so existing progress can be restored by selecting Tiny. Small, Medium, and Turbo include their pinned revision and quantization in the namespace.

Medium and Turbo use pinned timestamped exports with WASM memory arena/pattern retention disabled. Real browser integration covers recognition across multiple windows. Run `RUN_ALL_WHISPER_MODELS=1 npm run test:e2e` in MediaSplat to test all four actual engines.

## Use a GGML model already on the device

All three apps offer **English speech model → Use local GGML model (.bin)…**.
Select the separate **Local Whisper model (.bin)** file, then generate normally.
Models up to 2 GiB are accepted independently of the 512 MiB media-file limit.
Both English-only and multilingual Whisper GGML models can transcribe English;
this option does not add translation or other transcription languages. GGUF and
ONNX files are not compatible. Header validation catches incompatible formats;
the native loader checks the model contents. Larger/quantized models remain
subject to available browser memory, and speed depends on the device.

The pinned whisper.cpp engine runs in a separate worker, with no model download
or upload. The selected model is read directly through WORKERFS and is not saved
in browser storage. The local choice is remembered, but the model must be
reselected after closing/reloading. Resume identities include the model's entire
contents and engine version, not its name or modification date. Different model
files cannot accidentally restore one another's captions. Cancellation, partial
SRT/text downloads, review, timeline insertion, and burn-in use the existing
shared workflow. See `ggml/README.md` for reproducible runtime build instructions.

Run real local-model integration tests in each app with
`LOCAL_GGML_MODEL=/absolute/path/to/ggml-medium.bin npm run test:e2e`.
The model stays outside the repository. Deterministic tests cover missing files,
invalid headers, model switches, cancellation, and model-specific restoration.

Large v3 Turbo uses `onnx-community/whisper-large-v3-turbo_timestamped`, q8, with explicit English transcription (also for word-timing fallback). It shares the existing ONNX runtime and downloads only when selected for generation. GGML remains a separate worker loaded only for local-model generation. Small remains the default.

To run only the real Turbo multi-window integration test in MediaSplat: `RUN_ALL_WHISPER_MODELS=1 WHISPER_TEST_MODEL=turbo npm run test:e2e -- --grep "all four real"`.
