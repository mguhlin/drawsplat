# WriteSplatTM

WriteSplatTM is the SplatWorksTM writing and classroom publishing app.

This static Vite + TypeScript app currently includes:

- SplatWorksTM app chrome
- menu bar with grouped export/table submenus, far-right Teacher menu, and SplatWorksTM-style icon toolbar
- shared DrawSplatTM language preference switcher for the app chrome
- editable document canvas
- local browser autosave
- named browser document library backed by localStorage
- live word and sentence counts
- native `.writesplat.json` export/import hooks
- native `.writesplat.json` metadata for title, author, and target grade
- plain text, Markdown, and standalone HTML exports
- ProseMirror document editing with basic marks, H1-H6 headings, blockquotes, code blocks, lists, undo, and redo
- system font family, font size, text color, highlight, and paragraph alignment controls
- view-only editor zoom control
- larger document canvas with content-based zoom rather than transform scaling
- links, embedded image upload, tables with row/column controls and cell merge/split, document templates, and find/replace
- drag-and-drop block reordering with document-safe ProseMirror transactions
- raw and split Markdown editing for headings, paragraphs, lists, links, images, emphasis, rules, quotes, and code blocks
- horizontal rules and page break insertion with print styling
- cloze marking with student/teacher HTML export modes
- MLA, APA, and Chicago citation assistant with maintained Works Cited section insertion
- teacher-only marking, Student View, and student/teacher view HTML exports
- RTF and DOCX exports, plus ODT import/export for LibreOffice with documented limitations
- export options dialog with lossy-format notes
- read-aloud controls using browser SpeechSynthesis with current-word highlighting
- sentence and paragraph scrambler tools with preserved teacher answer keys
- vocabulary list highlighter with non-mutating inline decorations
- kid-friendly readability card with grade status, expandable stats, adjustable target grade, and color-coded writing suggestion cards
- collapsible right-side readiness panel for readability and educator tools, with tablet drawer behavior
- task-focused Help dialog covering writing, saving, teacher tools, readability, privacy, exports, and shortcuts

## Development

```bash
npm install
npm run dev
npm run build
npm run build:singlefile
npm test
```

The app is built for the static path `/splatworks/writesplat/`.
`npm run build:singlefile` also writes `dist/writesplat-singlefile.html` for
portable offline lessons.

## License

WriteSplatTM is part of the SplatWorksTM GPL-covered app family. Unless a file
inside this directory says otherwise, WriteSplatTM code is GPL-3.0-only.

The broader DrawSplatTM whiteboard, tools, widgets, games, backends, and
compliance features remain under the repository-level DrawSplatTM license unless
a file or subdirectory says otherwise.
