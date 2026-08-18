# ADR 0001: Local-first foundation

Status: accepted for milestone 1.

VideoSplat is a static browser application. Core editing must work without accounts or a
backend and, after the initial application load, without network access. Project
metadata is versioned JSON in IndexedDB. Large generated media will use OPFS where
available with IndexedDB fallback. Users can export a portable project manifest.

The domain model and history are plain TypeScript with no React dependencies.
Preview and export will share one scene graph. Browser capabilities are selected by
feature detection. WebCodecs is the preferred media path; HTML media and a locally
served FFmpeg.wasm build are planned fallbacks.

Consequences:

- Static/self-hosted deployment remains possible.
- Clearing site data removes autosaves; the UI must encourage project-file copies.
- Cross-device sync and collaboration are outside core scope.
- A plugin or provider may not make remote services mandatory.
