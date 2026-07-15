# ShowSplatTM Development Plan

ShowSplatTM is the SplatWorksTM presentation app. It should feel consistent
with GridSplatTM while focusing on slide authoring, live presenting, and
single-file WebDeck export.

## Implementation Status

The first implementation scope has been completed for the current static
SplatWorksTM release:

- Static app at `/splatworks/showsplat/`: complete.
- Public page at `pages/showsplat.html`: complete.
- Navigation and launch state: complete.
- Core editor with slide rail, 16:9 canvas, menus, toolbar, notes, templates,
  themes, object drag/resize, text/list/image/video/audio/table insertion,
  Markdown import/export, WebDeck export, PDF print, slideshow preview, and
  WebDeck/PPTX/ODP workflows: complete for the current supported subset.
- In-app Help and keyboard shortcuts: complete.
- Development-plan links have been removed from user-facing pages and menus;
  this document remains a maintainer artifact.

Remaining improvement areas are fidelity and scale work, not blockers for the
current launch: stronger PPTX/ODP parity, editable PDF text extraction, large
deck storage improvements, direct deterministic PDF output, deeper object
editing, and fixture-based regression tests.

## Feature Set

The target feature set draws from WebDeck Project Instructions v2.0, common
presentation workflows in LibreOffice Impress, Google Slides, Microsoft
PowerPoint, and HTML slide tools such as reveal.js.

### Core Workspace

- Slide thumbnail rail on the left for selecting, duplicating, deleting, and
  reordering slides.
- Large 16:9 slide canvas in the center.
- Inspector/notes area for speaker notes and selected-object properties.
- Dropdown menu bar with File, Edit, Insert, Format, SlideShow, View,
  Templates, and Help menus.
- Icon-first toolbar for common actions.
- Autosave to browser storage.
- Keyboard shortcuts for slide navigation, delete, duplicate, save, and present.

### Slide Editing

- Text boxes, headings, bullet lists, tables, hyperlinks, slide numbers,
  headers, footers, and information bars.
- Image insertion from upload, URL, SplatImage Studio handoff, and DrawSplat
  Concept Studio handoff when those tools expose compatible local handoff data.
- Video insertion for YouTube embeds, MP4, and WebM.
- Audio insertion for common browser-playable audio files.
- Drag, resize, and layer controls for slide objects.
- Basic text formatting: font family, size, bold, italic, underline, color,
  background/fill, alignment, and list style.
- Image/video formatting: position, size, border, crop-fit mode, opacity, and
  alt text.
- Table formatting: rows, columns, cell fill, borders, alignment, and merge
  support in a later phase.

### Themes and Templates

- Color themes with named palettes.
- Slide template gallery: title, title/content, section break, quote, image
  focus, comparison, table, media, and closing resources.
- Master slide / theme editor for footer bars, default fonts, colors, and slide
  number placement.
- Minimalist information bars across the bottom of slides.

### Markdown Studio

- Built-in Markdown editor for outline-first deck creation.
- Markdown import using `---` as slide separators.
- Heading-to-title, bullet-list, quote, code block, and image syntax support.
- Markdown export from the current deck.

### Presentation

- Start from first slide and start from current slide.
- Fullscreen browser presentation.
- Presenter controls with notes, current slide, next slide, timer, and keyboard
  navigation.
- Audience WebDeck output with floating navigation pill, progress bar, notes
  panel, hash deep links, touch swipes, and responsive layout.

### Export

- WebDeck HTML: a single self-contained HTML page with embedded CSS, JS, slide
  data, notes, navigation, and optional frontend password prompt backed by a
  stored SHA-256 hash.
- Markdown export.
- PDF export through print-to-PDF in the browser.
- ODP and PPTX export as first-pass real file writers.
- PDF import as image-based slide pages.
- ODP and PPTX import as best-effort editable decks with text, images, many
  shapes, backgrounds, and basic grouping.

### Accessibility and Safety

- Keep editable text as real text wherever possible.
- Provide alt text fields for images and media.
- Preserve link targets with `target="_blank"` and `rel="noopener"`.
- Do not rely on external libraries for exported WebDecks.
- Warn that the frontend WebDeck password is a classroom/privacy convenience,
  not cryptographic protection. Content remains present in the HTML.

## First Implementation Scope

- Static app at `/splatworks/showsplat/`.
- Public landing page at `pages/showsplat.html`.
- Navigation updates so ShowSplatTM is no longer a disabled planned item.
- Core editor with slide rail, canvas, menus, icon toolbar, notes, templates,
  object drag/resize, text/list/image/video/audio/table insertion, theme
  controls, Markdown import/export, WebDeck export, PDF print, and slideshow
  preview.
- SplatWorks packaging support after the first app is stable.

## Current Implementation Notes

- WebDeck HTML and `.showsplat.json` remain the cleanest editable formats.
- Markdown import/export is useful for outline-first decks.
- PDF import is intentionally image-based today. It preserves page appearance
  and supports password prompts, but it does not recover editable PDF text.
- PPTX and ODP import/export are usable first passes, not full PowerPoint or
  LibreOffice fidelity. The current parser handles many common text, image,
  background, opacity, and grouping cases, but some masters, masks, theme
  effects, freeform paths, and exact font metrics will differ.
- The editor includes user-requested workflow polish: menu submenus, mutually
  switching view modes, selected-box bullet toggle, font size decrease/increase
  buttons, zoom slider, footer-bar import behavior, last-slide delete safety,
  auto-fit on WebDeck HTML import, auto-hiding presenter controls, task-focused
  Help, and a keyboard shortcuts dialog.

## Next Run Improvement Areas

- **PPTX and ODP fidelity.** Improve freeform shape parsing, clipping and image
  masks, exact group transforms, master-slide inheritance, theme font mapping,
  z-order edge cases, chart/table imports, and speaker notes extraction.
- **Editable PDF import.** Add positioned text extraction and optional OCR so
  imported PDFs can become editable text boxes instead of only slide images.
- **Storage and performance.** Move large imported assets out of localStorage
  into IndexedDB, lazy-render thumbnails, add compression controls, and warn
  before browser autosave becomes too large.
- **Export fidelity.** Add a direct deterministic PDF writer or a dedicated
  print layout, then strengthen PPTX/ODP export with masters, media reuse,
  notes, and theme metadata.
- **Object editing.** Add a layers/object list, lock/background controls,
  table cell editing, crop handles for imported image masks, and clearer
  warnings when a selected item is an image snapshot instead of editable text.
- **Regression tests.** Build fixture decks for WebDeck, PPTX, ODP, and PDF
  imports, then compare generated thumbnails against reference renders from
  LibreOffice/PowerPoint-style output.
