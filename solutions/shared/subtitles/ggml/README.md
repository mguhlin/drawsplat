# Local GGML Whisper runtime

This directory contains the application bridge and bundled browser runtime for
whisper.cpp **v1.8.3**, commit `2eeeba56e9edd762b4b38467bab96c2517163158` (MIT).
The built files are `runtime.js` and `splat-whisper.wasm`. Vite bundles them into
a dedicated worker and same-origin assets in each app. No remote runtime scripts,
model downloads, server, or shared-memory browser isolation are needed.

Rebuild with Emscripten **3.1.74**, CMake, Ninja, Git, and Python on PATH:

```sh
bash solutions/shared/subtitles/ggml/build.sh
```

The script checks out the pinned upstream source outside the repository, removes
the upstream example's global pthread flags, and builds single-threaded WASM
SIMD with 4 GiB maximum memory, growth enabled, and dynamic execution disabled.
`bridge.cpp` uses greedy English transcription with translation/context carryover
disabled and flash attention enabled. Each call returns segment timestamps;
the shared client supplies bounded 16 kHz mono windows and offsets the cues.

`WORKERFS` mounts the selected Blob read-only. The loader reads model slices into
WASM through an 8 MiB read cache (to amortize small native stdio reads), without first copying the complete model to MEMFS or a JS ArrayBuffer. The
mount is released after loading; terminating the worker cancels and releases its
model/context. A selected model is never uploaded or written to browser storage.
Browser memory can still limit loading/inference, especially on mobile devices.

Model format references: [whisper.cpp models](https://github.com/ggml-org/whisper.cpp/tree/v1.8.3/models),
[WORKERFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#workerfs).
