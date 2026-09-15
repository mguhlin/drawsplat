# PDFsplat Save as

Use **Save as…** in the document toolbar to download the current document.

| Format | Output |
| --- | --- |
| PDF | Edited visual pages, including images and drawings |
| Markdown | Escaped plain text with document and page headings (`.md`) |
| Word | Editable text in an Office Open XML document (`.docx`) |
| OpenDocument | Editable text in an ODF 1.3 text document (`.odt`) |
| EPUB | Reflowable EPUB 3 with metadata, optional cover, and navigation |
| JSON | Versioned metadata and ordered, numbered page text (`.json`) |

Text formats include added/replacement text and current page order. Original
text runs intersecting masks or replacement covers are omitted; runs outside
the selected crop are omitted. This is not secure PDF redaction. Text
conversion does not preserve drawings, images, tables, or exact layout. Check
reading order, especially for columns and rotated text. No OCR is performed;
pages without selectable text produce a warning. JSON is a text interchange
format, not a restorable editor project.

Inserted images have four proportional resize handles. Drag a handle or use
its arrow keys (Shift for larger steps). The opposite corner stays fixed.
Resize supports Undo/Redo and is retained when saving PDF. Images start with
their original aspect ratio.

Validation: browser tests cover all formats, XML package parsing, text edits,
covered text, crops, page order, empty pages, phone layout, all four image
handles, Undo/Redo, and saved PDF image dimensions. DOCX and ODT outputs were
also opened and converted to text with LibreOffice.
