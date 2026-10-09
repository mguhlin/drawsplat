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
- undo and redo (Ctrl/Cmd+Z and Ctrl/Cmd+Y) across slide and object edits
- faithful slide-rail thumbnails that mirror imported WebDeck styling
- automatic contrast repair for faint imported text so it stays readable
- a slide-rail "Add slide" template picker for choosing a starting layout
- paste (Ctrl/Cmd+V or right-click) and drag-and-drop of images onto a slide
- an off-slide holding area for staging objects that stay out of the presentation
- WebDeck HTML export built on the reference WebDeck framework (Appendix A CSS
  and Appendix B JS embedded verbatim): every deck ships the standard seven-control
  toolbar (prev · counter · next · notes · presenter · fullscreen · help), a
  slide-up notes panel, top progress bar, phone reflow, print/PDF, and a
  two-monitor presenter view with current/next-slide previews, synced speaker
  notes, and a running timer that stays in sync via BroadcastChannel

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

ShowSplatTM follows the [canonical WebDeck v5 specification](https://mguhlin.github.io/webdecks/webdeck_spec_v5.md):

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

## Find slides

Use **View → Find slides**, the **Find slides** button above the slide rail, or
**Ctrl/Command + Shift + F**. Search titles, text, tables, imported slide HTML,
image descriptions, and speaker notes. Search ignores case and accent marks;
multiple words must all match. The Search in menu limits results to titles,
content, or notes. Press Enter in the search field to open the first result.

The navigator includes hidden slides and children of collapsed groups and labels
those states. Opening a result selects it for editing without changing its
visibility, group structure, content, or Undo history. Results are refreshed
each time the navigator opens. Search stays local and does not fetch media.
Navigation does not alter the presentation or export content.

Inspired by [DeckCraft's outline and notes workflow](https://github.com/storytold/deckcraft),
implemented independently without adding runtime dependencies.

Run browser checks with `npx playwright test --config=splatworks/showsplat/playwright.config.js`
from the repository root. Set `SHOWSPLAT_URL` to test a hosted origin.


## WebDeck v5

Presentation and exported HTML now embed the v5 CSS/JavaScript from
https://mguhlin.github.io/webdecks/. The runtime includes the exit control
(hidden on the first slide and in print) and presenter A−/A+ notes sizing,
with keyboard +/- controls and saved notes size. Existing themes, placed
objects, speaker notes, hidden-slide omission, and self-contained HTML remain
supported; old editable decks need no migration. Already downloaded WebDecks
retain their embedded runtime; export them again to receive v5.

The project copy points Exit to ShowSplat and gives the next-slide preview a
separate DOM id from the next-navigation button so previews and navigation
both work. These adaptations preserve the v5 public keyboard map and controls.
The upstream MIT license is included in `webdeck-framework.LICENSE.txt`.
