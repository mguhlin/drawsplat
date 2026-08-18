# Production network inventory

Approved runtime traffic is limited to same-origin navigation and static application
assets. The production Content Security Policy limits `connect-src` to `'self'`.
VideoSplat has no analytics, advertising, authentication, telemetry, cloud render,
remote inference, font CDN, or media-upload endpoint.

Blob URLs represent bytes already held by the browser and do not create network
requests. IndexedDB, Canvas, Web Audio, Web Crypto, and MediaRecorder processing is
local. The service worker caches only same-origin shell assets. MLT resources using
remote, data, or executable URL schemes are reported and blocked.

Development mode uses the same-origin Vite server and its hot-reload connection.
That development-only connection is not included in production output.

Release verification includes a browser test that records every request and rejects
non-loopback hosts, plus a repository scan for unexpected remote URLs. Any future
external service requires an explicit privacy review and an update to this inventory.
