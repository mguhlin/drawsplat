# Media app browser audit — September 14, 2026

## Coverage and environment

All three apps now run their standard browser suites in both Chromium and Firefox.
Tests used installed Chrome 153.0.8010.36 on Linux, Playwright Firefox 153.0 for
VideoSplat, and Firefox 150.0.2 supplied by the other apps' pinned Playwright 1.60.
Production smoke checks also use Chrome 153 and Firefox 153. The installed
interactive Firefox 155.0.1 and real hardware capture choosers were not automated.

VideoSplat's separate [audit](../solutions/videosplat/docs/BROWSER_AUDIT_2026-09-14.md)
describes its recording, optimization, and export fixes. Commit `3ae8c2e` was
pushed and its production deployment verified before auditing the other apps.

AudioSplat coverage includes language/RTL, shortcuts, menus, microphone and shared
audio capture, import, timeline edits and effects, undo, WAV/MP3 export, autosave
isolation, transcription UI and cancellation, local-model selection, and mocked
Drive save/sharing. No real Drive upload or sharing operation was performed.

MediaSplat coverage includes trim/split/join, ZIP output, duration recovery,
landscape/portrait subtitle burn-in to real MP4, repeated processing, cancellation
and retry, transcription controls/progress/resume, and local-model selection.

## Final local results

| App | Unit tests passed | Browser tests passed | Optional cases skipped |
| --- | ---: | ---: | ---: |
| VideoSplat | 74 | 84 | 6 |
| AudioSplat | 7 | 50 | 4 |
| MediaSplat | 32 | 48 | 12 |

TypeScript and production builds passed. The skipped cases require speech-model
or long-audio fixtures, as described below.

## AudioSplat fixes

- Its recording clock included time spent paused. It now freezes on pause and
  excludes paused time after resume; a browser test checks both behaviors and
  verifies the recording still becomes an editable clip.
- Its service worker deleted every other cache on the origin during activation.
  Cleanup now applies only to older AudioSplat caches, preserving other DrawSplat
  apps and cached speech models. A regression test checks the cache boundary.
- Browser tests build the production shell first and include Firefox, using fake
  media devices appropriate to each browser.

## MediaSplat fixes

- Chrome did not discover duration for streamed WebM without a duration header;
  trim remained at its 10-second default and automatic splitting was unavailable.
  Metadata inspection now seeks to the encoded end, accepts only a finite reported
  duration, and releases its temporary decoder. A two-second synthetic fixture
  tests the full trim range and successful splitting in both browsers.
- Canceling while FFmpeg was downloading could mark a discarded engine as loaded,
  making retry fail with “ffmpeg is not loaded.” Loading now uses an abort signal,
  captures its engine instance, rejects stale completion after cancellation, and
  resets failed instances. Browser tests delay the engine download, cancel, and
  verify that retry produces an output file.
- The offline cache version advances so the revised app shell is installed.

## Limits

Optional tests that download real speech models or require externally supplied
GGML/two-hour fixtures remain opt-in. Standard transcription tests validate UI,
audio decoding, progress, and cancellation with controlled model responses; they
do not certify speech accuracy. Hardware, extensions, sleep, memory pressure, and
7–8-minute screen capture remain outside the automated suite. No test fixture
contains the user's private recording, and the original Firefox cutoff was not
reproduced.
