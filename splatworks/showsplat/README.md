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
- WebDeck HTML export with optional frontend password hash
- WebDeck HTML import for compatible `SLIDES` array decks
- AI-ready JSON instructions for generating editable ShowSplat/WebDeck content
- browser print-to-PDF export

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
