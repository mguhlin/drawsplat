# ShowSplatTM

ShowSplatTM is the SplatWorksTM presentation and WebDeck authoring app.

The first implementation is a static browser app with:

- slide thumbnails on the left
- 16:9 editable slide canvas
- dropdown menus and icon toolbar
- text, bullet lists, tables, images, YouTube embeds, MP4/WebM video, and audio
- drag and resize for slide objects
- notes panel
- template slides and themes
- Markdown Studio import/export
- WebDeck HTML, PDF, ODP, and PowerPoint/PPTX import options
- WebDeck HTML export with optional frontend password hash
- WebDeck HTML import for compatible `SLIDES` array decks
- canonical WebDeck import/export using direct `<section class="slide">` markup,
  embedded speaker notes, presenter view, reflow, print/PDF, and offline runtime
- twenty starter slide templates and editable deck-wide theme colors
- ODP and PowerPoint/PPTX export
- AI-ready JSON instructions for generating editable ShowSplat/WebDeck content
- browser print-to-PDF export
- selected text-box bullet toggles and font size decrease/increase buttons
- presentation controls that auto-hide and a pop-out notes window
- task-focused in-app Help and keyboard shortcuts dialogs
- last-slide delete safety that replaces the final slide with a blank title slide

## In-App Help

The Help menu now opens product-facing guidance inside ShowSplatTM for building
decks, editing slide objects, using Markdown Studio, presenting, saving,
exporting, importing, and privacy. Technical planning documents stay in
`docs/` for maintainers rather than appearing in the user-facing Help menu.

## Import and Export Notes

- WebDeck HTML and `.showsplat.json` are the preferred editable formats.
- Markdown import/export is outline-first and keeps content editable.
- PDF import renders each page as a full-slide image. It is useful for visual
  fidelity, including password-protected PDFs after the password prompt, but
  the text inside the PDF is not editable yet.
- PDF export uses the browser print dialog. Choose "Save as PDF" from the
  print destination.
- PPTX and ODP import/export are first-pass compatibility features. Text,
  images, many shapes, backgrounds, and basic grouping are supported, but
  complex masks, master-slide inheritance, theme font mapping, and advanced
  drawing effects still need more fidelity work.

## WebDeck Direction

ShowSplatTM follows the WebDeck Project Instructions v2.0 direction:

- exported decks should be single HTML files
- slide content should be data-driven
- audience controls should include a floating navigation bar, progress, notes,
  keyboard navigation, hash links, and touch-friendly behavior
- frontend password protection is a convenience barrier only, not encryption

## AI Authoring Instructions

Use `docs/ai-webdeck-format-instructions.json` when asking an AI chatbot to
generate content that ShowSplatTM can import and edit. The preferred editable
format is `.showsplat.json`. The backward-compatible portable format is a
single WebDeck HTML file with a JavaScript `SLIDES` array where each slide has
`bg`, `title`, `html`, and `notes`.

## License

ShowSplatTM is part of the SplatWorksTM GPL-covered app family. Unless a file
inside this directory says otherwise, ShowSplatTM code is GPL-3.0-only.

The broader DrawSplatTM whiteboard, tools, widgets, games, backends, and
compliance features remain under the repository-level DrawSplatTM license unless
a file or subdirectory says otherwise.
