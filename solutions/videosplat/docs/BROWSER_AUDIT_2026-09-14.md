# VideoSplat browser audit — September 14, 2026

## Scope

Production builds tested on Linux using Google Chrome 153.0.8010.36 and
Playwright Firefox 153.0. The installed desktop Firefox is 155.0.1; its hardware
capture and interactive screen chooser were not automated.

Both engines now run the full browser suite: loading, offline reload, permission
failures, recorder controls and popup docking, WebM import/duration, preview
seeking, timeline editing/transforms, autosave, captions, subtitle burn-in,
audible recording/cropping, optimization, WebM/MP4 export, cancellation and retry.

## Results

Final run: 74 unit tests passed; 84 browser tests passed across Chrome and
Firefox; six optional speech-model cases skipped. TypeScript and the production
build passed.

## Reproduced bugs fixed

- Silent Firefox recording/export could hang: Opus was declared without an audio
  track. A native reproduction did not finalize with `video/webm;codecs=vp8,opus`,
  but finished promptly with `video/webm;codecs=vp8`. Codec selection now matches
  the actual recording tracks or export audio setting.
- Optimization removed sound in both browsers: the media element was muted before
  audio routing. It now preserves audio, resumes its audio context, and keeps the
  decoder attached. Tests measure the decoded output's duration and RMS amplitude.
- Closing optimization did not cancel it: unmount now aborts, and success, cancel,
  and error paths release tracks, audio context, callbacks, and temporary media.
  Controls are disabled during encoding, old results cleared, and errors shown.
- Unexpected capture stops left the timer running: the preceding investigation
  added automatic interruption detection, incomplete-recording warnings, review
  of recoverable footage, guarded stop requests, and encoder-error cleanup.

## Test corrections

The transform test compares computed CSS instead of engine-specific serialization.
Popup docking checks the window-close event and surviving editor, accounting for
Firefox closing the clicked window before acknowledging the click.

Firefox's worker could not load FFmpeg through the previous test interception.
Vite development/preview now serves the shared engine at its real production path.
This was a test/development serving failure, not evidence of a production MP4 bug.
Service-worker registration also tolerates being blocked by the test browser.

## Limits

Six optional cases require downloaded speech models or a supplied GGML model.
Standard generation tests use controlled model responses; model accuracy is not
covered. Recording tests use synthetic sources instead of hardware capture.

The user's original 7–8-minute Firefox recording cutoff remains unreproduced.
An eight-second transcription/export check retained its duration in both engines.
A separate 75-second Chrome screen capture retained its final frame at 74.947
seconds while another tab was active. These results do not prove the cause of
the original loss or guarantee long recordings on every machine.

## Reproduce

```sh
npm install
node node_modules/playwright-core/cli.js install chromium firefox
npm test
npm run test:e2e -- --workers=2
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to test an installed Chrome binary.
