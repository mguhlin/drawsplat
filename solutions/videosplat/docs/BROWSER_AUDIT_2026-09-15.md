# VideoSplat browser and historical bug audit — September 15, 2026

## Scope

Reviewed current VideoSplat and the September 14 recording/browser audits, then
exercised editing, storage, recording, audio, cropping, green screen, optimization,
exports, cancellation, and responsive controls. Local baseline was commit 3e5fd2a.

Test engines: actual Google Chrome 153.0.8010.36 on Linux, Playwright Firefox 153.0,
and Playwright WebKit 26.5. The installed desktop Firefox 155.0.1 was not automated.
Phone checks use Pixel 7 / iPhone 13 emulation and a 390×844 Firefox touch viewport.
No physical Android or iPhone was available. Emulation exposes desktop APIs, so
missing screen capture and encoder support are also explicitly simulated.

## Findings and fixes

| Finding | Evidence | Result |
| --- | --- | --- |
| Media library and inspector inaccessible on phones | Both panels hidden in all three initial mobile probes | Media / Preview / Clip controls switcher keeps each pane reachable; timeline stays present. |
| Recorder offers unavailable screen capture | Setup defaulted to screen without checking getDisplayMedia | Defaults to camera when appropriate; unavailable modes disabled and alternatives explained. Missing WebM support disables Start with an explanation. |
| Dismissed crop could later add a recording | No cancellation signal; async completion always called onAdd | Closing aborts decoding/rendering, stops tracks, removes decoder, and blocks late timeline additions. Unit and browser regressions cover this. |
| Export could wait forever on stalled decoding or drawing failure | Decoder waits had no timeout/abort; animation callback exceptions could escape | Cancellable, bounded decode waits; decoder cleanup on errors; render/encoder failures report an error and permit retry. |
| WebKit import failed in this environment | Blob/File IndexedDB writes returned UnknownError; ArrayBuffer writes succeeded | Retry Blob serialization failures using typed byte storage; read both representations. Quota errors do not trigger a full-memory retry. Import, green-screen editing and reopening saved media pass in WebKit. |
| Firefox sometimes omitted the final second of optimized video | Two-second fixture intermittently exported 1.0135 seconds. Event trace showed stop preceding a final nonempty dataavailable event | Shared final-chunk collector allows a 100 ms quiet period after stop, resetting when queued data arrives. Used by capture, crop, optimizer and exporter. Deterministic event-order unit test plus repeated real Firefox exports cover it. |

The WebKit storage fallback can allocate an additional in-memory copy. Phone
memory limits still matter for large videos; original files should be retained.
The 100 ms drain addresses the observed queued-event ordering, not arbitrary
encoder stalls or a browser process being killed.

## Historical reports

- Firefox silent recording/export hangs: existing codec selection omits Opus for
  video-only streams. Regression coverage retained.
- Silent optimizer output / detached audio decoder: existing attached decoder and
  Web Audio routing retained; decoded output audio checked again.
- Unexpected recorder stop leaving the timer running: existing recovery path
  retested with audio/no audio and delayed preview startup.
- Permission/startup failures and duplicate Start: existing error, retry,
  cancellation, and startup locking tests retained.
- Reported 7–8-minute Firefox cutoff: **not reproduced** in two nine-minute
  synthetic recordings on the baseline. Chrome recorded in a background tab;
  Firefox remained foreground. Chrome video/audio durations were 541.271 / 541.200
  seconds; Firefox 541.226 / 541.2135 seconds. Both retained the changed final blue
  frame and audible final second (RMS approximately 0.71 / 0.70). This does not
  establish the cause of the original report or validate hardware, device sleep,
  native screen pickers, or all long sessions. Final-chunk handling changed after
  this baseline soak and receives separate short recording/export regression tests.

## Browser usability assessment

| Browser | Verified here | Remaining limits |
| --- | --- | --- |
| Desktop Chrome | Main workflow suite, keyed video/audio export, synthetic camera, background nine-minute capture | Native sharing permissions, real devices, platform-specific shared audio |
| Desktop Firefox | Main workflow suite, keyed export, audio, recovery and foreground nine-minute capture | Final-chunk race addressed; codecs and screen audio still platform-dependent; no physical microphone/camera test |
| Android Chrome / Firefox | Phone layout, pane switching, image import/keying, saved-project media reload and capability fallback in emulation | Actual Android camera, touch dragging, hardware codecs, memory pressure and background suspension unverified |
| iPhone / Safari | WebKit phone layout, image import/keying/storage reload and unsupported-recorder guidance | This WebKit environment offers no WebM encoder; native Safari versions may differ. No iPhone recording/export claim |

Screen sharing is not universally available, and audio capture depends on browser,
OS and selected surface. Runtime feature/codec checks are more reliable than a
browser-name guess. See [MDN getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
and [MDN isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).

## Reproduction commands

From `solutions/videosplat`:

```bash
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm run test:e2e -- --workers=2
node node_modules/playwright/cli.js install webkit
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node node_modules/@playwright/test/cli.js test -c playwright.mobile.config.ts
VIDEOSPLAT_SOAK=1 npm run test:e2e -- tests/e2e/recording-soak.spec.ts
```

The regular suite skips the nine-minute soak and optional real speech-model tests.
Model accuracy, actual camera permissions and physical mobile behavior require
separate testing.

## Validation results

- Production build and TypeScript checks passed; existing bundle-size advisory remains.
- 89 unit tests passed.
- 108 Chrome/Firefox browser tests passed; 8 skipped (6 optional model checks,
  2 opt-in soak entries).
- 12 phone-emulation cases passed across Chrome, Firefox and WebKit. The final
  mobile run also included 8 duplicate desktop cases, all passing.
- Five consecutive Firefox optimizer duration/audio runs passed after final-chunk
  collection changed. Before that fix, a three-run repeat failed once, and the
  first attempted frame-startup fix still failed once in five runs.
- Two nine-minute baseline soak tests passed, with the limitations described above.
- Mobile screenshot inspected for viewport fit and panel navigation.
