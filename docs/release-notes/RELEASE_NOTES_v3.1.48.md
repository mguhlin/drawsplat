# v3.1.48 — PDFSplat ODT, compact menus, and current previews

October 30, 2026.

## Changes

- Open or drop OpenDocument Text (.odt) locally. Headings, basic inherited styles, lists, table-cell text, explicit page breaks, and embedded images reflow to PDF. Existing ODT export stays available. MIME detection supports ODT files without an extension. External assets/scripts are excluded; damaged, encrypted, and non-text ODF packages preserve the open document.
- A compact toolbar keeps Open file, Save as, OCR, and icon Undo/Redo directly available. Tools groups capture, scan, merging, protection, Drive saving, and tool search. View groups presentation, full screen, and interface language. Menus support keyboard navigation, Escape, and outside-click closing; history icons retain descriptive names/tooltips.
- Thumbnails render current annotations and crop/rotation edits. They refresh after typing/commits and follow Undo/Redo, without committing unfinished inline edits or moving focus. Stale renders are discarded when pages change.
- Replacement text and OCR sample around a detected line to better preserve light lettering on dark/gradient backgrounds. Covers remain anchored. Font sizes are rounded for readable controls, and the OCR move handle uses a consistent icon size.

## Limits and updating

ODT import is a reflow conversion, not native ODT editing or exact layout reconstruction. Review tables, floating frames, fields, notes, tracked changes, and unusual fonts. Encrypted files need an unencrypted copy. Existing file/archive limits remain; ODT flow accepts up to 10,000 paragraph/image blocks.

OCR fonts, spacing, and complex backgrounds are approximate. Covers are visual replacement, not secure redaction. Reopen the original PDF and recognize again to use improved sampling on an earlier result; existing covers are not automatically recolored. OCR continues to need HTTPS or the included local HTTP launcher, with engine/models bundled for offline use. Ordinary PDF/ODT conversion still supports direct-file opening in tested Chrome and Firefox.

PDFSplat, Tools, full DrawSplat, and the complete district suite are refreshed as v3.1.48. Other downloads retain their listed versions. Keep the entire extracted folder structure and back up work/server configuration before replacing files. `SHA256SUMS-v3.1.48.txt` covers these four ZIPs; the district suite also has an individual `.zip.sha256` file.

## Verification

Chrome and Firefox checks cover LibreOffice-saved ODT, PDFSplat export/import round trips, styles, lists, table text, embedded pictures, page breaks, malformed/encrypted packages, external-resource exclusion, menu actions and keyboard behavior, desktop/phone layouts, live thumbnails, Undo/Redo, continued inline editing, and white text on a purple gradient. Existing PDF import, edit, export, scan, protection, presentation, and offline regressions are checked before publication. A complete Chrome/Firefox run passed 259 checks with seven platform-specific skips, followed by focused checks for the final changes. Wiki contact-form tests now intercept the native mail-app handoff while checking the recipient and draft contents, preventing test runs from opening a mail client. Packaged source/runtime files and release hashes are verified.

[Guide](../pdfsplat-odt-toolbar.md) · [OCR workflow](../pdfsplat-ocr.md) · [Downloads](../../pages/download.html#pdfsplat-odt-toolbar) · [Wiki installation notes](../../wiki/modular-selfhost.html).
