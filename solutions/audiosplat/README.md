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
Generated progress can be resumed; download reviewed edits before closing the
dialog or replacing the source. Cancel generation or close the dialog to stop the worker.

English speech recognition runs locally using the shared subtitle engine. First
use downloads the selected Whisper model (Tiny ≈42 MB, Small ≈250 MB, Medium ≈990 MB, or optional Large v3 Turbo ≈1.1 GB) from Hugging Face, cached when browser
storage allows. Audio and transcript text are never uploaded. Limits: 120 minutes (2 hours)
and 512 MB per file. Codec support depends on your browser. Automatic transcripts
need review; silent/undecodable files show an error.

Rebuilding also requires the sibling `solutions/shared/subtitles` package. See
its README for model attribution, licensing, privacy, and caching details.

### Long recordings and resuming

Streaming transcription processes at most 25 seconds of decoded audio at a time.
Completed sections are saved on this device when browser storage allows. After
cancelling, closing, or reloading, select the same file and generate again to
resume. **Start over** regenerates from the beginning. Partial SRT/text downloads
are available during processing and use `.partial` filenames. Review controls
show 50 captions per page; exports include all generated captions.

Progress contains generated text/timing, not source audio. Resume is available
for 30 days; saves retain at most 20 recent recordings/ranges and prune expired
entries. Clear the site's browser data to remove it. Download reviewed edits to
keep them; checkpoints store the original generated text. If saving fails, the
interface reports it and downloads remain available.

The two-hour limit requires a stream-decodable format in your browser. A legacy
fallback supports whole-file decoding only for sources up to 30 minutes and
64 MiB; it never loads multi-hour recordings as one decoded buffer.

Choose **English speech model** before generating: Small is the default balance of accuracy and speed, Tiny is fastest, Medium offers a larger accuracy-focused engine, and Large v3 Turbo is an optional advanced choice for capable desktops. Unselected models do not load or run; keeping these choices does not slow down transcription with another model. All run locally. Larger models need more memory and time. Your choice is remembered, and saved progress is separate for each model; choose Tiny to restore transcripts made before model selection was added.

To use a model already on your device, select **English speech model → Use local
GGML model (.bin)…**, choose your Whisper `.bin` file, and generate. This uses the
bundled whisper.cpp engine, with no model download or upload. Models may be up to
2 GB; Medium needs substantial memory and can take much longer than the recording. Smaller or quantized
models are more suitable for limited devices. Reselect the model after reopening
to resume saved progress. GGUF/ONNX files are not supported by this option.
