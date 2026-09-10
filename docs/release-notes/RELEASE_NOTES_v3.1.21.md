# DrawSplatTM v3.1.21 — Subtitle burn-in

Released September 10, 2026.

MediaSplat and VideoSplat can now burn imported SRT or VTT subtitles permanently into exported video. Media stays on the device; no account or upload is required for this workflow.

## MediaSplat

Choose **Subtitles**, select a video and subtitle file, then choose **Burn subtitles to MP4**. The output is H.264/AAC MP4. Controls include font size, bottom margin, outline, optional black background, and a timing offset. A licensed DejaVu Sans font is bundled for local rendering. Subtitle layout accounts for landscape, portrait, and rotation metadata.

## VideoSplat

Choose **File → Burn in subtitles…** to import styled captions into the timeline. Preview and export share the subtitle renderer, including wrapping and resolution scaling. Keep **Burn in subtitles** enabled in the export dialog to make visible caption tracks permanent in the result; disable it to export without captions. Hidden caption tracks are excluded. Captions stay editable in saved projects, and separate SRT export remains available under Edit.

## What to know

- Positive timing offsets delay subtitles; negative offsets advance them.
- Font sizes and margins scale from a 1080p reference.
- Imports use plain text; formatting tags are removed. This imports existing subtitles and does not transcribe audio.
- Burn-in re-encodes video. Long recordings can take time in the browser.
- VideoSplat subtitle timing is relative to the project timeline. Imports append to existing captions; remove the old caption track first when replacing subtitles.

## Downloads and validation

All twelve self-host ZIPs have been rebuilt from the current repository, including standalone MediaSplat and VideoSplat, DrawSplat Tools, and the full DrawSplat package. Other existing tools, including PDFsplat, remain included in the applicable packages. Verify downloads with `SHA256SUMS-v3.1.21.txt`.

Validation for the subtitle implementation: 71 unit tests and 11 browser tests passed. Tests decoded actual exported frames, checked landscape and portrait MP4 output, repeated MediaSplat export, and verified VideoSplat exports with burn-in enabled and disabled.
