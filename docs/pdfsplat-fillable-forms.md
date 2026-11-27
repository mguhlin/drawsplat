# Fillable PDFs and standard PDF passwords

Open a PDF and choose **Edit & annotate → Fillable form fields**. **Make it fillable** examines the selected pages locally for underlines, rectangular entry boxes, small checkboxes and rows of character boxes. The opening screen also has **Try a sample form**.

Review every candidate. Detection is a conservative image-based heuristic, including on rendered scans; it can miss faint or broken lines and can mistake decorations or tables for fields. No accuracy percentage or equivalence to another product's detector is claimed. Each batch accepts up to 20 pages and adds at most 200 fields per page. Stop detection discards the unfinished batch. Existing fields and the source remain intact.

Use **Add field** for missed entries. Edit its name, accessible label, type, value, required/read-only status and position/size percentages. Text fields support multiple lines and maximum character counts; detected character rows can export as combed text fields. Dropdowns accept choices separated by `|`. Radio buttons use a shared group name and distinct option values. Checkboxes are independent: choosing one does not automatically clear another. Numeric controls provide a keyboard alternative to positioning with a pointer.

Close the dialog to fill directly on the page, using Tab between controls. **Save as → PDF** writes standard AcroForm fields. Names, values, choices and required flags survive reopening in PDF.js and PDFsplat. Undo restores form changes with page edits. Existing supported text, choice, checkbox and radio widgets are imported rather than silently flattened. Unsupported button/signature widgets are rejected before replacing the current document. Digital signing and signature validation are outside this editor. Exported field appearance uses the bundled PDF standard font; text outside its character coverage can require another PDF editor. Labels alone do not create a tagged, accessibility-certified PDF. Review field labels, reading order and the result in the readers your audience uses.

## Password-protected PDF

Choose **Save password-protected PDF** for a standard AES-256 PDF, distinct from the existing CipherSplat `.csplat` format. Enter and confirm a password of 8–127 UTF-8 bytes. The local Go/pdfcpu engine accepts PDFs up to 16 MiB and bounds output to 32 MiB, decoded streams, object counts, recursion and execution time. Original files stay unchanged. Passwords are cleared from fields and not written to storage or logs. Managed-memory cleanup is not a forensic-erasure guarantee.

Open a protected PDF with the normal Open command. Enter its password when prompted; a wrong password leaves the current document available and allows retry or cancellation. Decrypted bytes remain in memory for editing. Regular PDF export produces an unprotected copy; choose the protected export again when the result needs a password. Losing a password can make the protected result inaccessible.

The pinned engine runs in a dedicated, one-operation worker with stateless in-memory configuration. It does not contact a conversion server. Its worker and matching Go runtime are included in standalone and desktop packages; direct-file use also works without networking. A hosted session needs the engine asset delivered before its first password operation. It is not an installed PWA cache or a promise of a first-ever hosted visit offline.

## Reference comparison

The [OasisPDF fillable-form page](https://oasispdf.com/make-pdf-fillable/) informed the requested behavior; its implementation and sample forms were not copied.

| Linked-page capability | PDFsplat |
| --- | --- |
| Local form conversion, including scans | Added candidate detection with explicit review and limits |
| Underlines, boxes, character rows, checkboxes | Added standard text/comb/checkbox fields |
| Add, edit and fill fields; keyboard Tab | Added field editor and native HTML controls |
| Save editable standard fields for other readers | Added AcroForm round trips |
| Password-protected PDF | Added AES-256 PDF export and password import; CipherSplat retained |
| Sample form | Added an original synthetic form |
| Text, signatures, annotations, page organization and merging | Existing tools retained |
| Provider's measured detection accuracy and hosted infrastructure | Not adopted or claimed |

The same maintained modules ship in the browser edition and the Go/Wails desktop snapshot. Browser tests cover Chrome/Firefox and a direct-file offline round trip. Desktop release evidence identifies the actual packaged build separately.

The password engine embeds a compressed local WASM payload, keeping each hosted asset below 25 MiB. It requires the system WebView/browser Compression Streams API; an older runtime receives an update message. No network decompression service is used.
