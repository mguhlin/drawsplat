# v3.1.47 — PDFSplat local OCR

October 30, 2026.

## Editable text from scans and images

- Open a PDF or image, or add camera scans/captures to the editor. Choose **Recognize text (OCR)** for the current, selected, or all pages.
- Printed English, Spanish, and combined-language recognition run locally with bundled Tesseract.js 7, cores, and language models. No recognition upload, account, API key, or model download is needed.
- Review original-page previews, confidence scores, and detected lines. Correct text, choose which lines to include, or download selected recognized text as TXT.
- Apply creates editable text boxes with sampled ink/background colors and anchored covers. Moving/resizing a text box leaves its cover over the original lettering. One Undo removes the batch; Redo restores it.
- PDF export saves selectable text. Applied OCR feeds the existing text-based document and ebook exports. Existing selectable text, already-applied OCR, and text outside the crop are skipped. Recognition uses the current visible composition, retaining masks and inserted images.
- Stop terminates the owned worker even during model loading. Closing the review discards it. Missing models and unsupported output characters leave the document unchanged; correct/uncheck problematic lines and retry.

## Limits and offline setup

OCR needs HTTPS or the included local HTTP launcher (Python 3); it cannot run from `file://`. Direct-file PDF editing remains supported in desktop Chrome and Firefox. All OCR assets are included for offline recognition.

Batches accept up to 20 pages and 2,000 new lines, with page renders limited to 8 MP and a 3,200-pixel longest edge. Rotate pages upright before OCR and keep fine rotation at 0°. Changing orientation after OCR is blocked until that batch is undone. Clear printed text works best; fonts, colors, columns, and covers are approximate. Handwriting, equations, and complex layouts are not reconstructed. Covers preserve the original image and are not secure redaction. Review spelling, accents, placement, and reading order.

## Downloads and documentation

The PDFSplat, full DrawSplat, Tools, and complete DrawSplat + SplatWorks district-suite ZIPs are refreshed as v3.1.47. Other app/collection packages retain their separately listed versions. Keep the entire extracted folder structure and back up projects/server configuration before updating. The release includes `SHA256SUMS-v3.1.47.txt` for these four ZIPs and an individual district `.zip.sha256` file. Earlier releases remain available.

[OCR guide](../pdfsplat-ocr.md) · [Downloads](../../pages/download.html#pdfsplat-ocr) · [Wiki installation notes](../../wiki/modular-selfhost.html) · [Dependency provenance and licenses](../../solutions/pdfsplat/vendor/ocr/README.md).

## Verification

Twenty real-engine Chrome and Firefox checks passed. They cover image-only English/Spanish scans, mixed native/scanned pages, corrected and excluded lines, selectable saved-PDF text, atomic Apply, Undo/Redo, duplicate recognition, cancellation during loading, missing-model recovery, movement with anchored covers, and phone review. Local requests are verified without external recognition connections. Existing PDF editing, export, import, offline, signing, and wiki regressions were also checked. Pointer-based image/EPUB checks scroll their targets into view before dragging, including with the taller toolbar. Physical phone performance and complex layouts remain subject to review.
