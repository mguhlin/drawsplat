# PDFSplat: ODT, compact menus, and current previews

## Open and save ODT

Choose **Open file**, or drop an `.odt` document onto PDFSplat. Conversion runs on
your device. Headings, basic inherited text styles, numbered/bulleted lists,
table-cell text, explicit page breaks, and embedded pictures reflow into PDF
pages. You can annotate, organize, edit available text, or recognize image text
with [OCR](pdfsplat-ocr.md), then save a new PDF or another supported format.

**Save as → OpenDocument — ODF (.odt)** remains available. Choose reflowable
content for text, or page appearance for complete page images. Reopening these
ODT files converts them into PDF pages again; this is not native ODT editing.

Review complex layouts, floating frames, tables, fields, notes, and tracked
changes. Exact page geometry and fonts are not reconstructed. External pictures,
embedded scripts, and active objects are not loaded. Encrypted ODT files need an
unencrypted copy. Failed imports leave the current document open. Existing
limits apply: 50 MB per converted file; up to 20 files/100 MB for combined imports,
100 MB decompressed archive content, and 10,000 ODT paragraph/image blocks.

## Find actions in the compact toolbar

- **Open file**, **Save as**, **OCR**, Undo/Redo icons, and **Apps** remain direct actions.
- **Tools** contains Capture to PDF, Scan to PDF, Add PDF, Protect / Unprotect,
  Save PDF to Google Drive, and Find a tool.
- **View** contains Present PDF, Full screen, and interface language.
- Open a menu with Enter or Space; arrow keys move between its action buttons.
  Escape closes it and returns focus. Clicking outside closes it. History icons
  retain tooltips and accessible names describing the action they undo/redo.
- On phones the toolbar wraps to preserve document width. The Pages button opens
  the thumbnail panel. No horizontal toolbar hunt is needed to find OCR.

## Thumbnails and OCR covers

Thumbnails render the current edited page, including replacement text, OCR,
other annotations, crop/rotation changes, and Undo/Redo. Typing updates the
preview after a short delay. Preview rendering does not commit unfinished
inline edits or move keyboard focus. Pages outside the visible thumbnail region
render when you scroll them into view.

Replacement text and OCR estimate the background from around a detected line before choosing its
ink color. This avoids confusing large white letters with a white background
on dark/gradient covers. Fonts, spacing, and complex backgrounds remain
approximate; review them before sharing. Covers preserve underlying content
and are not secure redaction. To use the improved sampling on an earlier result,
reopen the **original PDF** and recognize again; previously applied covers are
not automatically recolored.

## Install and verify

Use the v3.1.48 PDFSplat, Tools, full DrawSplat, or complete district-suite ZIP from
[Downloads](../pages/download.html#pdfsplat-odt-toolbar). Keep all included folders.
Ordinary PDF/ODT conversion supports direct-file opening in desktop Chrome and
Firefox. OCR requires HTTPS or the included local HTTP launcher (Python 3), with
its engine and models included for offline use.

Chrome/Firefox checks cover a LibreOffice 25.2-saved ODT, PDFSplat ODT round trips,
styles, embedded pictures, explicit page breaks, external-link exclusion,
encrypted/malformed-document recovery, menu keyboard behavior, 390/800/1280/1920 px
layouts, current thumbnails, Undo/Redo, retained inline editing, and light text
on a purple gradient. Physical device behavior and complex documents still need
review.
