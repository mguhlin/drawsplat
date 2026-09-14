# Recording startup follow-up — September 14, 2026

## Report and findings

The user selected Share in Chrome and returned to the unchanged recorder setup
screen, without a countdown or visible error. The earlier screenshot also showed
a canceled-screen-selection status. Screenshots alone cannot establish the
underlying browser/device error.

Code inspection found that all startup AbortErrors were silently classified as
screen-picker cancellation, including errors after screen selection (for example,
opening the microphone). Startup also waited for preview playback even when the
recording uses the direct video track, and Start remained enabled until countdown.
Window and monitor preferences were omitted from getDisplayMedia's video options.

## Changes

- Send browser/window/monitor displaySurface preferences to the chooser. Chrome's
  chooser still determines the actual source. This follows the
  [Chrome screen-sharing controls documentation](https://developer.chrome.com/docs/web-platform/screen-sharing-controls).
- Make direct-track recording independent of a pending preview play promise.
  Attach temporary preview decoders to the document, wait for available frames
  before drawing, and remove them during cleanup. Composition still requires
  playback, with a bounded wait and an actionable error.
- Lock setup during startup, show permission/device/countdown progress, and display
  stage-specific failures inline. Preserve browser AbortError details instead of
  silently calling every failure a canceled screen chooser.
- Cancel late startup results after close and release output tracks on failure.
- Advance the service-worker shell cache to v25 and rebuild published assets.

## Validation

Unit regressions cover duplicate starts, startup failure/retry, closing while
startup is pending, and surface preferences. Browser regressions use synthetic
media with native MediaRecorder: screen recording progresses with and without
microphone audio even when preview play never resolves, saved footage imports,
and an injected microphone AbortError is visible and releases the screen track.
These tests exercise startup behavior, not the native screen chooser or the
user's particular microphone. The reported hardware/session failure has not been
reproduced directly.

Release checks: 77 unit tests passed; 90 Chromium/Firefox browser tests passed,
with 6 optional speech-model cases skipped. TypeScript and production build passed.
