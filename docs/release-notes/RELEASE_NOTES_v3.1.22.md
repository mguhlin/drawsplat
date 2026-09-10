# DrawSplat v3.1.22 — Automatic subtitles

Released September 10, 2026.

VideoSplat and MediaSplat now generate editable English subtitles from speech
locally. First use downloads a roughly 42 MB public Whisper model from Hugging
Face. Audio, video, and caption text stay on the device. The model is cached when
storage permits; cached transcription works offline.

- **VideoSplat:** select a video or audio timeline clip → File → Generate subtitles.
  Review text and timing, download clip-relative SRT, or add a separate caption
  track at the clip's project position. The recorder review also offers generation
  when adding a full or cropped recording. Existing captions are preserved.
- **MediaSplat:** Subtitles → load video → Generate subtitles. Edit captions,
  download SRT, or use them for the existing local MP4 burn-in export.
- Progress, cancellation, empty/silent-audio checks, and editable timestamp
  validation are included. Current limits: English, browser-decodable audio,
  30 minutes per clip, 512 MB per source file. Automatic results need review.
- VideoSplat's timeline controls remain visible during horizontal scrolling.
  Zoom −/+, plus Fit timeline, change the timeline view only.
- Recording microphone choice is remembered. An audio meter and audible review
  help catch silent recordings before adding them. Export reports audio graph
  connection failures. These checks cannot restore audio already missing.
- MediaSplat's subtitle-background checkbox is aligned with its label.

All twelve self-host ZIPs are rebuilt with checksums. Standalone media apps,
Tools, and the full package include the speech runtime and shared source package.
Model downloads remain on-demand instead of being embedded in every ZIP.

Verification: unit tests for caption timing, silence, and timeline offsets;
browser checks for recording-triggered generation, editing, SRT export,
cancellation, and silent inputs; actual Whisper transcription in both apps;
cached offline transcription; MediaSplat MP4 export with edited generated text.

Captions are independent timeline clips. Later moves or trims of a source video
do not automatically move its caption track. VideoSplat's generation dialog saves
clip-relative SRT; File → Save captions as SRT saves project-relative timestamps.

[Walkthrough](../../blog/automatic-subtitles.html) ·
[Previous release](RELEASE_NOTES_v3.1.21.md)
