# Privacy and network inventory

MediaSplat has no account, backend, analytics, advertising, tracking, or cloud processing. Selected files are represented by browser-local object URLs and copied into FFmpeg's in-memory virtual filesystem only while an operation runs. Temporary input, manifest, and output files are deleted after completion or failure. Reloading the page clears application state.

Runtime requests are limited to same-origin application assets, the service worker, `ffmpeg-core.js`, and two FFmpeg WebAssembly chunks. The chunks are reassembled into a temporary browser-local object URL and cached for offline reuse. Media bytes are never placed in an HTTP request body by application code.

Downloaded output leaves the application only through an explicit user action. Browser extensions, the operating system, device administrators, and a compromised host remain outside this privacy boundary.
