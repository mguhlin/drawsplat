# PDFsplat Save as

Use **Save as…** in the document toolbar to download the current document.

| Format | Output |
| --- | --- |
| PDF | Edited visual pages, including images and drawings |
| Markdown | Formatted text with inferred headings, emphasis, paragraphs, lists, and links (`.md`) |
| Word | Formatted editable text or page images in an Office Open XML document (`.docx`) |
| OpenDocument | Formatted editable text or page images in an ODF 1.3 text document (`.odt`) |
| EPUB | Formatted reflowable text or page images, with metadata, cover, and navigation |
| JSON | Versioned metadata, numbered page text, and structured blocks with style spans (`.json`) |

Text formats include added/replacement text and current page order. Original
text runs intersecting masks or replacement covers are omitted; runs outside
the selected crop are omitted. This is not secure PDF redaction. Text
conversion infers headings and paragraphs from PDF font sizes and positions,
and retains detectable bold/italic styles, font family and size (where the
format supports them), list structure, alignment, and safe web/email links.
Complex tables, drawings, and exact layout are not reconstructed as editable
content. Check reading order, especially for columns and rotated text. No OCR is performed;
pages without selectable text produce a warning. JSON is a text interchange
format, not a restorable editor project.

For Word, ODT, and EPUB, choose **Formatting → Keep page appearance** to keep
the complete visual pages, including images, graphics, and layout, as embedded
PNG page images. Rendering uses up to 144 dpi, capped at 2200 pixels on the
longest edge. Pages are scaled to fit the destination's page or reading area.
Text inside those images is not selectable, editable, or reflowable. This mode
also works for scans without OCR and includes current edits and page order.
Markdown has no exact-layout mode; use its improved text formatting or PDF.

Inserted images have four proportional resize handles. Drag a handle or use
its arrow keys (Shift for larger steps). The opposite corner stays fixed.
Resize supports Undo/Redo and is retained when saving PDF. Images start with
their original aspect ratio.

Validation: browser tests cover all formats, XML package parsing, text edits,
covered text, crops, page order, empty pages, phone layout, all four image
handles, Undo/Redo, and saved PDF image dimensions. DOCX and ODT outputs were
also opened and rendered to PDF with LibreOffice, in both formatted-text and
page-appearance modes. Formatting fixtures cover headings, mixed emphasis,
wrapped paragraphs, bullet and numbered lists, links, and colored graphics.
