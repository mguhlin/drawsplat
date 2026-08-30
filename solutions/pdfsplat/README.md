# PDFsplat™

A privacy-first, browser-only PDF organizer and annotation editor. PDFs, images, text, edits, encryption passwords, and decrypted bytes remain on the user's device. PDFsplat™ contains no upload, account, cookie, analytics, or backend code.

## Public-release workflow

- Open or drop a local PDF.
- Add another PDF and reorder pages across documents.
- Rotate, duplicate, delete, and extract pages.
- Separate page ranges or create one PDF per page in a ZIP.
- Add movable/resizable text, highlights, PNG/JPEG images, and freehand drawing.
- Click extractable PDF text and turn it into a covered, editable replacement text object.
- Edit replacement text directly in place on the PDF canvas.
- Drag over any PDF region with Remove area to create a movable/resizable visual cover.
- Undo and redo document and annotation changes.
- Export a new `-edited.pdf` copy without overwriting the source.
- Convert the edited document into a locally generated, reflowable EPUB 3 ebook with publishing metadata, optional cover artwork, structure-aware section names, table of contents, page list, landmarks, and an honest preflight report.
- Protect the edited result as a CipherSplat™ `.csplat` package.
- Authenticate, decrypt, and reopen a current CS4 CipherSplat™ PDF package.

Serve the repository over HTTP and open `/solutions/pdfsplat/`. PDF.js workers and Web Crypto require HTTPS, localhost, or an equivalent secure context.

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
npx playwright test -c solutions/pdfsplat/playwright.config.js
```

The browser suite verifies open/edit/reorder/rotate/export/reopen, PDF merging, range separation into ZIP, and CipherSplat™ protect/unlock round trips.
