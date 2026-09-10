# Local subtitle generation

Shared browser-only subtitle generator used by VideoSplat and MediaSplat.
Both apps install this package from `../shared/subtitles` with `install-links=true`.
After editing shared code, reinstall the local package in each app before building:

```sh
npm ci --prefix solutions/videosplat
npm ci --prefix solutions/mediasplat
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

Audio is decoded locally at 16 kHz, cropped to the selected source range, and mixed
to mono. Current limits: English speech, 30 minutes per source range, 512 MB per
source file, and a browser-decodable audio track. Decoding allocates the source
file's full audio buffer, so very long source files can exceed device memory even
when a shorter range is selected. Silent files are rejected before model loading.
Inference uses sections of up to 25 seconds, cut near quiet boundaries in a dedicated worker; closing the
dialog or cancelling terminates the worker and discards pending results. Browser
native audio decoding may finish in the background after cancellation, but cannot
publish captions. Generated times and words need review, especially with noise,
music, names, and accents. This is transcription, not translation.

VideoSplat adds a separate editable caption track aligned to the selected clip.
Captions are ordinary timeline clips: moving or trimming the source video later
does not automatically move its caption track. Download SRT in the generation
window uses clip-relative times; File → Save captions as SRT uses project times.
MediaSplat can download SRT directly or use the reviewed captions in its existing
FFmpeg burn-in path. Generated captions are temporary until used or downloaded.

Tests cover timestamp normalization, silent audio, timeline offsets, trimming,
editing, validation, cancellation, and SRT export. Set `RUN_SPEECH_MODEL_TESTS=1`
for real model-download/transcription/cache tests in the apps' Playwright suites.

Dependencies: Transformers.js (Apache-2.0), ONNX Runtime (MIT), converted Whisper model weights (Apache-2.0 per the pinned Hugging Face
model card; upstream OpenAI Whisper is MIT). No remote executable scripts are loaded. `sharp` is a transitive
Node-only dependency of Transformers.js; it is not bundled or executed by these
browser applications.
