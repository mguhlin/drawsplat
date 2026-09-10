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
Composition export keeps decoders attached off-screen and mixes every active clip
through dedicated Web Audio gain nodes on a stable clock and a master peak
limiter, preventing microphone audio loss, clipping, or stutter. WebM renders
directly; MP4 and OGM are converted locally through the self-hosted MediaSplat
engine, with no media uploaded.

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
The recorder uses a compact, non-scrolling setup layout on shorter laptop and
tablet viewports while retaining the larger preview on taller screens.
Large Browser tab, Application window, and Entire screen cards provide a clear
display-surface preference before the browser's mandatory secure chooser opens.
After capture stops, a local visual crop review lets the user drag over the
recorded frame, apply common crop presets, and either re-encode only that region
or keep the full recording before adding it to the timeline. The crop encoder
keeps its decoder attached off-screen and routes the recording's decoded
microphone/system audio through a stable Web Audio clock to prevent stutter, with
direct media-track capture as a compatibility fallback.
MediaRecorder WebM files with missing duration headers are probed to their encoded
end during import so cropped recordings retain their full timeline length instead
of receiving the generic ten-second fallback.

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

## Burn in subtitles

Choose **File → Burn in subtitles…**, select an SRT/VTT file, and adjust font size, bottom margin, outline, optional black background, and timing offset. Add the captions to the timeline and preview them. In **File → Export video…**, keep **Burn in subtitles** checked to make visible captions permanent in the output; uncheck it to export without captions. Hidden caption tracks are excluded. Captions remain editable in saved projects, and **Save captions as SRT** still exports a separate subtitle file.

Sizes and margins scale from a 1080p reference. Positive timing offsets delay captions; negative offsets advance them and clip cues at time zero. Imports use plain text (formatting tags are removed). In VideoSplat, timing is relative to the project timeline, and imports append to existing captions. Burn-in requires re-encoding and can take time on long videos. This feature imports existing subtitles; it does not transcribe audio.

## Timeline view and recording sound

The fixed timeline toolbar includes **− / +** to shrink or enlarge only the timeline view, and **Fit timeline** to show the full sequence. Zoom does not change clip duration, output resolution, or the video preview.

The recorder remembers the chosen microphone across recorder openings in the browser session and shows an audio level meter, including in its floating controller. If it reports no audio, check the selected microphone and whether shared-tab sound is enabled. New recordings are appended after existing clips, and the playhead moves to the new recording for review. Starting the recorder pauses existing timeline playback. After stopping, use **Play recording with sound** to check the recording before adding it to the existing timeline. Exports stop with an error if an audio source cannot be connected, rather than silently continuing without it.

## Automatic subtitles

Select a video or audio clip on the timeline, then choose **File → Generate subtitles…**. In the recorder review, you can also check **Generate subtitles when adding this recording (English)**. Review the words and timing, download a clip-relative SRT, or add a new caption track at the clip’s timeline position. Use **File → Save captions as SRT** for project-relative timestamps and the export dialog to burn captions into video.

English speech is transcribed locally. First use downloads a roughly 42 MB speech model from Hugging Face; the app also loads its bundled speech engine. Model files are cached when storage permits. No media or caption text is uploaded. Requires browser-decodable audio, up to 30 minutes per clip and 512 MB per file. Progress and cancellation are available; automatic captions need review.

Rebuilding requires the sibling `solutions/shared/subtitles` source package, included in self-host bundles. See its README for model licensing, privacy, cache behavior, and detailed limits.

Export progress uses an animated purple bar with a percentage and elapsed time. After enough progress is available, it estimates the current stage’s remaining time and total in minutes or hours. WebM renders the timeline in real time; MP4 and OGM show timeline rendering and local conversion as separate stages with separate estimates. Estimates adapt to the measured speed and pause when progress updates stop arriving. Cancel stops rendering or conversion, and you can retry the export.
