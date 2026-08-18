# VideoSplat Implementation Plan

Date: 2026-08-18

## Current status and next delivery sequence

Completed foundations include the static local-first application, IndexedDB project
and media persistence, portable project files, browser media import, timeline split,
move and edge trimming, ripple insertion at the playhead, synchronized multi-track
audio preview, click-to-frame video preview, and the offline WebM optimizer.

The next milestones incorporate the most useful browser-suitable capabilities from
OpenShot while keeping all media processing on the user's device:

1. **Timeline precision:** magnetic snapping, frame stepping, user-created tracks,
   track reorder/delete, drag-to-track, ripple delete, markers, and multi-selection.
2. **Composition:** layered preview, on-canvas position/scale/crop/rotation, opacity,
   fit/fill presets, overlays, logos, and watermarks.
3. **Audio:** clip/track gain, fades, waveforms in clips, detached video audio,
   panning, normalization, and optional local speech ducking.
4. **Titles and transitions:** SVG title/lower-third templates, SRT/WebVTT captions,
   crossfades, fades, wipes, slides, dissolves, and dip-to-black.
5. **Animation and effects:** deterministic keyframes, linear/constant/Bezier
   interpolation, speed changes, freeze frames, color controls, blur/pixelation,
   and chroma key.
6. **Local export:** shared preview/export scene graph, WebM and capability-gated MP4,
   range export, quality presets, worker execution, and privacy preflight.

### Professional editing and MLT interoperability

This work follows the timeline-precision primitives and is split into independently
testable slices:

- Source-player and timeline trimming with an explicit ripple toggle.
- Clipboard commands for cut, copy, and paste, preserving clip properties and source
  timing while generating new stable clip identifiers on paste.
- Append, insert, overwrite, lift, ripple delete, and replace operations on targeted
  tracks, with previews of affected ranges before destructive edits.
- Three-point editing using source In/Out plus a timeline In or Out point, including
  duration conflict feedback.
- Unlimited tracks with thumbnails/waveforms, rename/reorder controls, and visible
  hide, mute, solo, and lock states.
- Existing bounded undo/redo and autosave extended to every new edit command.
- MLT XML import/export as an optional local interoperability adapter: project XML,
  trimmed-clip XML, and complex MLT-as-clip playback when all referenced services and
  codecs are browser-supported. Unknown producers, filters, transitions, and paths
  are preserved where safe and reported as unsupported instead of silently changed.
- VideoSplat's JSON project remains the canonical lossless browser format. MLT XML
  support must not require a server, upload media, execute embedded commands, or
  resolve remote URLs automatically.

Browser constraints: Blender-style 3D title rendering and unrestricted FFmpeg format
support remain deferred. They would require large optional local runtimes and must not
become a network service or weaken the default zero-egress experience.

This plan intentionally establishes trust and rendering invariants before adding
broad editor surface area. Each phase ends with a demonstrable, tested slice.

## Phase 0 — Decisions, licenses, and acceptance fixtures

Deliverables:

- Confirm product name, license, browser support tier, and target deployment URL.
- Record architecture decisions for document schema, persistence, preview/export,
  model choice, and fallback codecs.
- Select an openly licensed face detector and tracking approach after accuracy,
  bundle-size, performance, bias, and license evaluation.
- Create consented/synthetic fixture clips covering one face, crowds, occlusion,
  profile views, cuts, motion blur, low light, and no-face false positives.
- Define measurable performance and detection-review baselines.
- Write the initial threat model, network inventory, privacy notice, and model card.

Exit gate:

- All dependencies/models have compatible documented licenses; fixtures may legally
  be stored and tested; architectural invariants are approved.

## Phase 1 — Static local-first shell

Deliverables:

- Scaffold Vite + React + TypeScript, linting, formatting, Vitest, and Playwright.
- Implement responsive editor shell, menu/toolbar, preview, inspector, media bin,
  timeline region, status bar, shortcuts dialog, and privacy indicator.
- Add PWA manifest, conservative service worker, local icons/fonts, strict CSP,
  security headers documentation, and offline smoke test.
- Add capability diagnostics and a user-readable privacy/storage panel.
- Add CI checks for build, tests, accessibility smoke checks, dependency licenses,
  and unexpected external URLs.

Exit gate:

- The empty app installs and reloads offline; automated browsing observes no
  third-party requests; keyboard navigation reaches every shell control.

## Phase 2 — Project document and local persistence

Deliverables:

- Define versioned project schema for assets, sequences, tracks, clips, text,
  captions, redactions, effects, keyframes, settings, and schema migrations.
- Implement command-based editing and bounded undo/redo history.
- Implement new/open/save-as, IndexedDB metadata, OPFS artifact storage, autosave,
  crash recovery, recent projects, storage estimates, and clear-data controls.
- Implement portable `.videosplat.json` project package/manifest and missing-media relink.
- Add content hashing so media is deduplicated and relinked without uploading.

Exit gate:

- Project round-trip and migration tests pass; a forced reload/crash recovers the
  last committed command batch; users can inspect and delete all stored data.

## Phase 3 — Media ingestion and preview engine

Deliverables:

- Import browser-decodable video, audio, and images by picker and drag/drop.
- Extract metadata, filmstrip thumbnails, waveforms, and optional proxy media in
  workers, storing only locally.
- Implement transport, scrubbing, frame stepping, loop range, zoom/pan, canvas
  presets, and feature-based codec diagnostics.
- Establish a scene graph and renderer adapter used by both preview and export.
- Add WebCodecs primary decode and HTML media fallback.

Exit gate:

- Fixture media imports, previews, scrubs, and restores after reload; generated
  resources are cleaned up; long operations remain cancellable.

## Phase 4 — Core nonlinear editing

Deliverables:

- Multi-track video/audio/image/text/caption objects.
- Add, move, trim, split, duplicate, delete, ripple delete, reorder, lock, hide,
  mute, solo, snap, multi-select, and linked audio/video behavior.
- Inspector controls for position, scale, rotation, anchor, opacity, crop, volume,
  fades, playback rate, and pitch-preservation capability.
- Timeline virtualization, filmstrips, waveforms, playhead, selection ranges, and
  keyboard editing commands.
- Keyframe engine with deterministic interpolation for scalar and 2D properties.

Exit gate:

- A user can produce and reopen a layered rough cut; every edit is undoable;
  timeline-engine tests run without React or media decoding.

## Phase 4.5 — Offline optimizer and editing proxies

Deliverables:

- Add an import preflight that reports source dimensions, duration, codec, size,
  storage headroom, and estimated editing cost.
- Offer local editing-proxy, smaller-share, tiny-review, and custom presets without
  modifying the original file.
- Implement worker-based WebCodecs decode/encode and same-origin muxing, with a
  separately loaded same-origin FFmpeg.wasm fallback where necessary.
- Allow the optimizer to run before project import or as a standalone video shrinker.
- Link proxies to originals by content hash and preserve source-relative clip timing.
- Allow proxy deletion, regeneration, download, and explicit proxy-based export.
- Test output duration, dimensions, bitrate tolerance, A/V sync, cancellation,
  storage exhaustion, and zero network egress.

Exit gate:

- A supported source can be converted entirely offline into a smaller playable copy,
  used as an editing proxy, reopened after reload, and removed without touching the
  original.

## Phase 5 — Local detection and redaction workflow

Deliverables:

- Worker-based local face detector with adaptive sampling and progress/cancel UI.
- Multi-face association, ephemeral feature vectors, confidence scoring, gaps, and
  stable track identifiers.
- Review workspace with identity thumbnails, low-confidence queue, include/exclude,
  merge/split, and jump-to-frame controls.
- Visual redaction objects supporting blur, pixelation, solid fill, shape, padding,
  feather, intensity, keyframes, interpolation, and manual correction.
- Arbitrary manual region tracking for non-face private information.
- Tests across cuts, transforms, retiming, overlapping faces, and partial analyses.

Exit gate:

- Users can analyze a fixture, fix misses/false positives, select who to redact, and
  preview deterministic results with the network disabled.

## Phase 6 — Local export and privacy verification

Deliverables:

- Chunked worker export through WebCodecs with local muxing; same-origin
  FFmpeg.wasm fallback for unsupported paths.
- MP4/WebM options based on detected codec support, plus resolution, frame rate,
  quality, audio, and range controls.
- Identical scene-graph/effect evaluation for preview and export.
- Preflight review: unanalyzed ranges, low-confidence gaps, disabled redactions,
  missing media, unsupported effects, storage headroom, and estimated output.
- Local export report containing settings, reviewed warnings, app/model versions,
  and a content hash without biometric identity data.
- Golden-frame, A/V sync, duration, cancellation, and independent-decoder tests.

Exit gate:

- A complete edited/redacted fixture exports locally, reopens in independent players,
  stays in sync, and matches preview reference frames within defined tolerance.

## Phase 7 — Quality, accessibility, and release hardening

Deliverables:

- Responsive tablet and limited phone workflows with explicit capability limits.
- WCAG-oriented keyboard, screen reader, contrast, zoom, reduced-motion, and live-
  region testing.
- Stress tests for long 1080p sources, many clips, concurrent redactions, low disk,
  revoked permissions, interrupted export, and crash recovery.
- Browser matrix for current Chrome/Edge primary and Firefox/Safari fallback tiers.
- Complete privacy audit, storage inventory, network inventory, security review,
  third-party notices, self-host guide, user guide, recovery guide, and release
  checksums.
- Verify that the production build functions from static/self-hosted deployment
  without a backend.

Exit gate:

- All release gates pass on supported browsers; known limitations are documented;
  production assets generate no unapproved egress.

## Post-V1 candidates

- On-device speech-to-text captions using a local Whisper-compatible model.
- Transcript-based edits and silence detection.
- Local license-plate/text-region detection.
- Motion tracking beyond redaction and a keyframe curve editor.
- Transitions, color correction, chroma key, background removal, and templates.
- Stable Editor API, sandboxed plugins, headless/browser automation, and scripting.
- Explicit, optional user-controlled cloud storage adapters; these require a new
  privacy review and must never be needed for core editing.

## Proposed repository shape

```text
videosplat/
  docs/
    architecture/
    privacy/
    decisions/
  public/
    icons/
    models/
    wasm/
  src/
    app/
    domain/
    commands/
    timeline/
    media/
    render/
    detection/
    export/
    persistence/
    workers/
    ui/
  tests/
    unit/
    integration/
    e2e/
    fixtures/
```

## Active implementation milestone — Timeline precision

Implement magnetic snapping, frame stepping, and user-managed tracks first. Follow
with drag-to-track, ripple delete, markers, and multi-selection once these primitives
are stable.

The milestone is complete only when:

1. `npm run build`, unit tests, and browser tests pass.
2. Clip motion snaps to the playhead and nearby clip edges, with a visible toggle.
3. Previous/next-frame controls seek by the configured project frame rate.
4. Users can add, rename, reorder, lock, and remove empty tracks.
5. Every timeline mutation remains undoable and is covered by engine/browser tests.
