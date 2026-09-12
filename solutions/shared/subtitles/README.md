# Local subtitle generation

Shared browser-only subtitle generator used by VideoSplat, MediaSplat, and AudioSplat.
Apps install this package from `../shared/subtitles` with `install-links=true`.
After editing shared code, reinstall the local package in each app before building:

```sh
npm ci --prefix solutions/videosplat
npm ci --prefix solutions/mediasplat
npm ci --prefix solutions/audiosplat
```

The worker runs Transformers.js 3.8.1 with the quantized English Whisper Tiny model
`Xenova/whisper-tiny.en`, pinned to revision
`79fb389fc764e7c395bd330e9531d9d32ada7049`. ONNX Runtime's JavaScript and WebAssembly
are bundled with each app and served from the same origin. Model data (roughly
42 MB) is downloaded from Hugging Face only when the user starts generation,
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
range, and engine version identifies a recording. No source media is stored or
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

Dependencies: Mediabunny (MPL-2.0), Transformers.js (Apache-2.0), ONNX Runtime (MIT), converted Whisper model weights (Apache-2.0 per the pinned Hugging Face
model card; upstream OpenAI Whisper is MIT). No remote executable scripts are loaded. `sharp` is a transitive
Node-only dependency of Transformers.js; it is not bundled or executed by these
browser applications.
