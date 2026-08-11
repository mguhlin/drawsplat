# AudioSplat Development Plan

AudioSplat is a private, browser-based multitrack audio recorder and editor in
the DrawSplat Tools family. It should make the common recording workflow as
easy as a one-button voice recorder while providing a real, non-destructive
timeline for podcasts, narration, language practice, interviews, music, and
classroom media projects.

This document is the development checklist and release gate. A phase is not
complete until its acceptance criteria, tests, documentation, localization,
accessibility, privacy, and integration work are complete.

## Implementation status

AudioSplat V1 is implemented in this repository as of 2026-08-11.

- Phases 0-7 are implemented: branded shell, six-language switching, local
  recording, import, multitrack waveform editing, transport/mixing, IndexedDB
  autosave, portable project files, WAV export, responsive/accessibility work,
  offline support, documentation, and DrawSplat site integration.
- Phase 8 automated gates pass: strict TypeScript, production build, unit tests,
  browser shell/localization/RTL tests, real WAV import/edit/undo/export test,
  and production dependency audit.
- The post-V1 editor now includes tab-isolated autosave, format-specific export
  commands, clip-range effect dialogs with Preview/Apply/Cancel, and undoable
  Amplify, Adjustable Fade, Bass/Treble, Echo, Noise Gate, Noise Reduction,
  Reverb, Silence, and Truncate Silence processing. Normalize and linear Fade
  In/Out remain available as quick clip effects.
- Audio can be brought in with the file picker, multi-file drag and drop,
  CORS-permitted direct URLs, installed-PWA file handling, and the operating
  system share sheet where Web Share Target is supported. Browser security
  still requires an explicit selection before AudioSplat can read a downloaded
  file.
- Waveform-body pointer dragging creates a visible clip-relative time selection;
  effects inherit that range, Delete removes and closes the selected audio with
  Undo support, and View includes Zoom to Selection and Fit Project to Window.
  Clip labels remain dedicated drag handles for moving clips between tracks.
- Optional Google Drive export uses Google Identity Services and the narrow
  `drive.file` scope. A user can save any supported export format privately or
  explicitly request an Anyone-with-the-link permission, share URL, and Drive
  preview iframe. Workspace policy failures do not discard a successful save.
- Remaining release validation is operational: exercise physical microphones,
  permission revocation, USB/Bluetooth device removal, long recordings, storage
  pressure, and current Safari/ChromeOS devices. These require real hardware and
  cannot be proven by the automated browser environment.

## 1. Product boundaries

### Product promise

- Record from a microphone without an account or installation.
- Import audio, arrange clips on multiple tracks, edit without damaging the
  original recording, and export a finished mix.
- Keep audio on the device unless the user explicitly downloads or shares it.
- Work from static hosting with no required backend, telemetry, ads, trackers,
  cloud service, or runtime CDN.
- Feel like a DrawSplat tool: welcoming, colorful, touch-friendly, plain
  language, visible help, and safe defaults.

### Initial audiences

- Students recording narration, interviews, oral responses, and podcasts.
- Teachers creating instructions, listening activities, and lesson audio.
- Families and casual users needing a simple private recorder/editor.
- Chromebook users and schools that cannot install desktop audio software.

### V1 definition

V1 is a dependable recorder and non-destructive multitrack editor. It includes:

- microphone selection, permission guidance, input meter, record, pause,
  resume, and stop
- audio-file import by picker and drag-and-drop
- multiple tracks and multiple clips per track
- waveform timeline, playhead, ruler, scrolling, and zoom
- select, move, split, trim, duplicate, delete, and rename clips
- add, rename, reorder, mute, solo, volume, pan, and delete tracks
- playback, pause, stop, seek, loop selection, and return-to-start
- undo and redo for every editing operation
- local autosave and recent-project recovery
- `.audiosplat.json` project save/open with referenced audio packed into a
  portable project archive if JSON-only storage becomes impractical
- WAV mixdown export
- DrawSplat language switcher and complete UI localization
- responsive desktop/tablet UI, keyboard access, and screen-reader labels
- offline-capable static release after the first successful load

### Explicitly deferred until after V1

- real-time collaboration, accounts, hosted sharing, or public recording links
- AI transcription, generative audio, voice cloning, or cloud noise removal
- VST/AU/LV2 plug-ins or arbitrary third-party effect loading
- MIDI editing, notation, video editing, or desktop-DAW parity
- destructive sample painting and sample-by-sample spectral repair
- MP3/AAC export until encoder size, license, patent, performance, and browser
  behavior are documented and tested
- advanced effects beyond the post-V1 list in section 15

## 2. Repository placement and release shape

AudioSplat is a DrawSplat Tool, not a SplatWorks office app. Its public path
should therefore be:

```text
solutions/audiosplat/
```

The editor is complex enough to use the maintainable Vite + TypeScript pattern,
but its visual shell and public placement must match standalone DrawSplat
tools. Proposed structure:

```text
solutions/audiosplat/
  README.md
  LICENSE.md
  package.json
  package-lock.json
  index.html
  index.vite.html
  vite.config.ts
  vitest.config.ts
  playwright.config.ts
  public/
    audiosplat-icon.svg
    manifest.webmanifest
    sw.js
  docs/
    credits.md
    decisions.md
    file-format.md
    privacy-audit.md
    browser-support.md
  src/
    app/
    audio/
    components/
    editor/
    export/
    i18n/
    persistence/
    styles/
    workers/
  tests/
```

Production output must remain deployable at `/solutions/audiosplat/` without a
server rewrite. All dependencies, workers, icons, fonts, and WASM assets must
be local and use relative or correctly based paths.

## 3. DrawSplat visual and interaction contract

AudioSplat should reuse the established DrawSplat treatment rather than invent
a DAW-themed dark interface.

### Required visual tokens

- Purple primary: `#7c3aed`
- Dark purple: `#6d28d9` or `#5b21b6`
- Violet secondary: `#a855f7`
- Orange accent/selection: `#faa634`
- Border: `#ddd6fe`
- Pale purple surface: `#f5f0ff` or `#faf7ff`
- White page and panel surfaces
- System/Inter-style sans-serif stack
- Eight- to twelve-pixel radii, soft purple shadows, strong visible focus rings
- The DrawSplat multicolor spectrum bar at the top

Create one AudioSplat token file based on existing DrawSplat and GridSplat
values. Components must consume tokens rather than repeat raw colors.

### Required application shell

- Spectrum bar.
- Header containing `DrawSplat Tools`, `AudioSplat`, a short tagline, language
  switcher, Help, and Home.
- Work-focused menu bar: File, Edit, Tracks, Clip, Effects, View, Help.
- Large transport toolbar with unmistakable Record, Pause, Stop, Play, Skip to
  Start, Undo, and Redo controls.
- White/pale-purple panels with purple borders; selected clips use orange plus
  a non-color selection affordance.
- Status bar for current time, selection length, sample rate, autosave state,
  storage warning, and recording state.
- Friendly empty state offering `Record`, `Import audio`, and `Open project`.
- Dialog styling and toast behavior consistent with other DrawSplat tools.
- Local SVG icons; icons never replace accessible text/name information.

### Workspace layout

```text
┌────────────────────────────────────────────────────────────────────┐
│ spectrum bar                                                       │
│ DrawSplat Tools · AudioSplat     Language · Help · Home            │
├────────────────────────────────────────────────────────────────────┤
│ File  Edit  Tracks  Clip  Effects  View  Help                     │
├────────────────────────────────────────────────────────────────────┤
│ ● Record  ▶ Play  ❚❚ Pause  ■ Stop | Undo Redo | time | zoom      │
├──────────────┬─────────────────────────────────────────────────────┤
│ Track header │ timeline ruler                                     │
│ name         │ waveform clips                                     │
│ mute solo    │                                                     │
│ volume pan   │                                                     │
├──────────────┼─────────────────────────────────────────────────────┤
│ Track header │ waveform clips                                     │
├──────────────┴─────────────────────────────────────────────────────┤
│ status · selection · sample rate · saved                          │
└────────────────────────────────────────────────────────────────────┘
```

At tablet widths, track controls collapse to a compact row/drawer. On phones,
recording and basic trim/export remain usable, but full multitrack editing may
show a plain-language recommendation to rotate or use a wider screen. No
control may become unreachable at 320 CSS pixels.

## 4. Language switcher and localization

AudioSplat must use the existing DrawSplat preference contract:

- storage key: `drawsplat.language`
- locale order: `?lang=`, stored preference, browser language, English
- languages: English (`en`), Spanish (`es`), Vietnamese (`vi`), Arabic (`ar`),
  Chinese (`zh`), and Hindi/Urdu (`uh`)
- missing keys fall back to English
- changing language updates the page immediately without losing project state
- Arabic sets `dir="rtl"`; the existing `uh` behavior remains LTR for
  consistency with DrawSplat

Use a typed i18n adapter compatible with `assets/js/widget-i18n.js`, or load
that shared helper directly if it integrates cleanly with Vite. Do not create a
different preference key or a different language list.

Localization covers every user-visible string:

- menus, buttons, tooltips, labels, dialogs, validation, errors, toasts, help,
  empty states, permission guidance, storage warnings, export explanations,
  accessibility names, PWA metadata, and sample-project descriptions
- dynamic strings use placeholders and plural-safe helpers
- filenames and project titles are user data and are never translated
- keyboard shortcuts remain physically accurate while their descriptions are
  translated
- timecodes and decibel values remain technically stable and locale-formatted
  where appropriate

Localization release gates:

- automated missing-key and unused-key test
- pseudo-long-string layout test
- `dir=rtl` Playwright pass for all primary workflows
- no hard-coded English found by the localization audit outside approved
  technical constants
- native-speaker review is tracked; AI-seeded translations are labeled as such
  until reviewed

## 5. Audio architecture

### Core browser APIs

- `getUserMedia` for microphone capture and device selection
- Web Audio API for decode, routing, gain, pan, scheduling, metering, and mixdown
- `AudioWorklet` for low-jitter PCM capture/metering where supported
- `MediaRecorder` as a compatibility path, never assuming one universal MIME
  type
- OfflineAudioContext or a worker-based renderer for deterministic mixdown
- Web Workers for waveform peaks, resampling, and encoding
- IndexedDB for projects and binary audio sources
- File System Access API only as an optional progressive enhancement

### Architectural modules

- `AudioEngine`: owns AudioContext lifecycle, playback graph, scheduling, and
  master output.
- `Recorder`: permission state, selected input, PCM/MediaRecorder strategy,
  pause/resume, elapsed time, and recovery.
- `Transport`: playhead, seek, loop range, playback state, and clock.
- `ProjectStore`: normalized project state and migrations.
- `CommandHistory`: reversible editing commands with bounded memory use.
- `PeakCache`: multiresolution waveform peaks generated off the main thread.
- `TimelineRenderer`: visible-range-only canvas rendering with device-pixel-
  ratio handling.
- `Persistence`: IndexedDB transactions, autosave, quotas, and recovery.
- `MixdownRenderer`: chunked offline render and encoder adapters.

Do not store decoded AudioBuffers in application state or undo snapshots.
Binary sources live once in the asset store; clips reference immutable sources
with offsets and timeline positions.

## 6. Native project model

The logical project format begins at version 1:

```json
{
  "app": "AudioSplat",
  "version": 1,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "metadata": {
    "title": "Untitled Audio Project",
    "sampleRate": 48000
  },
  "sources": [
    {
      "id": "source-id",
      "name": "Recording 1",
      "mimeType": "audio/wav",
      "duration": 12.5,
      "channels": 1,
      "storageRef": "asset-id",
      "sha256": "optional-integrity-value"
    }
  ],
  "tracks": [
    {
      "id": "track-id",
      "name": "Voice",
      "order": 0,
      "muted": false,
      "solo": false,
      "gain": 1,
      "pan": 0,
      "clips": [
        {
          "id": "clip-id",
          "sourceId": "source-id",
          "start": 0,
          "sourceOffset": 0,
          "duration": 12.5,
          "gain": 1,
          "fadeIn": 0,
          "fadeOut": 0
        }
      ]
    }
  ],
  "view": {
    "zoom": 100,
    "scrollTime": 0,
    "playhead": 0,
    "loop": null
  }
}
```

Before implementation, decide and document whether portable files are:

1. a ZIP-based `.audiosplat` archive containing `project.json`, source audio,
   and optional peak caches (recommended), or
2. `.audiosplat.json` plus separately referenced media.

The chosen format needs schema validation, path traversal protection, size
limits, duplicate-ID rejection, unknown-field tolerance, version migrations,
atomic import, and round-trip tests. IndexedDB autosave is convenience storage;
the downloadable project is the durable copy.

## 7. Recorder behavior and failure handling

- Show a pre-permission explanation before triggering the browser prompt.
- Request microphone access only after a user gesture.
- Distinguish denied, dismissed, missing-device, insecure-context, device-busy,
  unsupported-browser, and lost-device states.
- Offer input-device choice after permission reveals device labels.
- Show a live level meter and clipping warning before and during recording.
- Count in optionally; default to immediate recording.
- Record onto a new or armed track at the playhead.
- Prevent destructive navigation during active recording and retain recoverable
  chunks as they arrive.
- Pause/resume creates one logical clip unless the browser forces segmented
  capture; segments are normalized internally.
- If the input disappears, stop safely, preserve captured audio, and explain
  what happened.
- Stop every MediaStream track when recording ends or the app closes.
- Screen/system audio capture is post-V1 and must never be requested silently.

## 8. Timeline and editing behavior

- Time is stored in seconds with sample-aware conversion at engine boundaries.
- Clip movement supports free positioning and optional snapping to playhead,
  clip edges, seconds, and selection boundaries.
- Trim is non-destructive and cannot expose samples outside its source.
- Split produces adjacent clips referencing the same immutable source.
- Multi-selection supports Shift/Ctrl/Cmd conventions and touch-safe fallback.
- Drag actions preview visually and commit one undoable command on release.
- Deleting the last reference to a source does not purge binary data until an
  explicit/automatic safe cleanup step outside undo retention.
- Edits during playback either stop playback or reschedule predictably; choose
  one documented rule and test it.
- Waveform rendering is peak-based, visible-range-only, and independent of
  audio scheduling.
- Overlapping clips on one track must have a defined mix rule. V1 may allow
  overlap and sum them with headroom protection, or prevent overlap with a
  clear preview; document the decision before implementation.

## 9. Playback, mixing, and export

- Use one master graph with per-track gain and stereo pan nodes.
- Solo logic is deterministic when multiple tracks are soloed.
- Mute/solo affect monitoring, playback, and export consistently.
- Guard against clipping and display a master meter; do not silently normalize
  unless the user chooses it.
- Playback scheduling must remain aligned after seek, pause/resume, and loop.
- Export asks for filename, full mix versus selection, sample rate, channel
  mode, and format where supported.
- V1 WAV output supports valid PCM headers, mono/stereo, cancellation, progress,
  long renders, and memory-limit warnings.
- Export occurs locally. The dialog states that explicitly.
- Test exported files with independent decoders, not only AudioSplat re-import.

## 10. Persistence, quotas, and recovery

- Autosave metadata after every committed command with debounce.
- Persist recording chunks incrementally to reduce loss on crash or tab close.
- Use atomic/transactional saves so the previous project remains valid if a
  write fails.
- Show `Saving`, `Saved`, `Storage low`, and `Save failed` states.
- Query storage estimates where available and warn before recording when space
  is critically low.
- Provide project list, rename, duplicate, delete-with-confirmation, and cleanup
  of orphaned assets.
- Recovery screen offers the last consistent autosave after an interrupted
  recording or migration.
- Never clear user audio as part of routine cache/service-worker updates.
- Document private/incognito storage limitations and browser eviction risk.

## 11. Accessibility and inclusive interaction

Target WCAG 2.2 AA for the application UI.

- Complete keyboard path for recording, transport, track selection, clip
  selection, move/nudge, split, trim, delete, undo/redo, zoom, and dialogs.
- Initial shortcut set: Space play/pause, R record only when focus is not in an
  editable field, S split at playhead, Delete remove selection, Ctrl/Cmd+Z
  undo, Ctrl/Cmd+Shift+Z redo, Home return to start, +/- zoom.
- Never steal browser/screen-reader shortcuts without a documented reason.
- Visible focus, logical tab order, skip links, and focus restoration on dialog
  close.
- ARIA names and pressed/selected states for icon and toggle controls.
- Live regions announce recording start/stop, selection changes, save errors,
  and completed export without announcing meter updates continuously.
- Waveforms have text alternatives describing clip name, track, start,
  duration, and selection state.
- Every drag action has a keyboard/button equivalent.
- Color is never the only indicator for record, mute, solo, clipping, selection,
  or errors.
- Respect reduced motion, high contrast/forced colors, 200% text zoom, and
  touch targets of at least 44 by 44 CSS pixels for primary actions.
- RTL changes layout direction but timeline time still progresses left-to-right;
  document and user-test this deliberate exception.

## 12. Privacy, safety, and security

- No network request is needed after static assets load.
- No analytics, ads, fingerprinting, trackers, or microphone access before an
  explicit user action.
- Content Security Policy permits only required local resources and browser
  media APIs.
- Project import treats names and metadata as text, never HTML.
- Validate archive paths, decompressed size, file count, media type, duration,
  and schema before committing imported data.
- Protect against decompression bombs and malformed audio decoder failures.
- Revoke object URLs and release AudioNodes, workers, streams, and buffers.
- Privacy UI explains microphone permission, local storage, exports, clearing
  projects, and browser storage limitations in student-friendly language.
- Complete `docs/privacy-audit.md` before release and update repository privacy,
  security, accessibility, and compliance inventories where AudioSplat changes
  claims.

## 13. Performance and browser support

Initial support target:

- current and previous major Chrome/Edge on ChromeOS, Windows, macOS, Android
- current and previous Firefox on Windows/macOS/Linux
- current and previous Safari on macOS/iPadOS/iOS, with documented limitations

Set measurable budgets before Phase 4:

- usable shell quickly on a representative low-end Chromebook
- no long main-thread task above 100 ms during normal waveform interaction
- timeline pan/zoom target of 50-60 fps for ordinary projects
- playback start/seek response target below 150 ms after audio is decoded
- bounded peak cache and undo memory
- stress fixture: at least 8 tracks, 100 clips, and 30 minutes of source audio
- graceful warning or reduced-resolution waveform before memory exhaustion

Feature detection, not user-agent sniffing, controls recorder/encoder paths.
Maintain `docs/browser-support.md` with actual tested MIME types and limitations.

## 14. Testing strategy

### Unit tests

- project schema, migrations, and malformed input
- time/sample conversions and rounding boundaries
- clip move, split, trim, duplicate, delete, overlap, and bounds rules
- track mute/solo/gain/pan logic
- command history and undo/redo invariants
- waveform peak generation at several resolutions
- WAV headers, sample conversion, channel interleave, clipping, and silence
- i18n lookup, fallback, interpolation, persistence, and direction
- storage cleanup and recovery-state selection

### Integration tests

- recorder state machine with mocked media devices and permission outcomes
- AudioEngine scheduling after play, pause, seek, loop, and edit
- IndexedDB save/open/recovery and quota errors
- portable project round trip with multiple sources and tracks
- offline mixdown and re-import
- service-worker update without project loss

### Browser end-to-end tests

- new recording through edit and WAV export
- import two files, place on separate tracks, mix, save, reload, and export
- permission denied then successful retry
- interrupted recording recovery
- every primary flow by keyboard
- all six language choices persist across DrawSplat and AudioSplat
- Arabic RTL screenshots and interaction tests
- mobile/tablet viewport behavior
- offline reload after first visit

Real microphone capture cannot be proven by mocks alone. Maintain a manual
device matrix covering school Chromebook, Windows Chrome/Edge/Firefox, macOS
Safari/Chrome, iPad/iPhone Safari, Android Chrome, built-in microphones, USB
headsets, Bluetooth devices, permission revocation, and device removal.

### Quality gates on every release

- TypeScript, lint, unit, integration, and Playwright suites pass
- production build succeeds from a clean install
- `npm audit --omit=dev` reviewed and dependency licenses recorded
- no unexpected runtime network calls
- axe/accessibility scan plus keyboard manual pass
- localization audit and RTL pass
- exported WAV independently verified
- repository working tree contains intended source and built static assets only

## 15. Phased implementation

### Phase 0: decisions and prototypes

Deliverables:

- architecture decision records for recorder strategy, project container,
  overlap rule, sample-rate policy, waveform renderer, and export pipeline
- dependency/license review
- small proof of microphone capture, AudioWorklet fallback, waveform peak
  generation, synchronized two-track playback, and WAV export
- browser capability matrix from real tests
- approved wireframe using DrawSplat tokens and the six-language header

Exit criteria: the chosen approach records and plays reliably on the primary
Chromebook and Safari targets; no unresolved licensing issue blocks release.

### Phase 1: branded application foundation

Deliverables:

- Vite/TypeScript app, static base path, manifest, icons, and offline shell
- DrawSplat visual tokens, spectrum bar, header, menus, transport, workspace,
  dialogs, status bar, empty state, responsive layout
- shared six-language switcher, typed dictionaries, RTL foundation
- ErrorBoundary, toast/live-region system, and Help/About/Privacy dialogs
- unit, accessibility smoke, and visual viewport tests

Exit criteria: the empty app looks and behaves like DrawSplat at desktop,
tablet, phone, 200% zoom, keyboard-only, and Arabic RTL settings.

### Phase 2: project model and persistence

Deliverables:

- versioned project types, validation, migrations, command history
- IndexedDB project/source/peak stores and transactional autosave
- project list, create, rename, duplicate, delete, recovery, import/export shell
- quota reporting, orphan cleanup, and storage warnings

Exit criteria: synthetic projects round-trip without data loss; interrupted and
failed saves recover the previous consistent version.

### Phase 3: recording foundation

Deliverables:

- permission education and state-specific recovery guidance
- input-device selector, level/clipping meter, record/pause/resume/stop
- incremental chunk persistence and interrupted-recording recovery
- recording inserted as an immutable source plus timeline clip
- device-loss and stream cleanup handling

Exit criteria: repeated recordings survive reload and recovery on the manual
browser/device matrix with no microphone remaining active after stop.

### Phase 4: waveform timeline and core editing

Deliverables:

- worker-generated multiresolution peaks and virtualized canvas timeline
- ruler, playhead, selection, scroll, zoom, snapping, and auto-scroll
- tracks and clips with select, move, split, trim, duplicate, rename, reorder,
  delete, and undo/redo
- keyboard equivalents and accessible clip summaries

Exit criteria: all editing invariants pass property/boundary tests; stress
fixture remains responsive within budgets.

### Phase 5: transport and mixer

Deliverables:

- sample-aware playback scheduler, seek, pause, stop, skip, loop
- per-track mute, solo, volume, pan; master gain/meter and clipping warning
- edits and recording at nonzero playhead positions
- consistent monitoring/playback/export mix rules

Exit criteria: long-run synchronization, seek/loop, solo logic, and output
levels pass automated fixtures and listening tests.

### Phase 6: portable projects and WAV export

Deliverables:

- finalized AudioSplat project download/open format and migration docs
- local WAV mixdown with full/selection choice, mono/stereo, progress, cancel,
  filename, sample rate, and memory warnings
- independent decoder verification and export/re-import tests
- plain-language export and local-processing explanations in all locales

Exit criteria: a multitrack project saved on one supported browser opens and
exports identically on another, within documented numerical tolerances.

### Phase 7: polish, help, and DrawSplat integration

Deliverables:

- onboarding tour, task-based Help, shortcut reference, privacy/storage help
- example classroom project that contains redistributable or project-owned
  audio only
- final responsive, touch, reduced-motion, high-contrast, keyboard, RTL, and
  screen-reader work
- public feature/detail card, navigation entry, tool thumbnail, favicon,
  metadata, sitemap/search/download inventories, release notes, and service-
  worker/cache lists
- README, credits, license, decisions, format, privacy, and browser docs

Exit criteria: every integration checklist item resolves to a working public
link, and AudioSplat can be used offline after first load with no missing asset.

### Phase 8: release candidate validation

Deliverables:

- clean-install build and complete automated test report
- real-device/browser matrix report
- performance profile and memory-leak soak test
- privacy/security/accessibility/localization reviews
- backup/restore and service-worker-upgrade rehearsal
- known-limitations list and rollback plan

Exit criteria: no open data-loss, recording-loss, privacy, critical
accessibility, security, or export-corruption defect; remaining limitations are
documented and non-blocking.

## 16. Post-V1 roadmap

Prioritize only after V1 telemetry-free user feedback and defect stabilization:

1. Fade handles and crossfades.
2. Reverse and adjustable playback speed using offline, reversible processing.
3. Markers/labels, notes, and chapter/cue export.
4. Punch-in recording and count-in/metronome.
5. Project templates for podcast, oral response, interview, and narration.
6. Optional handoff of exported audio to ShowSplat or DrawSplat without adding a
   required cloud service.

## 17. Definition of done for every feature

A feature is done only when all applicable items are true:

- user-visible behavior and edge cases are specified
- implementation is non-destructive and undoable where appropriate
- English and five translated locale entries exist with fallback tests
- keyboard, touch, screen-reader, RTL, zoom, and reduced-motion behavior is
  addressed
- privacy, permissions, storage, and error states use plain language
- unit/integration/E2E coverage exists in proportion to risk
- performance and memory impact are measured for audio-length-dependent work
- dependency license/security review is recorded
- Help, file-format, browser-support, and release documentation is updated
- production static build is tested at `/solutions/audiosplat/`

## 18. First development checkpoint

Do not begin the full editor by copying Wavacity or embedding a remote service.
Begin with Phase 0 prototypes and the branded Phase 1 shell. The first review
should demonstrate:

- AudioSplat visual shell beside two existing DrawSplat tools
- instant switching among all six languages without reload
- Arabic RTL shell with left-to-right timeline direction
- microphone permission flow and live input meter
- recording one clip, drawing its waveform, and playing it back
- two synthetic tracks playing in sync
- local WAV export of the synthetic two-track mix

Approval of that checkpoint locks the foundations before the larger editing
surface is built.
