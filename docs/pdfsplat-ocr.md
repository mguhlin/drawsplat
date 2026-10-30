# PDFSplat: make scanned text editable

PDFSplat can recognize printed English and Spanish text inside scanned PDFs,
photos, screenshots, and image regions. Recognition runs on your device with
bundled Tesseract.js 7 and language models. No document upload, API key, account,
or model download is required.

## Recognize, review, and apply

1. Open a PDF or image in [PDFSplat](../solutions/pdfsplat/). For camera scans,
   choose **Scan to PDF**, correct the corners, and **Add scans to editor**.
2. Rotate pages upright before recognition. Set fine rotation to **0°**; use a
   straightened source image or the scanner's perspective correction if needed.
3. Choose **Recognize text (OCR)** in the top toolbar. Select the current page,
   selected pages, or all pages, then English, Spanish, or both languages.
4. Choose **Recognize text**. Review the original-page previews and every detected
   line. Correct spelling, accents, punctuation, and reading order; uncheck anything
   you do not want. Confidence below 75% is highlighted; below 50% starts unchecked.
5. Choose **Apply selected text**. PDFSplat adds editable text boxes with visual
   covers over the original lettering. Click a box to type or use **Selected text**
   in the sidebar. Drag its move handle to reposition it; the original cover stays
   anchored. Text size, color, formatting, and resizing remain available.
6. **Save as → PDF** creates a new PDF with selectable text. Applied OCR also feeds
   text-based document/ebook exports. **Download recognized text** in the review
   panel saves checked lines as TXT without changing the PDF.

Applying a batch is one Undo step. Closing a review makes no changes. Stop
terminates the recognition worker, including during model loading; completed
page previews remain available. Recognition skips existing selectable text and
regions outside the current crop. It reads the visible composition, including
inserted images and visual covers, rather than uncovering masked image pixels.
Running OCR again skips text already applied.

## Offline and self-hosted use

Use the v3.1.47 PDFSplat, Tools, full DrawSplat, or complete district-suite ZIP from
[Downloads](../pages/download.html#pdfsplat-ocr). Extract the whole ZIP and retain
`solutions/pdfsplat/vendor/ocr/` plus the shared vendor/assets folders. Open
**START-HERE.html** and use the included local launcher (Python 3), or serve the
files on an HTTPS static host. OCR workers need HTTP/HTTPS and do not run from a
`file://` page. Ordinary PDF editing still supports direct-file opening in tested
desktop Chrome and Firefox. Local OCR needs no internet connection.

The worker and language data are discarded when recognition finishes or stops.
Models are bundled locally and are not cached in IndexedDB. Documents and review
results stay in memory; save a result before closing the app. Optional Google
Drive saving remains a separate, explicitly authorized action.

## Accuracy, layout, and limits

- This is printed-text recognition, not handwriting or mathematical notation
  reconstruction. Clear, upright scans with simple backgrounds work best.
- Fonts, colors, spacing, columns, and covers are approximate. Complex artwork,
  low-resolution images, gradients, and rotated text require careful review.
- Output uses standard PDF fonts supporting English and Spanish accents. If a
  reviewed line contains an unsupported symbol, Apply asks you to correct or
  uncheck it before making any changes. Very long corrections must fit the box.
- Each batch accepts up to **20 pages and 2,000 new lines**. Page rendering is
  bounded to **8 million pixels** and a **3,200-pixel longest edge**. Recognize
  smaller batches on devices with limited memory.
- Set orientation before OCR. Changing page rotation after applying OCR is blocked
  to protect placement; Undo the OCR batch, rotate, and recognize again. Fine
  rotation must be 0° when recognizing.
- Covers preserve the original image underneath. They are **visual replacement,
  not secure redaction**. Scanned text that you leave unchecked remains an image.
- Saving PDF writes text into the output. Reopening it uses PDFSplat's existing
  click-to-edit replacement workflow; the in-memory annotation history is not
  saved as a restorable project. Sanitized image-only export removes selectability.

## Dependencies and verification

Tesseract.js 7.0.0, Tesseract.js-core 7.0.0, and the English/Spanish best-integer
models from `@tesseract.js-data/*` 1.0.0 are bundled under Apache-2.0. Provenance,
licenses, package integrity, and file hashes are in
[`vendor/ocr/`](../solutions/pdfsplat/vendor/ocr/README.md).

Real-engine Chrome and Firefox checks cover English/Spanish scans, mixed native
text and scans, saved selectable text, corrected/excluded lines, atomic Apply,
Undo/Redo, duplicate detection, cancellation, missing-model recovery, movement
with anchored covers, and phone review. No external recognition requests are
made. Physical phone performance and complex layouts still require review.
