# VideoSplat™

VideoSplat™ is DrawSplat's private, local-first video editor for the browser. The current milestone
implements the offline editor shell, versioned project documents, autosave,
recovery, portable project files, privacy diagnostics, zero-egress controls, and
local video/audio/image ingestion with metadata, thumbnails, waveforms, preview,
and initial timeline placement.

The timeline now supports clip selection, seeking, zoom, split, duplicate, delete,
numeric move/trim/source-offset editing, bounded undo/redo, and track visibility,
mute, and lock controls. The offline optimizer creates editing proxies or smaller
downloadable WebM copies without overwriting or uploading original footage; see
`docs/decisions/0002-local-video-optimization.md`.

VideoSplat also imports/exports SRT and WebVTT captions and renders the layered
timeline—including transforms, titles, effects, transitions, and mixed audio—to a
local WebM. Export uses browser Canvas, Web Audio, and MediaRecorder without uploads.

The local recorder captures a shared screen, camera, or screen with a camera overlay,
plus an optional microphone and browser-supported shared tab/system audio. Recordings
can be paused, resumed, canceled, or added directly to the media bin and timeline.
Permissions are requested only after the user presses Start recording; captured media
uses the same private browser storage and editing workflow as imported files. The
launch checklist grants permission before device discovery, lets the user choose a
specific headset microphone, and carries that choice into the recorder.
Screen-only recording preserves the browser display track directly so capture
continues when the user switches to the selected tab; camera-overlay composition
is documented as requiring VideoSplat to remain visible.
The browser screen-share chooser opens directly from the Start recording gesture;
the optional countdown begins only after the user has selected a capture source.
Camera/microphone readiness and the selected input are remembered in session
storage after splash setup. The recorder distinguishes this reusable session grant
from the browser-mandated screen/tab chooser required for every display capture.
After capture stops, a local visual crop review lets the user drag over the
recorded frame, apply common crop presets, and either re-encode only that region
or keep the full recording before adding it to the timeline. Crop re-encoding
preserves the recording's decoded microphone/system-audio track directly, with a
Web Audio compatibility fallback where media-element capture is unavailable.

## Development

```bash
npm install
npm run dev
```

Verification:

```bash
npm test
npm run build
npm exec --bin-links=false playwright install chromium
npm run test:e2e
```

See `PRODUCT_ANALYSIS.md`, `IMPLEMENTATION_PLAN.md`, and
`docs/privacy/PRIVACY_AUDIT.md` for product and privacy decisions.
Release boundaries and recovery procedures are documented in
`docs/BROWSER_SUPPORT.md`, `docs/NETWORK_INVENTORY.md`, and
`docs/USER_RECOVERY_GUIDE.md`.

The production app is hosted at `/solutions/videosplat/` and is designed for static
hosting with no required backend.

## License

VideoSplat is part of DrawSplat and is licensed under AGPL-3.0-or-later.
