# MediaSplat™

Current self-host release: **v3.1.24** — animated processing progress and time estimates. [Downloads](../../pages/download.html) · [Release notes](../../docs/release-notes/RELEASE_NOTES_v3.1.24.md)


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

## Video size, length, and processing limits

These limits are also available from **About** in the app header.

| Operation | Current limit or behavior |
| --- | --- |
| Generate automatic captions | Up to 120 minutes (2 hours) and 512 MB per source file. English speech and browser-decodable audio are required. |
| Trim, split, join, or burn in existing subtitles | No fixed app-level file-size or duration cap. Available browser memory and storage determine practical limits; large files can still fail. |
| Resolution and frame rate | No fixed app-level cap for these processing tools. Higher resolutions increase memory and encoding demands. |
| Automatic splitting | Equal-parts, by-time, and by-size splitting support up to 100 output parts. |
| Split by size | MB/GB targets are estimates based on average source bitrate, not guaranteed maximum sizes. Check each downloaded file. |

For automatic captions on a longer or larger video, **split the video, download
the parts, and load each part separately**. Each part must be no longer than
120 minutes (2 hours) and no larger than 512 MB. The caption limits do not apply when
importing an existing SRT/VTT file for burn-in. Unlike VideoSplat's timeline
importer, MediaSplat does not impose a general 512 MB input limit.

Fast, lossless cuts and joins avoid re-encoding. Precise cuts, normalized joins,
and subtitle burn-in re-encode locally. Processing time depends on the source,
codec, resolution, and device; there is **no fixed minutes-per-minute rule**.
Keep the tab open until processing finishes. Browser memory holds input and
output data, so several large join inputs or split outputs can exhaust memory.

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

## Burn in subtitles

Choose **Subtitles**, select a video and an SRT/VTT file, adjust font size, bottom margin, outline, optional black background, and timing offset, then choose **Burn subtitles to MP4**. The output is H.264/AAC MP4 with permanently visible subtitles. The bundled DejaVu Sans font and FFmpeg engine run locally.

Sizes and margins scale from a 1080p reference. Positive timing offsets delay captions; negative offsets advance them and clip cues at time zero. Imports use plain text (formatting tags are removed). In VideoSplat, timing is relative to the project timeline, and imports append to existing captions. Burn-in requires re-encoding and can take time on long videos. To transcribe speech before burn-in, use Automatic subtitles below.

## Audio and video transcription

Choose **Transcribe**, load an MP3, OGG, M4A, WAV, or other browser-decodable audio/video file, and click **Generate subtitles**. Review and edit the words and timing, then choose **Download SRT** for timed captions or **Download transcript (.txt)** for text without timestamps. This does not require converting audio to video or burning captions. Replacing/removing the source or switching tools cancels generation and clears its captions.

Transcription uses the same local English speech engine and limits described below. Codec support depends on your browser; an undecodable or silent file displays an error.

## Automatic subtitles

Choose **Subtitles**, load a video, then click **Generate subtitles…**. Review and edit the text and timing. Download SRT directly, or choose **Use subtitles for burn-in** followed by **Burn subtitles to MP4**.

English speech is transcribed locally. First use downloads the selected Whisper model (Tiny ≈42 MB, Small ≈250 MB, Medium ≈990 MB, or optional Large v3 Turbo ≈1.1 GB) from Hugging Face; the app also loads its bundled speech engine. Model files are cached when storage permits. No media or caption text is uploaded. Requires browser-decodable audio, up to 120 minutes (2 hours) per clip and 512 MB per file. Progress and cancellation are available; automatic captions need review.

Rebuilding requires the sibling `solutions/shared/subtitles` source package, included in self-host bundles. See its README for model licensing, privacy, cache behavior, and detailed limits.

## Processing progress and time estimates

Burn-in displays an animated purple progress bar, percentage, elapsed time, and
approximate remaining/total time in minutes or hours and minutes. Estimates start
after enough real encoding progress has arrived: total time ≈ elapsed / completed
fraction. They vary with video resolution, duration, codec, and device speed.
There is no universal minutes-per-minute multiplier. If encoding updates stop,
the UI reports that it is waiting and hides the estimate. Animation indicates an
active operation in the interface, not proof that the encoder is advancing.
The percentage reaches 100% only after the output is ready to download.

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
