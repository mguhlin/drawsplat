# Production network inventory

Normal editing and recording use only same-origin static assets and local Blob
URLs. Starting automatic subtitle generation additionally downloads pinned public
Whisper model files from `huggingface.co` and its `*.huggingface.co` /
`*.xethub.hf.co` CDN redirects. These are GET requests for model data; audio, video,
caption text, and project metadata are never uploaded. The download host sees the
ordinary connection metadata, including IP address. Runtime JavaScript and WASM
are bundled and served from our origin, not a third-party script CDN.

The production CSP allows those model hosts in `connect-src`, plus self and local
Blob URLs. The same restrictions are included in the standalone HTML. No remote
inference, analytics, advertising, authentication, or media-upload endpoint is used.

IndexedDB, Canvas, Web Audio, Web Crypto, and MediaRecorder processing remains
local. The service worker caches same-origin assets. Transformers.js separately
caches the model in browser storage; workers preserve that cache during app
updates. Cache eviction or clearing site data requires another model download.
MLT resources with remote, data, or executable URL schemes remain blocked.

Tests verify that the editor makes no external requests on initial load and that
actual subtitle generation sends only GET requests to remote hosts and works with
the cached model offline. See `solutions/shared/subtitles/README.md` for the model
revision, limits, and runtime details.
