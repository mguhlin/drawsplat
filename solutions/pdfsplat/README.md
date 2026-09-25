# PDFsplat™

Standalone package: **pdfsplat-selfhost-v3.1.27.zip**, available on the [download page](../../pages/download.html). Upload all included folders together; the package includes PDF rendering workers, export/encryption dependencies, the linked CipherSplat password generator, menus, and language controls. It also remains included in Tools and complete DrawSplat.

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
