# VideoSplat Credits and Third-Party Components

VideoSplat uses React and browser-native media, storage, canvas, audio, and crypto
APIs. Development and testing use Vite, TypeScript, Vitest, Testing Library, jsdom,
and Playwright. Exact versions are recorded in `package-lock.json`.

No face-detection model, codec WASM package, or third-party runtime service has
been added yet. Each future model or encoder requires documented provenance,
license compatibility, integrity/version tracking, and a local-only privacy review.
