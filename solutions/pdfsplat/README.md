# PDFsplat™

Standalone package: **pdfsplat-selfhost-v3.1.30.zip**, available on the [download page](../../pages/download.html). Upload all included folders together; the package includes PDF rendering workers, export/encryption dependencies, the linked CipherSplat password generator, menus, and language controls. It also remains included in Tools and complete DrawSplat.

A privacy-first, browser-only PDF organizer and annotation editor. PDFs, images, text, edits, encryption passwords, and decrypted bytes remain on the user's device. PDFsplat™ contains no upload, account, cookie, analytics, or backend code.

## Public-release workflow

- Scan paper with a camera or import photos, adjust four page corners with pointer or keyboard controls, correct perspective, rotate and clean up scans, reorder pages, and create a local PDF.
- Open or drop a local PDF.
- Add another PDF and reorder pages across documents.
- Rotate, duplicate, delete, and extract pages.
- Separate page ranges or create one PDF per page in a ZIP.
- Add movable/resizable text, highlights, PNG/JPEG images, and freehand drawing.
- Sign directly on the PDF with a finger, stylus, or mouse: choose **Add signature → Draw signature on PDF** (or **Draw**), write multiple strokes, then choose **Done drawing** to resume scrolling. Pen color, width, and stroke undo are available; Save as PDF retains the ink locally.
- Add typed or uploaded signatures, headers, footers, and dynamic page numbers.
- Crop selected pages and apply manual fine rotation to straighten scans.
- Reverse page order, insert blank pages, and detect/remove visually blank pages with undo support.
- Insert PNG/JPEG files as new PDF pages and export selected PDF pages as PNG files.
- Click extractable PDF text and turn it into a covered, editable replacement text object.
- Edit replacement text directly in place on the PDF canvas.
- Drag over any PDF region with Remove area to create a movable/resizable visual cover.
- Undo and redo document and annotation changes.
- Export a new `-edited.pdf` copy without overwriting the source.
- Convert the edited document into a locally generated, reflowable EPUB 3 ebook with publishing metadata, optional cover artwork, structure-aware section names, table of contents, page list, landmarks, and an honest preflight report.
- Protect the edited result as a CipherSplat™ `.csplat` package.
- Authenticate, decrypt, and reopen a current CS4 CipherSplat™ PDF package.
- Create a rasterized sanitized copy that strips document metadata, scripts, attachments, forms, annotations, layers, and hidden content.
- Run a guide-based accessibility preflight for tagged structure, extractable text/OCR needs, document title and language, added-image descriptions, annotation contrast, and form-review needs.
- Export a semantic HTML alternative with a document language, descriptive title, skip link, one H1, page sections, readable text, and descriptions supplied for added images.

For offline use, extract the entire standalone ZIP and open `solutions/pdfsplat/index.html` in desktop Chrome or Firefox. Keep the sibling vendor and assets folders. The included `START-HERE.html` explains the local-server alternative for browsers that restrict file access: Windows, macOS, and Linux launchers require Python 3, but no internet connection. Core PDF editing, saving, and encryption are tested with networking disabled; capture/camera permissions depend on the browser.

Developers: `npm install` and `npm run build` in this directory regenerate the bundled classic script. The bundle builder also performs this build. Hosted pages retain a PDF worker; file pages load the bundled PDF.js worker implementation on the main thread.

## Editing sidebar

Tools are grouped into collapsible **Edit & annotate**, **Pages**, and **Output**
sections. Selecting a text box reveals text, size, color, and opacity controls at
the top of the sidebar. Selection controls stay in place while tool groups scroll.
On narrow screens the same controls appear below the document instead of being hidden.

## Scan to PDF

Choose **Scan to PDF** in the toolbar or **Scan paper or photos** on the opening
screen. Choose/drop photos, use **Take a photo** on a supported phone, or explicitly
open the live camera. Camera access is requested only when you press Open camera;
no microphone is requested. Close, Stop camera, PDF creation, and leaving the page
stop the camera. Photos and PDF bytes stay in browser memory.

Adjust the four corners clockwise (top left, top right, bottom right, bottom left)
and choose original color, contrast cleanup, grayscale, or black and white. Arrow
keys move a focused corner; Shift moves it farther. Save each page to preview the
perspective correction. Review every page, reorder or remove pages, and download
A4, US Letter, or fit-to-scan PDFs. **Add scans to editor** opens a new document or
appends to the current document with undo support. Closing the scanner discards
the scan session; download or add the pages first.

Up to 20 photos, 40 MB each; decoded photos are reduced to a 2,200-pixel longest
edge for predictable browser memory use. JPEG, PNG, and WebP are supported; other
phone formats depend on the browser decoder. Perspective correction uses the
manually chosen corners, not automatic document detection. The result is an
image-only PDF, with no OCR or searchable text layer. Cleanup does not restore
blurred or missing detail. Desktop Chrome and Firefox are tested; native mobile
camera/file-picker behavior still requires device-specific verification.

## Architecture and privacy

- PDF.js renders local PDF bytes.
- pdf-lib copies pages and flattens edits into exported PDFs.
- Annotation objects remain separate from source bytes until export.
- Command snapshots provide up to 100 undo/redo states.
- Object URLs hold inserted image previews and are revoked when the tab closes.
- No document or recovery data is written to localStorage or IndexedDB.
- Multi-file separation uses locally bundled JSZip.
- EPUB conversion extracts searchable text with PDF.js and packages standards-based EPUB 3, legacy NCX navigation, and EPUB Accessibility discoverability metadata with locally bundled JSZip.
- CipherSplat™ protection uses its CS4 chunked format: Argon2id v1.3 (64 MiB, three passes, one lane) and AES-256-GCM with authenticated metadata and records.
- Unlock accepts current CS4 packages containing exactly one PDF. Password fields are cleared after every attempt and passwords are never stored.

The production headers for `/solutions/pdfsplat/*` allow only same-origin connections for bundled application data and deny cross-origin connections and unnecessary browser permissions. `wasm-unsafe-eval` is limited to the locally bundled Argon2id WebAssembly engine.

## Honest limitations

- CipherSplat™ protection creates an encrypted `.csplat` package; it does not set a standard PDF-open password.
- Password-protected source PDFs are not opened in this release.
- Added objects are flattened during export and are no longer editable after reopening.
- Existing PDF text is not edited semantically.
- Click-to-edit works on PDF.js text runs and uses visual replacement. Scanned pages, outlined text, missing character maps, and complex font/layout runs require manual text boxes or future OCR support.
- Secure content-removing redaction, OCR, forms, search, compression, and accessibility certification are not claimed.
- EPUB conversion works best with searchable, single-column PDFs. Scans require OCR first, and complex columns, tables, equations, images, and fixed layouts are simplified or omitted.
- Remove area is visual removal only. It does not delete underlying PDF content and must not be treated as secure redaction.
- Annotation placement on already-rotated source pages should be visually checked before distribution.
- Browser memory and download limits still apply to very large documents.
- Blank-page detection uses a conservative low-resolution visual check; review the result and use Undo if a deliberately sparse page was removed.
- Deskew is a manual fine-rotation control, not automatic skew detection.
- Sanitization intentionally rasterizes pages, so the sanitized copy loses searchable/selectable text and may be larger than the edited PDF.
- The accessibility preflight is an aid, not a WCAG 2.1 AA certification. Reading order, heading hierarchy, links, lists, tables, color use, description quality, and screen-reader behavior still require human review.
- pdf-lib cannot author a complete tagged PDF structure tree. PDFSplat reports missing tags but does not claim to repair them; publish the semantic HTML alternative or remediate the exported PDF with a dedicated tagged-PDF tool.

## Dependency licensing

| Dependency | Use | License | Local asset |
| --- | --- | --- | --- |
| Mozilla PDF.js | Rendering and parsing | Apache-2.0 | `/vendor/pdf.min.js`, `/vendor/pdf.worker.min.js` |
| pdf-lib 1.17.1 | Page manipulation and export | MIT | `vendor/pdf-lib.min.js` |
| JSZip | Multi-part ZIP export | MIT/GPL-3.0 | `/vendor/jszip.min.js` |
| hash-wasm Argon2id | CipherSplat™ key derivation | MIT | `vendor/hash-wasm/argon2.umd.min.js` |

The pdf-lib and hash-wasm license files are bundled with their assets. No AGPL PDF engine or separately licensed PDF WASM engine is introduced.

## Tests

```bash
npm install
npx playwright install chrome firefox
npx playwright test -c solutions/pdfsplat/playwright.config.js
```

The browser suite verifies open/edit/reorder/rotate/export/reopen, PDF merging, range separation into ZIP, accessibility auditing and semantic HTML export, and CipherSplat™ protect/unlock round trips.

## Capture an open tab or window

Choose **Capture to PDF**, then **Choose tab or window** in a desktop browser that supports screen sharing. Share the tab or window showing your page, including a logged-in page or unpublished preview. Return here and capture a page. Scroll the source and capture again to add more pages. Only the visible area is captured; text becomes an image without OCR.

Review/remove captures, download a PDF, or append it to the editor. Each capture becomes one PDF page, with a limit of 20 captures and a 2,200-pixel longest edge. No audio is requested. Stop sharing, closing the dialog, adding or downloading the PDF, and leaving the page stop the shared stream. Closing the dialog discards captures.

Captures stay on your device. PDFSplat does not automatically scroll the source page or fetch websites. Unsupported browsers show an availability message and disable sharing; PDF editing and touch signing remain available independently.

## Handwriting and touch signatures

Open a PDF, then choose **Add signature → Draw signature on PDF** or **Draw**. Write directly on the page with a finger, stylus, or mouse; lifting between strokes leaves the pen active. Choose a color and Fine/Medium/Thick width. **Undo stroke** removes the most recent drawing stroke.

On phones, drawing hides the editing panel to give the PDF more room. Touch gestures draw while the pen is active; choose **Done drawing** (or Escape with a keyboard) before scrolling. Use **Save as → PDF** to retain marks in a downloaded copy. Freehand marks stay where you draw them; typed and uploaded signature objects remain movable and resizable.

Browser checks include Chrome, Firefox, iPhone WebKit emulation, touch cancellation, multiple pointers, and saving/reopening ink. Physical phone/tablet testing is still unverified. [September 23 walkthrough](../../blog/touch-signing-media-acceleration.html).

## Point placement and tool search (October 2026)

Choose **Add text**, **Add image**, or **Add signature**, then click or tap the
PDF page to place the item. Images are chosen first; typed signatures are entered
first. A dashed preview shows the pending item. The click is its top-left corner,
with the position shifted inward near the page edges to keep the item visible.
Nothing is added until placement. Escape or **Cancel placement** discards it;
switching pages or editing modes also cancels. Drawing a signature still uses the
existing pen workflow directly on the page.

Keyboard users can move the preview with arrow keys (Shift moves farther) and
press Enter to place it. After insertion, text properties receive focus. Images,
text, and signatures remain movable and resizable, and each insertion is one
undo step. Preview state is excluded from saved PDFs and document history.

**Find a tool** (Ctrl/Cmd+K) searches existing document and editing controls.
Matching tools show their group and remain disabled when no PDF is open. Selecting
one invokes the same action as its existing button. Undo and Redo now name the
edit they will reverse or restore.

These additions draw workflow inspiration from
[PDFCraft](https://github.com/storytold/pdfcraft)'s command catalogue and named
undo actions. No PDFCraft code, branding, assets, or runtime is included.

### Export rotation correction

Previously, cropping or deskewing any page rebuilt every exported page through
embedded page content. Embedding does not apply a PDF page's `/Rotate` entry, so
an untouched second page with a 180-degree rotation could become upside down.
Unchanged pages now use native page copying, preserving their rotation. Pages
that require a crop or deskew first materialize their source orientation before
transforming their content. Crop percentages follow the displayed page axes.
Annotation export maps display coordinates back to PDF coordinates, including
quarter-turn rotations and existing crop-box offsets.

Regression checks cover pointer and keyboard insertion, phone taps, cancellation,
undo/redo, full saved-PDF round trips at 0/90/180/270 degrees, mixed page rotations,
and page-two orientation when a different page is cropped or deskewed. Existing
scan, pen, conversion, image-resize, offline, protection, and page-management tests
remain included.

## On-page text formatting and UI languages (October 2026)

New text and typed signatures open an editor on the page after placement.
Double-click an existing text box or choose **Edit on page** to edit it again.
**Done editing** or Escape commits the text; the sidebar editor remains available.
The selected text toolbar provides whole-box bold, italic, and left/center/right
alignment. These styles are retained by PDF export, including rotated pages.
Resize handles and dragging the box border retain their existing behavior.
Ctrl/Cmd+B and Ctrl/Cmd+I toggle formatting while typing; text-field undo remains
native until the edit is committed to the document history.

PDF UI translations now include the drawing/formatting controls, page/output
controls, dialogs, help copy, and common changing status/history messages in all
five additional language choices. Translation is scoped to interface containers:
PDF content, inserted text, document metadata, and field values remain untouched.
Third-party engine errors are displayed as received. The bundled app and locale
files continue to work locally without a translation service.

## Matching replacement text

Editing detected PDF text inherits the dominant original run's font family,
size, bold/italic style, and sampled ink color. The original background color is
also used for the replacement cover. Embedded PDF.js fonts are reused in the
on-page editor; PDF export uses the closest Helvetica, Times, or Courier variant.
Mixed-style lines adopt their dominant run, and unusual fonts/complex backgrounds
may need manual adjustments. Existing color, size, bold, and italic controls and
undo remain available.

### Open documents and images as PDFs

Drop or choose PDF, DOCX, PPTX, EPUB, Markdown (.md/.markdown), TXT, or images. Multiple files combine into one PDF in the supplied order. Processing stays on the device; conversion does not fetch remote images or run embedded scripts. A failed conversion leaves the existing PDF open.

DOCX and EPUB text and embedded images are reflowed onto A4 pages. Markdown supports headings, paragraphs, basic lists, bold, italics, and fenced code. Latin text stays searchable; characters unavailable in the PDF standard fonts use rendered image tokens. PPTX slides become page images at their original page size, with basic positioned text, fills, and pictures. Complex Office layouts, themes, charts, tables, and ebook styling may differ; review the result before sharing. This is a lightweight local importer rather than an Office rendering engine.

Images use their original aspect ratio: PNG, JPEG, WebP, GIF, BMP, SVG, AVIF and ICO depend on browser decoding support. Animated images use the first frame. Large images are downsampled to a 4096-pixel maximum edge. Older DOC/PPT files, encrypted ebooks, and image formats the browser cannot decode need conversion elsewhere first. Converted inputs are limited to 50 MB each; multi-file imports accept up to 20 files totaling 100 MB. Single existing PDFs retain their original opening behavior.

Save as also offers PNG, JPG, and WebP. These exports include all pages with edits, cropping, and rotation at twice the PDF page resolution, on a white background. A single page downloads directly; multiple pages download in a ZIP containing numbered images. The Output → Export pages as images tool retains its selected-page PNG behavior.
