# WriteSplatTM Development Plan

WriteSplatTM is the SplatWorksTM writing and classroom publishing app. It
should feel consistent with GridSplatTM and ShowSplatTM while focusing on
document writing, readability feedback, teacher/student handouts, and portable
file workflows.

WriteSplatTM and SplatWorksTM are trademarks. In product copy, use
`WriteSplatTM` and `SplatWorksTM` in Markdown/plain text, and
`WriteSplat&trade;` / `SplatWorks&trade;` in HTML.

## Implementation Status

This plan has been built out for the current static SplatWorksTM release.

- Phase 1, app foundation: complete.
- Phase 2, editor core: complete.
- Phase 3, readability and stats: complete.
- Phase 4, practical export: complete for `.writesplat.json`, `.txt`, `.md`,
  `.html`, `.rtf`, `.docx`, `.odt`, and browser print/PDF.
- Phase 5, educator workflows: complete for templates, cloze, citations,
  teacher/student view, teacher-only content, vocabulary highlighting,
  read-aloud, and sentence/paragraph scramblers.
- Phase 6, polish and distribution: complete for responsive sidebar/drawer,
  dark mode, print styles, public page launch state, and single-file build
  support.

Remaining release validation is operational rather than product-plan work:
run the full build/test matrix before tagging, and verify performance on the
target low-end Chromebook hardware.

## Product Position

WriteSplatTM is not a Google Docs replacement. It is a private, browser-based
word processor for classroom writing tasks where teachers and students need a
document workspace that works without accounts, servers, analytics, cloud sync,
or required network calls.

The first release should prioritize:

- fast startup on school Chromebooks
- readable, distraction-resistant writing
- teacher-friendly templates and handout workflows
- local autosave plus durable JSON export/import
- client-side readability analysis
- practical export formats

The app should stay inside the SplatWorksTM family boundary:

- static app under `splatworks/writesplat/`
- public detail page at `pages/writesplat.html`
- launch path `/splatworks/writesplat/`
- GPL-3.0-only unless a file in the directory states otherwise
- no required backend, login, telemetry, advertising, or AI service
- separate self-host package after the app is stable enough to distribute

## Core Principles

- **Private by default.** Documents stay in the browser unless the user exports
  or imports a file. No required remote service.
- **Portable by design.** Browser autosave is convenience storage. The durable
  format is `.writesplat.json`.
- **Educator-native.** Readability, cloze passages, templates, citation help,
  and teacher/student views are core product work, not plug-ins.
- **Self-contained distribution.** Development can use Vite and bundled
  dependencies, but the release build must run from static hosting and should
  be packageable as one self-contained app folder. A single-file HTML export is
  produced for lessons and portable offline use, while the app also ships as a
  normal SplatWorksTM static app.
- **Effective first.** Features must support common classroom writing workflows.
  Avoid desktop-publishing complexity in v1.

## SplatWorksTM Design Treatment

WriteSplatTM should share suite-level behavior with GridSplatTM and
ShowSplatTM:

- top application menu with File, Edit, Insert, Format, Tools, View, and Help
- icon-first toolbar with text labels or tooltips where icons are not obvious
- clear status bar with document state, word count, grade estimate, and save
  state
- large, high-contrast controls with visible focus rings
- friendly empty state with New Document, Open File, and Template Gallery
- native JSON save/load naming, using `.writesplat.json`
- export dialogs that explain limitations plainly
- Help/about copy linking Terms & Privacy, GDPR, and SplatWorksTM licensing
- no decorative marketing surface inside the app; the first screen is the
  usable writing workspace or document picker

The default interface should be work-focused and calm: document canvas in the
center, tools above, analysis on the right, and document navigation/templates in
dialogs rather than permanent clutter.

## Technology Choices

| Need | Choice | Notes |
| --- | --- | --- |
| App shell | Vite + TypeScript | Match the maintainable SplatWorksTM app pattern. |
| Editor core | ProseMirror | Correct fit for schema control, history, decorations, and structured export. |
| Optional fallback | Tiptap headless | Accept only if raw ProseMirror slows delivery too much. Document the decision. |
| Markdown import/export | markdown-it or marked + Turndown | Bundle locally. No CDN runtime dependency. |
| DOCX export | docx.js | Bundle locally; validate license before adding. |
| RTF export | Small internal writer | Useful fallback for older systems. |
| ODT export | Internal ODF ZIP writer | Small dependency-free writer for the supported classroom subset. |
| Icons | Local Lucide SVGs | Match suite style, bundled offline. |
| Fonts | System font stack | No required network calls. |
| Storage | localStorage for small autosaves; IndexedDB for large image-heavy docs if needed | JSON export remains the durable copy. |
| Testing | Vitest + Playwright | Unit-test analysis/export; browser-test editing and persistence. |

Before adding dependencies, record license notes in `docs/credits.md`.
SplatWorksTM apps must remain easy for schools to audit and self-host.

## Workspace Layout

The first app shell should use this structure:

```text
┌──────────────────────────────────────────────────────────────────┐
│ WriteSplatTM    File  Edit  Insert  Format  Tools  View  Help    │
├──────────────────────────────────────────────────────────────────┤
│ B I U S  Style  Align  List  Link  Image  Table | Undo Redo      │
├───────────────────────────────────────┬──────────────────────────┤
│                                       │ Readability              │
│          Document canvas              │ Grade target: 6          │
│          ProseMirror editor           │ Score and warnings       │
│                                       │                          │
│                                       ├──────────────────────────┤
│                                       │ Stats                    │
│                                       │ Words, sentences, pages  │
│                                       │                          │
│                                       ├──────────────────────────┤
│                                       │ Teacher tools            │
│                                       │ Cloze, citations, view   │
├───────────────────────────────────────┴──────────────────────────┤
│ Words: 342 | Sentences: 24 | Grade 6 | Saved                     │
└──────────────────────────────────────────────────────────────────┘
```

The sidebar must be collapsible. On narrower screens, it should become a
drawer. Mobile editing is not the v1 target, but the app should not break on a
tablet-sized viewport.

## Document Model

WriteSplatTM should own a native JSON format instead of treating HTML as the
source of truth.

Minimum `.writesplat.json` shape:

```json
{
  "app": "WriteSplatTM",
  "version": 1,
  "createdAt": "2026-06-29T00:00:00.000Z",
  "updatedAt": "2026-06-29T00:00:00.000Z",
  "metadata": {
    "title": "Untitled Document",
    "author": "",
    "targetGrade": "6"
  },
  "document": {},
  "teacher": {
    "studentView": false,
    "citations": [],
    "answerKey": []
  }
}
```

`document` stores ProseMirror JSON. Export formats are generated from that
structured state.

## Readability Engine

Readability must run entirely in the browser. It should use ProseMirror
decorations so analysis highlights do not modify document content, exports, or
undo history.

Initial checks:

- Flesch-Kincaid grade estimate
- Flesch Reading Ease score
- hard and very hard sentences relative to target grade
- passive voice candidates
- adverbs and intensifiers
- simpler alternatives lookup
- hedging and weak phrases

Analysis should debounce editor changes, start with a 300ms target, and be easy
to disable. Clicking a warning should scroll to and pulse the first relevant
range. The UI must label warnings as suggestions, not correctness judgments.

## Standard Writing Features

### V1 Required

- paragraphs, headings H1-H3, blockquote, code block
- bold, italic, underline, strikethrough
- ordered, unordered, and nested lists
- undo/redo
- links
- inline images by upload/paste with alt text
- tables: insert table, add/remove rows and columns, merge cells, and split cells
- find and replace
- print through browser dialog
- light/dark mode
- document templates
- local autosave
- `.writesplat.json` export/import
- `.txt`, `.md`, `.html`, `.rtf`, `.docx`, and `.odt` export
- raw and split Markdown editing for the supported classroom-writing subset

### Out of Scope for V1

- real-time collaboration
- cloud sync
- required account login
- AI writing suggestions
- grammar/spellchecking beyond browser-native spellcheck
- full mobile authoring experience
- exact Microsoft Word layout fidelity

## Educator Tools

Educator tools should be staged after the core editor and analysis are stable.

### First Educator Set

- **Document templates:** five-paragraph essay, lab report, Cornell notes,
  persuasive essay, storyboard, book report, and research paper.
- **Cloze builder:** selected text can become a blank. Student export hides the
  answer; teacher export preserves it.
- **Citation assistant:** MLA, APA, and Chicago form fields that insert a
  formatted citation and can maintain a citations section.
- **Teacher/student view:** teacher-only notes and answer keys are hidden from
  Student View and stripped from student exports.

### Later Educator Set

- read-aloud using browser SpeechSynthesis
- vocabulary list highlighter
- optional dictionary lookup with a clear network-use notice
- sentence and paragraph scrambler with preserved teacher key

## Export Strategy

All exports are client-side using Blob downloads.

| Format | V1 Status | Notes |
| --- | --- | --- |
| `.writesplat.json` | Required | Native editable format. |
| `.txt` | Required | Plain text export. |
| `.md` | Required | Useful for LMS and ShowSplatTM outline workflows. |
| `.html` | Required | Clean standalone document HTML, not the full app. |
| `.rtf` | Required | Basic formatting only. |
| `.docx` | Required | Headings, paragraphs, lists, tables, bold/italic, links, images where feasible. |
| `.odt` | Required | Dependency-free ODF ZIP for headings, paragraphs, lists, simple tables, links, and inline marks. |
| print/PDF | Required | Browser print dialog; do not promise direct PDF generation in v1. |

Export dialogs must identify lossy formats before download. For example, `.txt`
removes formatting, and `.rtf` may not preserve tables or images.

## File Structure

```text
splatworks/writesplat/
├── README.md
├── COPYING
├── LICENSE.md
├── docs/
│   ├── plan.md
│   ├── decisions.md
│   ├── credits.md
│   └── file-format.md
├── index.html
├── package.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── app/
│   │   ├── App.ts
│   │   └── state.ts
│   ├── editor/
│   │   ├── schema.ts
│   │   ├── commands.ts
│   │   ├── keymap.ts
│   │   └── plugins/
│   │       ├── analysis.ts
│   │       ├── autosave.ts
│   │       └── history.ts
│   ├── analysis/
│   │   ├── scorer.ts
│   │   ├── detectors.ts
│   │   └── alternatives.ts
│   ├── export/
│   │   ├── docx.ts
│   │   ├── html.ts
│   │   ├── markdown.ts
│   │   ├── rtf.ts
│   │   └── text.ts
│   ├── educator/
│   │   ├── citations.ts
│   │   ├── cloze.ts
│   │   ├── templates.ts
│   │   └── teacherView.ts
│   ├── storage/
│   │   ├── autosave.ts
│   │   └── nativeFile.ts
│   ├── ui/
│   │   ├── dialogs.ts
│   │   ├── menus.ts
│   │   ├── sidebar.ts
│   │   ├── statusbar.ts
│   │   └── toolbar.ts
│   └── styles/
│       ├── global.css
│       └── tokens.css
└── tests/
    └── app.spec.ts
```

## Development Phases

### Phase 1 - SplatWorksTM App Foundation

Status: complete.

- create `splatworks/writesplat/`
- add README, license files, docs, package scripts, Vite config, and tests
- static app loads at `/splatworks/writesplat/`
- public page and navigation still mark the app as planned until Phase 2 works
- blank styled WriteSplatTM shell with menus, toolbar, editor area, sidebar,
  status bar, and document picker

**Deliverable:** A buildable SplatWorksTM app shell that looks and navigates
like it belongs beside GridSplatTM and ShowSplatTM.

### Phase 2 - Editor Core

Status: complete.

- ProseMirror schema for paragraphs, headings, lists, links, text marks, images,
  tables, teacher-only spans, cloze blanks, and page breaks
- toolbar commands for common formatting
- keyboard shortcuts
- undo/redo
- local autosave
- native JSON export/import
- status bar word count

**Deliverable:** A teacher or student can create, format, save, close, reopen,
and export a native WriteSplatTM document.

### Phase 3 - Readability and Stats

Status: complete.

- Flesch-Kincaid and reading ease scoring
- sentence splitting, word counting, syllable counting
- passive voice, adverb/intensifier, weak phrase, and simpler alternative
  detectors
- ProseMirror decoration plugin
- sidebar summary and clickable warnings
- target grade selector
- toggle analysis without mutating document content

**Deliverable:** Hemingway-style classroom readability feedback that remains
separate from the document.

### Phase 4 - Practical Export

Status: complete for the current classroom-writing subset.

- `.txt`, `.md`, `.html`, `.rtf`, `.docx`, and `.odt` export
- browser print path for PDF
- export warnings for lossy formats
- regression fixtures for common documents

**Deliverable:** A useful document can leave WriteSplatTM in formats teachers
actually need.

### Phase 5 - Educator Workflows

Status: complete.

- template gallery
- cloze builder and student/teacher export modes
- citation assistant
- teacher/student view toggle
- teacher-only annotation model

**Deliverable:** WriteSplatTM becomes more than a generic editor by supporting
common classroom document workflows.

### Phase 6 - Polish and Distribution

Status: complete, pending only release-tag validation on target hardware.

- responsive sidebar/drawer behavior
- dark mode
- print styles
- accessibility pass
- performance pass on a low-end Chromebook target
- `pages/writesplat.html`
- SplatWorksTM hub and navigation update from Planned to Launch
- self-host bundle script support
- single-file `dist/writesplat-singlefile.html` build support

**Deliverable:** A shippable SplatWorksTM app package.

## Acceptance Checks Before Each Phase Ships

1. Does the app still run as a static browser app?
2. Does it avoid required network calls, telemetry, accounts, and backend state?
3. Does local autosave survive a browser restart?
4. Does `.writesplat.json` export/import restore the full editable document?
5. Do readability highlights toggle off without changing document content?
6. Do exports avoid corrupting content or silently dropping major structures?
7. Are keyboard navigation, focus states, and contrast acceptable?
8. Are dependency licenses recorded?
9. Does `npm run build` pass?
10. Does Playwright cover the phase's primary workflow?

## Key Technical Risks

- **ProseMirror complexity.** Decorations, schemas, tables, and custom marks are
  powerful but require care. Keep the schema small and add marks/nodes only when
  a real workflow needs them.
- **Table support.** ProseMirror tables can consume a lot of engineering time.
  Keep the supported table feature set focused on classroom handouts: insert,
  add/remove rows and columns, and merge/split cells.
- **DOCX fidelity.** Client-side DOCX export will not perfectly match Google
  Docs or Word. Define the supported subset early.
- **Autosave size.** Images can make localStorage fail. Move large document
  payloads to IndexedDB if image-heavy documents become a normal workflow.
- **Readability false positives.** Passive voice and syllable counting are
  heuristic. UI copy must present them as suggestions.
- **Scope creep.** Keep future export/layout work focused so it does not
  destabilize the stable writer with readability, templates, cloze, citations,
  Markdown Mode, tables, read-aloud tracking, block reordering, and exports.
