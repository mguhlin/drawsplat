# ShowSplatTM Development Plan

ShowSplatTM is the SplatWorksTM presentation app. It should feel consistent
with GridSplatTM while focusing on slide authoring, live presenting, and
single-file WebDeck export.

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
- PDF export through print-to-PDF in the browser for the first phase.
- ODP and PPTX export are planned as real file writers after the deck model
  stabilizes. They should not be marked complete until implemented.

### Accessibility and Safety

- Keep editable text as real text wherever possible.
- Provide alt text fields for images and media.
- Preserve link targets with `target="_blank"` and `rel="noopener"`.
- Do not rely on external libraries for exported WebDecks.
- Warn that the frontend WebDeck password is a classroom/privacy convenience,
  not cryptographic protection. Content remains present in the HTML.

## First Implementation Scope

- Static app at `/showsplat/`.
- Public landing page at `pages/showsplat.html`.
- Navigation updates so ShowSplatTM is no longer a disabled planned item.
- Core editor with slide rail, canvas, menus, icon toolbar, notes, templates,
  object drag/resize, text/list/image/video/audio/table insertion, theme
  controls, Markdown import/export, WebDeck export, PDF print, and slideshow
  preview.
- SplatWorks packaging support after the first app is stable.
