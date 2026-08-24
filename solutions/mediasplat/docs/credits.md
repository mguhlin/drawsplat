# Credits and licensing

- FFmpeg — https://ffmpeg.org/ — LGPL-2.1-or-later/GPL components depending on build configuration.
- ffmpeg.wasm (`@ffmpeg/ffmpeg` and `@ffmpeg/util`) — https://ffmpegwasm.netlify.app/ — MIT.
- The pinned `@ffmpeg/core` 0.12.10 package declares GPL-2.0-or-later. Its approximately 31 MB WebAssembly runtime is distributed as two deployment-safe chunks and reassembled locally; deployments must satisfy the GPL source and notice requirements.
- React — https://react.dev/ — MIT.
- Vite — https://vite.dev/ — MIT.

Pinned versions are recorded in `package-lock.json`. A distributor must review the exact FFmpeg core configuration and provide the corresponding notices/source offer required by its enabled components.
