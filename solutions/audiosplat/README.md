# AudioSplat

AudioSplat is DrawSplat's browser-based multitrack audio recorder and editor.
Recording, editing, effects, autosave, project files, and audio export are
processed locally; no account or backend is required. A user may explicitly
authorize the narrow Google Drive `drive.file` scope to upload an exported mix
and may optionally create an Anyone-with-the-link URL and Drive preview iframe.

## Features

- microphone and supported browser-tab/device-audio recording
- automatic new tracks for successive recordings
- waveform range selection, clip dragging between tracks, split, trim,
  duplicate, delete, zoom, undo, and redo
- multitrack mute, solo, volume, pan, arrangement, and mix playback
- Amplify, Adjustable Fade, Bass/Treble, Echo, Fade In/Out, Noise Gate, Noise
  Reduction, Normalize, Reverb, Silence, and Truncate Silence effects
- MP3 and WAV export plus Ogg/Opus, WebM/Opus, and M4A/AAC where supported
- tab-isolated IndexedDB autosave and portable AudioSplat project downloads
- optional Google Drive save, share link, and embed code
- six-language DrawSplat interface and responsive phone/tablet/desktop layout

## Download and self-host

Download `audiosplat-selfhost-<version>.zip` from the DrawSplat
[Download page](../../pages/download.html) or GitHub Releases. Unzip it into a
web root and serve `/solutions/audiosplat/` over HTTPS.

The hosted production OAuth client authorizes Google Drive from
`https://drawsplat.org`. A different domain must create its own Google OAuth
Web client, add the self-host origin, enable Google Drive API, declare the
non-sensitive `https://www.googleapis.com/auth/drive.file` scope, replace
`GOOGLE_CLIENT_ID` in `src/main.ts`, and rebuild.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

The production app is hosted at `/solutions/audiosplat/`. The canonical product
and release checklist is in `docs/plan.md`.

## License

AudioSplat is part of DrawSplat and is licensed under AGPL-3.0-or-later.

## Audio transcription

Open **File → Transcribe audio…**, choose an MP3, OGG, M4A, WAV, or other
browser-decodable audio file, then click **Generate transcript**. Review/edit the
words and timestamps and download **SRT** or a **plain-text (.txt) transcript**.
This separate file workflow leaves your current project, clips, and mix unchanged.
Transcripts are temporary; download them before closing the dialog or replacing
the source. Cancel generation or close the dialog to stop the worker.

English speech recognition runs locally using the shared subtitle engine. First
use downloads about 42 MB of model files from Hugging Face, cached when browser
storage allows. Audio and transcript text are never uploaded. Limits: 30 minutes
and 512 MB per file. Codec support depends on your browser. Automatic transcripts
need review; silent/undecodable files show an error.

Rebuilding also requires the sibling `solutions/shared/subtitles` package. See
its README for model attribution, licensing, privacy, and caching details.
