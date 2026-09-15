# Firefox ten-second follow-up — September 15, 2026

The user clarified that **recording stops after about ten seconds**. Capture stopping and a completed recording becoming a ten-second timeline clip are distinct symptoms. This investigation reproduced and fixes the latter under forced browser metadata failure. It does not establish the cause of the user's native Firefox capture stopping.

## Findings and fixes

### High impact: missing duration silently limits clips to ten seconds

Trigger: import video/audio whose duration remains unavailable to the browser after its seek-based recovery. The importer returned an undefined duration; both import and library insertion substituted ten seconds. Automatic subtitle generation then received that shortened duration.

Reproduction: import the existing long-speech MP4 fixture with browser duration forced to Infinity and out-of-range seek rejected. The fixture duration is 51.109609 seconds according to ffprobe. Both actual Chrome and Playwright Firefox produced a **10-second clip** before the fix; both regression tests failed as expected. This deliberately injects the metadata failure; it is not a claim that the fixture normally fails in Firefox.

Fix: when browser metadata is unavailable, read encoded track timestamps using Mediabunny 1.56.2, already used by the subtitle decoder and now declared as a direct dependency. Dispose the parser after reading; retain browser seeking as a format fallback, but never treat the requested seek position as measured duration. If duration still cannot be determined, reject the import explicitly instead of silently trimming it. Legacy library assets with missing duration ask for reimport. Existing short clips are not automatically lengthened because they could be intentional edits.

### High impact: failed recording import discards review

The app previously swallowed import errors, allowing the recording dialog to announce success and close. The recording import now propagates errors to the dialog, which preserves review and permits retry. A regression injects a one-time import failure and verifies zero clips, visible error, retained review, and successful retry in both browsers.

## Validation

- Baseline: prior release had 89 unit tests and 114 browser tests passing, with 8 documented opt-in skips.
- Before fix: two new controlled metadata-failure tests failed, receiving duration 10.
- Tightened duration precision checks: 2 passed, matching 51.11 seconds within 0.05 seconds.
- Targeted after fix: 6 passed (duration recovery, failed browser metadata, recording followed by subtitles across both browsers).
- The recording/subtitle journey now captures for 12.5 seconds, verifies capture is still active, manually stops, imports, generates test captions, and checks the timeline video duration exceeds 12 seconds.
- Subtitle inference uses a deterministic worker double; encoding and media decoding are native. Subtitle generation begins after recording stops.
- Production build and TypeScript checks pass. Existing large-bundle advisory remains.
- Unit suite: 89 passed.

## Browser coverage and limitations

| Browser | Version | Coverage |
| --- | --- | --- |
| Actual desktop Google Chrome | 153.0.8010.36 | Native encoding/decoding with synthetic media; import failure/retry; duration and subtitle flow |
| Playwright Firefox | 153.0 | Same automated coverage |
| Installed desktop Firefox | 155.0.1 | Not automated in this follow-up |
| Safari/WebKit, phones/tablets | — | Not retested for this change |

No physical camera, microphone, native screen-sharing chooser, hardware codec, device sleep, or real speech-model memory-pressure claim is made. The earlier nine-minute Firefox synthetic foreground test passed on the preceding release, not this new revision. No ten-second capture timer was found in the recorder. Native early capture stop remains **not reproduced**, not resolved.

## Publication

VideoSplat shell cache and registration advance to v29. Live URL: https://drawsplat.org/solutions/videosplat/ . Final commit/deployment evidence accompanies the publication summary.
