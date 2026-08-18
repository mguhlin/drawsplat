# VideoSplat Product Analysis

Date: 2026-08-18

## Product thesis

VideoSplat should be a private, browser-based nonlinear video editor with unusually strong
de-identification tools. It combines the approachable editing workflow associated
with OpenCut with VideoMasker's automatic, reviewable face masking, while adopting
AudioSplat's stricter local-first privacy posture: no account, upload, analytics,
advertising, tracking, or required backend.

The product promise is simple:

> Import, edit, anonymize, and export without sending media off the device.

This is not a promise that the browser makes data inaccessible to the device owner,
browser extensions, operating system, or a compromised host. The UI and privacy
notice must describe that boundary accurately.

## What to take from each reference

### VideoMasker

Best ideas to independently implement:

- Local, in-browser face detection and multi-face tracking.
- A two-pass workflow: automatic analysis followed by human review.
- Selective anonymization: users can mask selected identities and leave others
  visible.
- Editable mask tracks with frame-level corrections.
- Manual masks for missed detections and deletion of false positives.
- Keyframes with interpolation for manually adjusted masks.
- Blur and pixelation with adjustable intensity and feathering.
- Analysis-generated thumbnails for fast review without repeatedly decoding the
  entire source.
- Frame-accurate preview and export through the same masking model.
- Clear browser capability guidance and graceful WASM/CPU fallbacks.

Product improvement over the reference:

- Make mask tracks native timeline objects, so they work across cuts, transforms,
  speed changes, and layered footage.
- Add non-face redaction regions for license plates, screens, documents, student
  names, and arbitrary moving subjects.
- Provide an explicit review queue for low-confidence or discontinuous tracks.
- Avoid required sign-in, ads, analytics, and subscription-gated privacy controls.

### OpenCut

Best ideas to carry into VideoSplat:

- Familiar multi-track, drag-and-drop timeline for video, audio, images, text, and
  captions.
- Trim, split, reorder, ripple-delete, snapping, multi-select, undo, and redo.
- Layer transforms: position, scale, rotation, opacity, crop, and canvas sizing.
- Masks and keyframes as editable visual properties.
- Clip volume, playback speed, pitch preservation, waveform display, and canvas
  backgrounds.
- Local project persistence and portable project files.
- Local export without watermark, account, or subscription.
- Separation of domain logic, media adapters, rendering, and presentation.
- A project document that is plain, versioned data rather than UI state.
- A plugin-ready architecture, but only after core project and renderer contracts
  are stable.

Important source-status note:

- The current OpenCut repository is undergoing a rewrite. Its README describes a
  future Rust core, Editor API, plugins, browser/desktop/mobile targets, headless
  mode, and scripting. The classic implementation was archived in May 2026.
- VideoSplat should therefore use OpenCut as product and architectural inspiration, not
  inherit an unstable codebase wholesale.

### DrawSplat and AudioSplat privacy model

Privacy properties VideoSplat should match or exceed:

- The app works from static hosting and requires no backend.
- No account is required for core use.
- Imported media, generated proxies, projects, model inputs, and exports remain in
  the browser/device unless the user explicitly exports or invokes a separately
  labeled integration.
- No client-side analytics, ads, tracking pixels, fingerprinting, behavioral
  profiling, data sale, or AI training on user content.
- Browser storage and its deletion behavior are documented in plain language.
- Microphone, camera, screen, and file permissions are requested only in direct
  response to a relevant user action.
- Offline operation is supported after the first successful load.
- Optional cloud features, if ever added, are off by default, isolated behind a
  provider interface, and disclose exactly what leaves the device before consent.
- A network-request inventory and privacy audit ship with every release.
- Self-hosting is supported; all runtime dependencies and ML models are same-origin
  assets with pinned versions and integrity tracked at build time.

## Recommended V1 scope

### Editing foundation

- New/open/save project, autosave, recovery, and portable `.videosplat.json` manifest.
- Drag/drop and file-picker import for common browser-decodable video, audio, and
  image formats.
- Multi-track timeline with video/audio/image/text/caption/redaction objects.
- Preview transport, scrubbing, zoom, snapping, trim, split, move, delete,
  duplicate, ripple delete, multi-select, undo, and redo.
- Inspector for transforms, crop, opacity, volume, fades, and speed.
- Waveforms, filmstrip thumbnails, proxy generation, and missing-media relinking.
- Canvas presets for 16:9, 9:16, 1:1, 4:3, and custom dimensions.
- Local MP4/WebM export where codecs permit, with clear compatibility messaging.

### Privacy editing

- Local face detection in a Web Worker using an openly licensed ONNX/WASM model.
- Track association across frames with confidence scores.
- Track review list: approve, exclude, merge, split, correct, or delete.
- Rectangle and ellipse mask overlays with blur, pixelate, or solid-fill effects.
- Manual redaction tracks with keyframes and interpolation.
- Track-level enable/disable and selective identity masking.
- Pre-export privacy check that flags unreviewed low-confidence detections, gaps,
  and frames not yet analyzed.
- Export report stored locally with review status and processing settings; no face
  embeddings or biometric identity labels should be persisted by default.

### Trust, accessibility, and resilience

- Persistent “Local only” status and a network activity disclosure panel.
- Storage manager showing project sizes, quota estimates, export, and clear-data.
- Keyboard-operable editor, visible focus, screen-reader names, reduced motion,
  high contrast, and captions-first workflows.
- Installable PWA with an offline shell and locally cached, versioned models.
- Capability detection for WebCodecs, WebGPU, OPFS, File System Access API, and
  cross-origin isolation, with fallbacks rather than browser sniffing.
- Crash-safe incremental persistence and recovery after tab or browser failure.

## Explicit non-goals for V1

- Cloud collaboration, hosted project sharing, accounts, or social publishing.
- Generative video, remote transcription, cloud face recognition, or identity
  naming.
- Mobile parity for complex multitrack editing; phones may support review and
  simple trim/export.
- Third-party plugins before the document schema and renderer API are stable.
- Claiming lossless or metadata-identical output. Rendering normally re-encodes
  video; VideoSplat should state this honestly.
- Legal-compliance guarantees. VideoSplat can support privacy workflows but cannot certify
  GDPR, FERPA, COPPA, HIPAA, or evidentiary compliance for a user's deployment.

## Proposed technical direction

- **Application:** Vite, React, TypeScript, and a small state layer with command-
  based undo/redo.
- **Project model:** versioned JSON manifest; large media remains in user-selected
  files or OPFS/IndexedDB, referenced by content hash and recoverable handles.
- **Preview:** WebCodecs when available; HTML media element fallback; GPU compositing
  through WebGL2 initially, with WebGPU as an optional accelerated adapter.
- **ML:** ONNX Runtime Web in a dedicated worker; sampled detection plus optical or
  lightweight tracker propagation; no remote inference.
- **Export:** worker-based WebCodecs pipeline and local muxer, with FFmpeg.wasm as a
  compatibility fallback loaded from the same origin.
- **Audio:** Web Audio graph for preview; OfflineAudioContext or chunked worker
  rendering for deterministic export.
- **Persistence:** OPFS for large generated artifacts when supported, IndexedDB for
  metadata and fallback blobs, and explicit project-file export for portability.
- **Testing:** Vitest for domain/engine logic, Playwright for workflows and browser
  compatibility, golden-frame tests for preview/export parity, and an automated
  zero-egress test.

## Architectural invariants

1. Core editing remains fully usable with the network disabled after installation.
2. No media bytes enter a request body in the core application.
3. Preview and export consume the same scene graph and effect parameters.
4. Domain and timeline engines do not import React or browser UI components.
5. Every destructive edit is represented as a reversible command until history is
   intentionally compacted.
6. Raw media is immutable; edits are non-destructive references and parameters.
7. Optional providers can never become required dependencies of core editing.
8. Face embeddings, if temporarily needed for track association, remain ephemeral
   unless a user explicitly opts into local persistence with a clear warning.

## Principal risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Browser memory pressure on long/high-resolution media | Decode only required frames, generate proxies, use workers, chunk export, release frames immediately, and warn from quota/memory signals. |
| Codec/container inconsistency | Capability matrix, WebCodecs primary path, same-origin FFmpeg.wasm fallback, and format-specific end-to-end tests. |
| Missed faces create a false sense of safety | Never call detection infallible; show confidence/gaps, require review acknowledgment, and add a final frame-sampling audit. |
| Preview differs from export | One scene graph/effect evaluator, deterministic interpolation, and golden-frame parity tests. |
| Static hosting accidentally leaks data | Strict CSP, same-origin dependencies, no analytics, audited service worker, build-time URL scan, and browser tests that fail on unexpected requests. |
| Model or dependency license conflict | Record model provenance and licenses, generate an attribution manifest, and perform a release license review. |
| OpenCut rewrite churn | Build a small independent core around stable browser standards; borrow only compatible MIT code after file-level review. |

## Success criteria

- A first-time user can import a clip, make cuts, detect faces, correct a missed
  mask, and export without an account or network request containing media.
- A 10-minute 1080p test project can be edited responsively on a recommended
  desktop browser using proxy media.
- Autosave recovery survives an intentional tab crash without losing more than the
  most recent command batch.
- The privacy audit documents every browser storage key, permission, worker, model,
  and possible network request.
- Automated tests demonstrate zero unexpected egress and preview/export mask parity
  on the supported fixture set.

## Research sources

- VideoMasker home, about, guide, and privacy policy:
  https://www.videomasker.com/
  https://www.videomasker.com/en/about
  https://www.videomasker.com/en/guide
  https://www.videomasker.com/en/privacy
- OpenCut current repository and classic repository:
  https://github.com/OpenCut-app/OpenCut
  https://github.com/OpenCut-app/opencut-classic
- Local DrawSplat/AudioSplat materials:
  `drawsplat_github/legal/terms-privacy.html`
  `drawsplat_github/legal/widgets-security.html`
  `drawsplat_github/solutions/audiosplat/docs/plan.md`
  `drawsplat_github/solutions/audiosplat/docs/privacy-audit.md`

