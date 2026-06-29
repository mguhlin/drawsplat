# WriteSplatTM Decisions

## 2026-06-29 - Start with a Vite + TypeScript Static App

WriteSplatTM starts as a Vite + TypeScript static app under
`splatworks/writesplat/`, matching the maintainability direction used by
GridSplatTM. The first foundation avoids editor dependencies so the app shell,
storage model, and SplatWorksTM visual treatment can be verified before
ProseMirror is introduced.

## 2026-06-29 - Native Format Is `.writesplat.json`

The app will use a native `.writesplat.json` file for durable save/load.
Browser autosave is treated as convenience storage only. The first scaffold
stored a simple HTML document body, then the Phase 2 foundation moved the
`document` payload to ProseMirror JSON while preserving HTML-file import during
development.

## 2026-06-29 - First Export Formats Use Internal Serializers

WriteSplatTM starts with internal `.txt`, `.md`, and standalone `.html`
exporters. This keeps the first export slice dependency-free while the editor
schema is still small. A Markdown library can be added later if round-trip
Markdown editing becomes part of the active phase.

## 2026-06-29 - Images Are Embedded for Offline Portability

Initial image insertion stores uploaded images as data URLs in the ProseMirror
document. This keeps `.writesplat.json` files portable and offline-friendly, but
large images can make browser autosave and native files large. IndexedDB or
image compression should be considered if image-heavy documents become a common
workflow.

## 2026-06-29 - Cloze Uses a Mark, Not Text Replacement

Cloze blanks are stored as a ProseMirror mark with the answer in mark metadata.
The editor can still show the answer for teachers, while student export replaces
the marked text with blanks and teacher export brackets the answer. This avoids
destroying the answer key during editing.

## 2026-06-29 - Citation Assistant Inserts Plain Text First

The first citation assistant formats MLA, APA, and Chicago citations from form
fields and inserts the result as editable plain text at the cursor. A structured
citations list can build on this later by storing citation records in the
native file metadata.

## 2026-06-29 - Teacher/Student View Uses a Teacher-Only Mark

Teacher-only content is stored as a ProseMirror mark so it remains editable in
the teacher document. Student View hides the marked spans in the editor, and
student-view HTML export strips them from the exported document.

## 2026-06-29 - Export Dialog Explains Lossy Formats

The File menu keeps direct exports for speed, but also includes an Export
Options dialog that names what each format preserves or drops. This keeps the
offline classroom workflow fast while meeting the requirement that lossy formats
are not silent.

## 2026-06-29 - Scrambler Uses Deterministic Rotation

The first sentence and paragraph scrambler rotates selected items instead of
using random shuffle. This makes classroom output predictable for tests and
teacher review while still creating a reordered exercise.

## 2026-06-29 - Read-Aloud Uses Browser SpeechSynthesis

Read-aloud controls call the browser SpeechSynthesis API directly and do not
send text to a server. Browsers without speech synthesis simply do nothing.
Word-boundary events update a ProseMirror decoration for the current word, so
the visual tracking does not become part of the document or exports.

## 2026-06-29 - Vocabulary Highlighting Uses Decorations

Vocabulary terms are parsed from a local word list and displayed with
ProseMirror decorations. The terms do not become part of the document and do not
affect native JSON, HTML, DOCX, RTF, or Markdown exports.

## 2026-06-29 - Readability Analysis Is Debounced

Editor typing schedules readability highlights and sidebar statistics after a
300ms debounce. Changing the target grade still recalculates immediately so the
teacher can tune the panel without waiting. The highlights remain ProseMirror
decorations, not document content.

## 2026-06-29 - Markdown Mode Uses a Local Classroom Subset

Raw and split Markdown editing are implemented with an internal parser for the
same classroom-writing subset used by Markdown export: headings, paragraphs,
lists, links, images, emphasis, horizontal rules, blockquotes, code blocks, and
page breaks. This keeps the feature offline and audit-friendly while leaving
full CommonMark fidelity for a future dependency-backed pass if needed.

## 2026-06-29 - Block Reordering Uses Drag Handles

Top-level document blocks receive ProseMirror decoration handles for
drag-and-drop reordering. Drops dispatch document transactions rather than
moving DOM nodes directly, preserving autosave, undo history, and export
consistency.

## 2026-06-29 - ODT Export Uses a Minimal Stored ZIP

OpenDocument export uses a dependency-free stored ZIP writer and ODF XML for the
supported classroom subset. It preserves headings, paragraphs, lists, links,
simple tables, merged table spans, page breaks, and basic inline marks without
adding a large runtime dependency.

## 2026-06-29 - Sidebar Uses State Classes for Responsive Layout

The readability and educator tools panel stays visible on desktop, can collapse
to a single-column editor layout, and becomes a right-side drawer below the
tablet breakpoint. The drawer uses local UI state only and does not affect the
document, autosave payload, or exports.

## 2026-06-29 - Phase 6 Public Status and Smoke Gates

Public site copy now presents WriteSplatTM as an available SplatWorksTM writing
app rather than a foundation placeholder. Phase 6 verification includes browser
coverage for keyboard focus order, minimum primary-button target size, readable
contrast on the readability card, responsive drawer behavior, menu dismissal,
task-focused Help, and the production Vite bundle size reported by
`npm run build`.
