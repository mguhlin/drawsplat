# DrawSplat Whiteboard audit — September 15, 2026

## Scope and baseline

Audited DrawSplat's main Whiteboard, `app/whiteboard.html` and its shared
`assets/js/app.js`, including the translated entry pages. The user subsequently
requested direct Subject dragging and help with a green fringe in ImageSplat's
Green Screen Studio; those changes are included in this delivery.

- Repository: `https://github.com/mguhlin/drawsplat`; branch `main`.
- Starting commit: `6594cc52938df94d81e0a8154932baef7e98dc8f`.
- Applied the parent `AGENTS.md` standing authorization to check, commit, push,
  deploy and verify. No deeper AGENTS.md was found in the repository.
- Starting tree was clean. `git fetch origin` and `git merge --ff-only origin/main`
  confirmed it was current. An unrelated `pages/audit_instructions.md` appeared
  during the audit and is preserved outside the audit commit.
- Production: <https://drawsplat.org/app/whiteboard> (the `.html` URL redirects).
  Cloudflare Pages project `drawsplat` uses Git integration. The repository also
  publishes GitHub Pages; Cloudflare is the custom-domain deployment verified here.
- Whiteboard is served directly as static HTML/CSS/JavaScript; it has no compiled
  production build. Revised shared assets and entry-point cache stamps are the
  production assets. Whiteboard version: `3.0.96`; cache: `drawsplat-v3.1.19`.
- Baseline `npx playwright test --reporter=line`: **52 passed, 2 failed, 0 skipped**
  (54 total, 21 seconds). The two existing Whiteboard tests passed.
- Baseline failures: Studio discovery expected 57 tools but found 58;
  solution consistency reported `memesplat: has no language-switcher integration`.
  These are outside Whiteboard and were not changed.
- GitHub's issue API returned an empty list of open and closed issues. Historical
  evidence came from commits, README release history, release notes, guides,
  compliance/support documentation, and the September 14 media-app audit. That
  media audit is not evidence that Whiteboard itself had already been tested.

## Reproducible defects and changes

| Severity | Trigger and observed failure | Change and regression evidence |
| --- | --- | --- |
| High | Load `null`, `{}`, a null panel/object, or an object collection that is not an array after opening a good board. Import assigns the invalid value before migration, breaking the working board. | Validate/migrate the candidate before assigning it; malformed JSON structures preserve the original board and allow retry. Also handle file-read errors and invalid cached snapshots. |
| High | Open a legacy board without `active`. Its panel index stays undefined and rendering fails. | Normalize missing, invalid and out-of-range active indexes. Regression opens a legacy file and checks the saved index. |
| High | Save a small board, exceed localStorage quota on the next save, then refresh. The older localStorage board shadows the newer IndexedDB snapshot. | Wait for IndexedDB transaction completion before showing Saved, remove the stale localStorage copy after a committed fallback, and ignore superseded asynchronous status updates. Regression checks the latest title after refresh. |
| High | Deny storage reads/writes, or fail both storage backends. Unprotected preference access stops startup; fallback claims success without a committed write. | Guard preferences, catch transaction error/abort, and show “Not saved — download a file” with a Save File recovery path. Error state cannot be overwritten by the Saved-age timer. Tests deny both APIs and still download the working board. |
| High | Escape during the last PDF render. The dialog closes, but the late render inserts panels and reports success. Previously, earlier pages were also inserted before a later cancellation/failure. | Stage PDF/PPTX/ODP panels until completion; check cancellation and board identity before committing; prevent duplicate imports; wire dialog cancellation to PDF loading/render cleanup and destroy PDF documents. A delayed-render regression verifies no late panels. Files beyond 100 pages/slides now produce an explicit partial-import warning. |
| Medium | Export PDF, then read its xref table. Catalog/pages offsets are absent, `startxref` is wrong and entries contain undefined offsets. | Compute every object offset from actual emitted bytes. Tests check every xref target, `startxref`, page count, and embedded image; a real PDF.js import confirms decoding. |
| High | Export a board containing a referenced image. The downloaded PNG silently omits it because an SVG used as an image cannot fetch its own external images. | Embed fetched image bytes and inline computed note styles in the export clone. Export no longer changes live selection while awaiting rendering. Pixel tests check linked-image content; failed-fetch tests check error, retained selection and successful retry. PNG/PDF duplicate actions are guarded. |
| Medium | Download a generated GIF, wait more than two seconds, then download again. The first download revokes the preview's still-owned blob URL. | Keep the URL until replacement/dialog close, clear stale preview state, and discard late generation results for a closed dialog. Tests compare two downloaded files after 2.2 seconds and inspect dimensions and both frame delays. |
| High | Click Record Audio twice while permission is pending, or make recorder creation fail after a stream opens. Duplicate requests occur and failure can leave tracks running. | Guard startup, release tracks on failure/stop/page exit, and attach completed audio to the original still-existing object instead of whichever object happens to be selected later. Controlled API tests cover duplicate requests, failed creation, denied permission and unavailable MediaRecorder. No physical microphone is certified. |
| High | Activate Whiteboard's root service worker with another app's cache present. It deletes every cache except its own current cache, including audio and model caches. | Restrict deletion to the `drawsplat-v` namespace. An isolated activation test with foreign cache names reproduces the old deletion and verifies the boundary. |
| High | First offline reload requests versioned JS/CSS that were precached without a query string, so the shell can fail to start. | Fall back to the same cached shell path ignoring only its version query, and precache the missing safety, consent, timer and GIF helpers. Chrome/Firefox offline checks exercise first activation followed by offline reload. |
| High | First service-worker activation/update fires while drawing or a dialog is open; the handler reloads the page and interrupts the operation. | Keep the active page intact; show an update notice for existing controlled sessions. A controller-change regression checks that the dialog survives without navigation, alongside actual offline activation checks. |
| Medium | Phone portrait reserves three stacked rows for Undo/Redo/Audio; short screens can hide lower tool-rail controls. | Put these actions in one compact row on phone layouts and allow the tool rail to scroll. Tests check row height, scrolling, canvas area and touch selection. Screenshots were inspected. |

The storage tests use injected API failures, not a physically full disk. The delayed
PDF test controls completion order; other import tests use real PDF.js and JSZip.
Reproduction tests initially failed for malformed boards, legacy indexes, storage,
PDF structure, late cancellation, duplicate microphone requests and linked-image
export before their respective fixes.

## Historical issue ledger

“Not reproduced” describes the tested scenario only; it is not proof of resolution.

| Evidence | Original trigger | Existing fix / prior test | Current status |
| --- | --- | --- | --- |
| `22bdf2c` CSP/version stamp | Opening Whiteboard with incompatible script/version markup | Fix exists; no dedicated historical regression | **Not reproduced** in clean local startup/editing; actual version stamp inspected. |
| `ae6fc3c`, `166b839` responsive shell/pencil overflow | Narrow viewport and pencil controls | CSS fixes exist; no previous viewport suite | **Still reproducible, fixed here** for stacked action rows and inaccessible rail; four emulated viewports now checked. |
| `45cd5b1` onboarding sequencing | First visit showing welcome, consent and tips together | Sequencing fix exists; no prior regression | **Fixed** for tested welcome → consent flow, dismissal and reload; covered by new test. |
| `1d92061` Concept Map launch | Click simple-mode Concept Map | Existing handler changed to open the dialog | **Fixed** for opening and Escape-close; new regression. Full concept-map authoring was not exhaustively audited. |
| `8010d86`, `2d6b8c0` tool guidance/landmarks | Losing tool context and navigating by keyboard | Two existing usability tests | **Fixed** within existing assertions; both run across three engines. |
| `b3a599b` offline refresh | Previously visited board served old cached shell | Cache refresh/network-first fix exists | **Not reproduced** in Chrome/Firefox offline round trips; **not tested successfully** in Linux WebKit (control-page failure below). Cross-app cache deletion was independently reproduced and fixed. |
| v2.5 README/header: autosave quota fallback | Board exceeds localStorage quota | Fallback exists; no previous regression | **Still reproducible, fixed here**: stale snapshot restoration and misleading Saved status. |
| `9e9d44d` separate pencil/eraser widths | Switching drawing/erasing tools | Fix exists | **Not tested** for independent width persistence; drawing, dragging and undo/redo tested separately. |
| v3.0.13 crop/mask fit | Applying star/heart/other masks to photos | Existing centered-fit change | **Not tested** across every mask/crop combination. |
| `ec9fdd1`, compliance notes: image approval | Student image awaits teacher moderation | Backend/placeholder/poller implemented | **Not tested** against an authenticated classroom backend. |
| September 14 media-app audit | Long recordings, FFmpeg and transcription workflows | Other apps have fixes | **Not applicable as Whiteboard regression evidence**. No Whiteboard-specific reported failure duration was located. |

## Workflow and file coverage

- First visit, welcome/consent sequencing, empty workspace, return visit.
- JSON save/reopen, malformed structures, legacy index, a sparse 64 MiB + 1 byte
  rejected file, invalid PNG and PDF; retry after rejection.
- Real PNG insertion with embedded bytes surviving save/reopen. Real PDF export
  imported through PDF.js; minimal PPTX and ODP archives with retained text.
- Drawing, shape selection, dragging, resize, duplicate/delete, undo/redo,
  keyboard shortcuts, inline text commit/cancel, reload persistence.
- PNG signature/dimensions and actual red/white pixel values; linked-image pixel
  preservation. PNG exports are opaque white-backed current-view images.
- PDF byte structure, one page and embedded image. It is a raster export, not
  searchable text or an all-panels export.
- GIF signature, 40 × 40 output, two frames with 450 ms delay each, repeat download
  and close cleanup. These image exports contain no audio.
- Offline reload/save in Chrome and Firefox after actual service-worker activation.
- Controlled microphone denial, missing API, duplicate startup and failed recorder.
- Console/page exceptions checked in startup/editing and denied-storage journeys.
  Intentionally invalid files/missing resources can log expected decoder/network
  errors. This is not a claim that every tool/action is free of console errors.

## Green Screen Studio follow-up

- The combined preview previously had no drag handler; placement required the
  sliders inside “Position, size, and crop.” Dragging now moves the selected
  Subject, Background or Overlay with mouse or primary touch PointerEvents.
- Movement uses preview-relative percentages, so output resolution does not alter
  placement. Sliders stay synchronized. Arrow keys move 1%; Shift moves 10%.
  Pointer cancellation restores the position at gesture start. The source-preview
  masking/color-sampling controls retain their separate behavior.
- The green-fringe checkbox was off by default and below the source/mask controls.
  “Remove green/blue fringe” is now near the layer selector and on by default for
  Subject. It suppresses excess screen color; turn it off if matching subject
  colors should remain. Synthetic green-edge and warm-detail pixels are checked.
- Mouse drag, layer isolation, keyboard nudging, synthetic touch cancellation and
  saved-PNG position are checked across Chrome, Firefox and WebKit. The original
  giraffe source file was not available; the screenshot's exact edge quality was
  not independently certified.

## Browser/device matrix and limitations

Linux host: Node 20.19.2, npm 9.2.0, Playwright 1.60.0. The broader root suite used bundled Chromium 148.0.7778.96; the dedicated Chrome project used installed Google Chrome, as listed below.

| Browser | Exact tested version | Coverage / limitation |
| --- | --- | --- |
| Installed Google Chrome | 153.0.8010.36 | Actual Chrome executable via `channel: chrome`, headless desktop automation; Whiteboard and Green Screen Studio journeys. |
| Playwright Firefox | 150.0.2 | Actual Firefox engine supplied by Playwright; not a claim about the separately installed interactive Firefox. |
| Playwright WebKit | 26.4 | Linux WebKit engine, **not macOS/iOS Safari**. Core workflows and touch/layout emulation. Offline navigation has an environment limitation. |
| Phones, portrait / landscape | 390 × 844 / 844 × 390 CSS pixels | Desktop-engine viewport and touch emulation in all three engines. |
| Tablets, portrait / landscape | 768 × 1024 / 1024 × 768 CSS pixels | Desktop-engine viewport and touch emulation in all three engines. |
| Physical phones/tablets | None | Cameras, native permission choosers, hardware codecs, real on-screen keyboards, OS backgrounding and sleep were not tested. |

WebKit offline reload produced `WebKit encountered an internal error`. A minimal
HTML page and cache-only service worker reproduced the same failure without
DrawSplat. This case is explicitly skipped in the suite, and Safari offline
behavior remains unverified. No browser-name exception was added to production.

Intermediate failures were investigated: an oversized in-memory Playwright upload
exceeded Playwright's own 50 MB transport limit (replaced with a real sparse file);
the initial ODP fixture used the wrong namespace (corrected); overlapping early
runs collided in trace output (separate output directories and fixture-owned
contexts now used); an initial GIF probe was blocked by connect-src CSP (replaced
by a second actual download). These do not count as app fixes. A broader run with service workers enabled also exposed automatic activation reloads; those were fixed. Route-based tests now block service workers, while the dedicated offline tests enable them. A WebKit camera
instrumentation check is evaluated using track readyState, not a monkeypatched
stop-call count, because native track wrappers differ between engines.

## Remaining work, ordered by impact

1. Authenticated Google/MySQL saving, collaboration, moderation and reconnects
   need integration testing with a dedicated configured test account/backend.
2. Multi-tab concurrent edits, very long sessions, memory pressure, device sleep,
   real audio-note encoding/playback and hardware permissions need further tests.
   No long-duration reliability claim is made.
3. PNG/PDF capture the active visible view; PDF does not export every panel or
   searchable text. Complex PPTX/ODP formatting and unsupported embedded formats
   need representative real-world fixtures. Imports are capped at 100 panels.
4. WebKit/Safari offline behavior and real mobile keyboard/gesture ergonomics
   remain unverified on physical devices. Dense header navigation scrolls
   horizontally on small screens.
5. All specialized libraries, classroom widgets, backgrounds, masks, restore
   points and administrative workflows were not exhaustively tested. Whiteboard's
   single large JavaScript module makes full behavioral coverage costly.
6. The two pre-existing discovery/MemeSplat root-suite failures remain outside
   this audit's scope.

## Primary compatibility references

- [MDN: SVG as an image](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image)
  explains image-context restrictions behind missing external export assets.
- [MDN: IndexedDB complete event](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event)
  and [abort event](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/abort_event)
  informed save-success/error handling.

## Final checks and publication

Local checks:

| Check | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Initial root suite | 52 | 2 | 0 |
| Final Whiteboard release suite, three browsers (78 cases) | 77 | 0 | 1 WebKit offline |
| Repeated Chrome cancellation/startup/controller-change checks | 9 | 0 | 0 |
| Final broader root suite (81 cases) | 79 | 2 existing | 0 |
| Green Screen Studio + remove-color, three browsers | 39 | 0 | 0 |
| WebKit camera track-state checks, repeated three times | 6 | 0 | 0 |
| Final targeted cache/export checks, three browsers | 14 | 0 | 1 WebKit offline |

`node --check assets/js/app.js`, `node --check sw.js`, and `git diff --check`
passed. Browser execution also parsed the ImageSplat ES module. No separate
Whiteboard compilation step exists. Test counts across runs overlap and should
not be added as unique test cases.

Reviewed screenshots: [phone Chrome](images/whiteboard-phone-chrome.png),
[tablet Firefox](images/whiteboard-tablet-firefox.png),
[Green Screen Studio after dragging](images/green-screen-drag.png).

Full Whiteboard release counts and production evidence are appended below after
publication.

Reproduce the dedicated checks with:

```sh
npx playwright test -c playwright.whiteboard.config.js
npx playwright test -c playwright.imagesplat.config.js
npx playwright test --workers=2
```

Set `WHITEBOARD_URL=https://drawsplat.org` to run the dedicated configurations
against production. Their imports, storage and controlled permissions operate
in isolated browser contexts; they do not save to a classroom backend.
