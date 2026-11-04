# WriteSplatTM Decisions

<a id="2026-06-29-start-with-a-vite-typescript-static-app"></a><a id="2026-06-29---start-with-a-vite--typescript-static-app"></a>

## Start with a Vite + TypeScript Static App

WriteSplatTM starts as a Vite + TypeScript static app under
`splatworks/writesplat/`, matching the maintainability direction used by
GridSplatTM. The first foundation avoids editor dependencies so the app shell,
storage model, and SplatWorksTM visual treatment can be verified before
ProseMirror is introduced.

<a id="2026-06-29-native-format-is-writesplat-json"></a><a id="2026-06-29---native-format-is-writesplatjson"></a>

## Native Format Is `.writesplat.json`

The app will use a native `.writesplat.json` file for durable save/load.
Browser autosave is treated as convenience storage only. The first scaffold
stored a simple HTML document body, then the Phase 2 foundation moved the
`document` payload to ProseMirror JSON while preserving HTML-file import during
development.

<a id="2026-06-29-first-export-formats-use-internal-serializers"></a><a id="2026-06-29---first-export-formats-use-internal-serializers"></a>

## First Export Formats Use Internal Serializers

WriteSplatTM starts with internal `.txt`, `.md`, and standalone `.html`
exporters. This keeps the first export slice dependency-free while the editor
schema is still small. A Markdown library can be added later if round-trip
Markdown editing becomes part of the active phase.

<a id="2026-06-29-images-are-embedded-for-offline-portability"></a><a id="2026-06-29---images-are-embedded-for-offline-portability"></a>

## Images Are Embedded for Offline Portability

Initial image insertion stores uploaded images as data URLs in the ProseMirror
document. This keeps `.writesplat.json` files portable and offline-friendly, but
large images can make browser autosave and native files large. IndexedDB or
image compression should be considered if image-heavy documents become a common
workflow.

<a id="2026-06-29-cloze-uses-a-mark-not-text-replacement"></a><a id="2026-06-29---cloze-uses-a-mark-not-text-replacement"></a>

## Cloze Uses a Mark, Not Text Replacement

Cloze blanks are stored as a ProseMirror mark with the answer in mark metadata.
The editor can still show the answer for teachers, while student export replaces
the marked text with blanks and teacher export brackets the answer. This avoids
destroying the answer key during editing.

<a id="2026-06-29-citation-assistant-inserts-plain-text-first"></a><a id="2026-06-29---citation-assistant-inserts-plain-text-first"></a>

## Citation Assistant Inserts Plain Text First

The first citation assistant formats MLA, APA, and Chicago citations from form
fields and inserts the result as editable plain text at the cursor. A structured
citations list can build on this later by storing citation records in the
native file metadata.

<a id="2026-06-29-teacher-student-view-uses-a-teacher-only-mark"></a><a id="2026-06-29---teacherstudent-view-uses-a-teacher-only-mark"></a>

## Teacher/Student View Uses a Teacher-Only Mark

Teacher-only content is stored as a ProseMirror mark so it remains editable in
the teacher document. Student View hides the marked spans in the editor, and
student-view HTML export strips them from the exported document.

<a id="2026-06-29-export-dialog-explains-lossy-formats"></a><a id="2026-06-29---export-dialog-explains-lossy-formats"></a>

## Export Dialog Explains Lossy Formats

The File menu keeps direct exports for speed, but also includes an Export
Options dialog that names what each format preserves or drops. This keeps the
offline classroom workflow fast while meeting the requirement that lossy formats
are not silent.

<a id="2026-06-29-scrambler-uses-deterministic-rotation"></a><a id="2026-06-29---scrambler-uses-deterministic-rotation"></a>

## Scrambler Uses Deterministic Rotation

The first sentence and paragraph scrambler rotates selected items instead of
using random shuffle. This makes classroom output predictable for tests and
teacher review while still creating a reordered exercise.

<a id="2026-06-29-read-aloud-uses-browser-speechsynthesis"></a><a id="2026-06-29---read-aloud-uses-browser-speechsynthesis"></a>

## Read-Aloud Uses Browser SpeechSynthesis

Read-aloud controls call the browser SpeechSynthesis API directly and do not
send text to a server. Browsers without speech synthesis simply do nothing.
Word-boundary events update a ProseMirror decoration for the current word, so
the visual tracking does not become part of the document or exports.

<a id="2026-06-29-vocabulary-highlighting-uses-decorations"></a><a id="2026-06-29---vocabulary-highlighting-uses-decorations"></a>

## Vocabulary Highlighting Uses Decorations

Vocabulary terms are parsed from a local word list and displayed with
ProseMirror decorations. The terms do not become part of the document and do not
affect native JSON, HTML, DOCX, RTF, or Markdown exports.

<a id="2026-06-29-readability-analysis-is-debounced"></a><a id="2026-06-29---readability-analysis-is-debounced"></a>

## Readability Analysis Is Debounced

Editor typing schedules readability highlights and sidebar statistics after a
300ms debounce. Changing the target grade still recalculates immediately so the
teacher can tune the panel without waiting. The highlights remain ProseMirror
decorations, not document content.

<a id="2026-06-29-markdown-mode-uses-a-local-classroom-subset"></a><a id="2026-06-29---markdown-mode-uses-a-local-classroom-subset"></a>

## Markdown Mode Uses a Local Classroom Subset

Raw and split Markdown editing are implemented with an internal parser for the
same classroom-writing subset used by Markdown export: headings, paragraphs,
lists, links, images, emphasis, horizontal rules, blockquotes, code blocks, and
page breaks. This keeps the feature offline and audit-friendly while leaving
full CommonMark fidelity for a future dependency-backed pass if needed.

<a id="2026-06-29-block-reordering-uses-drag-handles"></a><a id="2026-06-29---block-reordering-uses-drag-handles"></a>

## Block Reordering Uses Drag Handles

Top-level document blocks receive ProseMirror decoration handles for
drag-and-drop reordering. Drops dispatch document transactions rather than
moving DOM nodes directly, preserving autosave, undo history, and export
consistency.

<a id="2026-06-29-odt-export-uses-a-minimal-stored-zip"></a><a id="2026-06-29---odt-export-uses-a-minimal-stored-zip"></a>

## ODT Export Uses a Minimal Stored ZIP

OpenDocument export uses a dependency-free stored ZIP writer and ODF XML for the
supported classroom subset. It preserves headings, paragraphs, lists, links,
simple tables, merged table spans, page breaks, and basic inline marks without
adding a large runtime dependency.

<a id="2026-06-29-sidebar-uses-state-classes-for-responsive-layout"></a><a id="2026-06-29---sidebar-uses-state-classes-for-responsive-layout"></a>

## Sidebar Uses State Classes for Responsive Layout

The readability and educator tools panel stays visible on desktop, can collapse
to a single-column editor layout, and becomes a right-side drawer below the
tablet breakpoint. The drawer uses local UI state only and does not affect the
document, autosave payload, or exports.

<a id="2026-06-29-phase-6-public-status-and-smoke-gates"></a><a id="2026-06-29---phase-6-public-status-and-smoke-gates"></a>

## Phase 6 Public Status and Smoke Gates

Public site copy now presents WriteSplatTM as an available SplatWorksTM writing
app rather than a foundation placeholder. Phase 6 verification includes browser
coverage for keyboard focus order, minimum primary-button target size, readable
contrast on the readability card, responsive drawer behavior, menu dismissal,
task-focused Help, and the production Vite bundle size reported by
`npm run build`.
