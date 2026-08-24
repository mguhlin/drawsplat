# MediaSplat™

MediaSplat is a private, browser-based media splitter, trimmer, and joiner. It runs a same-origin FFmpeg WebAssembly build inside the browser; source media is not uploaded.

## Features

- Trim one exact range or make fast, lossless keyframe-aligned cuts.
- Split into equal parts, arbitrary hours/minutes/seconds, 5/6/10-minute presets, approximate MB/GB targets, or custom ranges.
- Join compatible streams without re-encoding or normalize mismatched inputs to MP4/MP3.
- Process MP4, M4V, MOV, MKV, WebM, AVI, WMV, OGG/OGM, MP3, WAV, FLAC, MPEG transport streams, and other formats included in the bundled FFmpeg core.
- Reorder inputs, cancel processing, monitor progress, download each result, or package all split parts into one local ZIP.
- Installable offline PWA after the app and processing engine have been cached.

## Important behavior

Fast mode copies compressed streams and does not reduce quality. Cuts can move to nearby keyframes, and joined inputs must have matching codecs and stream properties. Precise/Normalize mode re-encodes video to H.264/AAC MP4 and audio to MP3.

Size splitting estimates time boundaries from the source file's average bitrate. Variable bitrate, keyframe alignment, metadata, and container overhead mean output sizes are targets rather than hard maximums. For strict upload limits, choose a target below the service limit and verify each downloaded file.

A file may be processable even when the browser cannot preview it. MediaSplat labels that state as **Process only**.

## Development

```bash
npm install --bin-links=false
npm test
npm run build
npm run test:e2e
```

The production app is hosted at `/solutions/mediasplat/` on static HTTPS hosting. No backend is required.

## License

MediaSplat source is AGPL-3.0-or-later. FFmpeg and codec licensing details are recorded in [docs/credits.md](docs/credits.md).
