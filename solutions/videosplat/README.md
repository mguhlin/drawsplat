# VideoSplat

VideoSplat is DrawSplat's private, local-first video editor for the browser. The current milestone
implements the offline editor shell, versioned project documents, autosave,
recovery, portable project files, privacy diagnostics, zero-egress controls, and
local video/audio/image ingestion with metadata, thumbnails, waveforms, preview,
and initial timeline placement.

The timeline now supports clip selection, seeking, zoom, split, duplicate, delete,
numeric move/trim/source-offset editing, bounded undo/redo, and track visibility,
mute, and lock controls. A planned offline optimizer will create editing proxies or
smaller downloadable copies without overwriting or uploading original footage; see
`docs/decisions/0002-local-video-optimization.md`.

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

The production app is hosted at `/solutions/videosplat/` and is designed for static
hosting with no required backend.

## License

VideoSplat is part of DrawSplat and is licensed under AGPL-3.0-or-later.
