# Firefox cutoff follow-up — September 15, 2026

The user's latest report was an early Firefox cutoff, possibly associated with generating subtitles. The exact stopped operation and elapsed time have not yet been confirmed. This follow-up fixes a reproduced interruption path; it does not establish that this was the cause of every reported cutoff.

## Reproduced defect: automatic update reload

`src/main.tsx` registered a `controllerchange` listener that called `window.location.reload()` once per tab session when an existing offline worker was replaced. Activating an update while recording discarded the recorder and its unsaved in-memory chunks. The same activation while generating subtitles discarded the job and dialog.

Before the fix, both new Firefox regression tests failed: the document load counter changed from 1 to 2 after activation. Reproduction uses the real production app and native browser encoding, a synthetic screen stream, and an injected service-worker activation event with an existing controller. Subtitle inference uses a deterministic worker double; media decoding is real.

A separate native-worker probe confirmed the same behavior without a simulated worker event: Firefox 153.0 loaded the original production bundle under an actual registered worker, started recording, then installed a changed worker script. Activation at 20:58:38.463 UTC was followed by navigation at 20:58:38.495 (32 ms later); the load count rose from 2 to 3 and the recorder disappeared. With the fixed bundle, a real activation left the load count at 2 and the recorder running. The media source was still synthetic.

The update no longer reloads the page automatically. New app code takes effect on the user's next open/reload. Offline registration failures are caught without interrupting the editor. Shell cache and registration URL advance to v28.

[MDN documents controllerchange](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event) as the event raised when the registration acquires a new active worker; it does not require a page reload.

## Subtitle timing

The recorder's subtitle checkbox does not start inference during capture. It is read after Stop, when the recording is imported into the timeline. Thus subtitle work is not a direct running-capture stop trigger in this path. Model memory usage or failures after recording remain a separate possibility and are not ruled out by tests with a worker double.

## Validation

- Baseline unit tests: 89 passed.
- Baseline focused Firefox subtitle/interruption tests: 10 passed, 2 optional real-model checks skipped.
- Before fix: both activation-safety tests failed in Firefox with a second page load.
- After fix: initial recording/subtitle activation regressions passed in both Chrome and Firefox (4 tests).
- Added regression for rejected worker registration keeping the editor usable.
- Final unit suite: 89 passed.
- Full Chrome/Firefox browser suite: 114 passed, 0 failed, 8 skipped (six optional real-model checks and two opt-in soak cases), 2.7 minutes.
- Production build and TypeScript checks passed; the existing large-bundle advisory remains.
- Extended the opt-in nine-minute recording test to also import the recording and verify the timeline clip duration, rather than checking review playback alone.
- Final Firefox foreground soak passed: video 541.326 seconds; audio 541.3135 seconds; imported clip 541.33 seconds (difference 0.004 seconds). The final frame remained blue (RGB 2, 0, 251); final-second audio RMS was 0.704. Recorded size: 9,209,426 bytes. The historical 7–8-minute failure did not reproduce in this synthetic run; this is not proof that hardware/session-specific cutoffs are resolved.

Browsers: installed Google Chrome 153.0.8010.36; Playwright Firefox 153.0. Installed desktop Firefox 155.0.1 was identified but not automated. No physical camera/microphone, native screen chooser, device sleep or real speech-model memory-pressure claim is made. The user-specific early cutoff remains unconfirmed until its symptoms can be matched.

The publication summary records the final broad-suite, soak and live results.
