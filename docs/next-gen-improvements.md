# Next-gen improvements

**Status: proposals only.** These improvements require a separate implementation decision. Routine defect repairs and the separately requested GraphSplat Equation Studio are outside this proposal backlog.

## Recommended direction

Make SplatWorks easier to resume, exchange, and use accessibly across a complete classroom project. Prioritize dependable project files, clear conversion reports, and deliberate handoffs between existing apps. PDFSplat offers the strongest starting point: it already renders, annotates, scans, captures, recognizes printed text, and exports many formats, but exported PDFs flatten the editable objects and its JSON text export cannot restore an editing session.

Retain browser-based processing and optional connections. A new server, account system, paid API, or AI subscription is unnecessary for the first three delivery waves. Keep each application's established file markers, storage keys, and licenses.

## Existing capabilities and gaps

| Area | Existing foundation | Useful next step |
| --- | --- | --- |
| PDFSplat | PDF.js rendering; pdf-lib manipulation; separate annotation model; scan/capture; local English/Spanish OCR; EPUB, HTML, office and image exports | Editable project packages, document search, bounded processing, reviewable exports |
| WriteSplat and ShowSplat | Native project files; office exchange; browser drafts; cross-app file routing | Conversion reports and reliable classroom handoffs |
| GridSplat and GraphSplat | Formulas, charts, picture graphs, function plotting, structured import/export | Transfer selected data with labels, units, descriptions, and provenance |
| ListSplat and PlanSplat | Linked records, views, reports, task planning and native backups | Reusable classroom project bundles and portable progress summaries |
| Media tools | Recording, timelines, local captions, reusable media transfers | Shared asset manifests, clearer relinking, cancellable export jobs |
| Games and widgets | Separate games, vocabulary/passages, local progress, multilingual interfaces | Keyboard alternatives, reduced motion, teacher-selected settings bundles |
| Installation | Modular ZIPs, complete district suite, offline launchers, checksums | Package-specific verification manifests and an easier update check |

The baseline is the checked-in implementation, not a promise of identical capability across apps. For example, GridSplat's office interchange reads the first worksheet under documented size limits; PDFSplat preflight identifies concerns but cannot produce a fully repaired tagged PDF.

## PDFSplat priorities

### P1 Save an editable PDFSplat project

**Outcome:** A teacher can save a marked-up worksheet, close the browser, and continue moving text, OCR lines, images, and signatures later.

Create a versioned ZIP project containing a manifest, original source PDFs, inserted assets, page order/crop/rotation, annotations, title, language, and descriptions. Build on the current source map and page model. Keep the ordinary flattened PDF export as a separate finished output; the existing JSON text export remains a text interchange format.

Start with explicit Download project and Open project. Exclude passwords, OAuth tokens, and full undo history. Validate archive paths, entry counts, decoded sizes, source references, and manifest versions before replacing the open document. A project can contain original material hidden by visual covers, so explain that it is an editing source and is unsuitable as a redacted distribution copy.

**Acceptance:** Merge two PDFs, crop and reorder pages, add text, images and OCR, save/reopen in a fresh browser, and compare both visible output and editable object values. Malformed or oversized projects leave the current document intact. **Effort: large.**

### P2 Find text throughout the document

**Outcome:** Find a term, see page-numbered matches, and jump to its location without visiting every page.

Index PDF.js text runs plus applied OCR and added text. Use a small bounded cache, page-by-page progress, cancel, and invalidation after edits. Include case and whole-word choices. Respect crop and visual covers when deciding what is presented as visible text; never expose a covered original as though it were current content. Scans without recognized text should offer the existing OCR action.

**Acceptance:** Matches work across multiple runs, punctuation and Spanish accents, page rotation, cropped areas, added text, and undo. Cancelling or opening another document prevents stale highlights. **Effort: medium.**

### P3 Review reading order for HTML and EPUB

**Outcome:** Teachers can correct the reading sequence of a two-column handout before creating an alternative format.

Extend existing text/image collection with an ordered block list: paragraph, heading, list, image, caption. Provide keyboard Move up/down and a plain reading preview. Preserve supplied descriptions and flag uncertain order. Keep this structured review separate from the PDF's physical layout and include it in the proposed project package.

**Acceptance:** A two-column fixture exports in the reviewed order, headings appear in navigation, images retain descriptions, and repeated exports are consistent. Do not label the result PDF accessibility repair or certification. **Effort: large; depends on P1 for reusable review work.**

### P4 Bounded background work and export preview

**Outcome:** Large documents stay responsive, and the user knows what an export will include.

Retain the current IntersectionObserver-based thumbnail loading. Add a small concurrency queue for expensive edited thumbnails and export renders, reuse work within a document generation, and budget undo snapshots by estimated bytes as well as count. Start with visible progress and cancellation at page boundaries; moving suitable work to workers can follow profiling.

Before conversion, summarize pages, output type, approximations, omitted features, and expected searchable versus image-only content. Offer a representative-page preview for rasterized output.

**Acceptance:** A defined large fixture remains navigable, cancellation releases canvases and temporary PDF documents, and replacing the open file cannot publish an old export. Compare peak memory and elapsed time with the same fixture and hardware before setting budgets. **Effort: medium to large.**

### P5 Fill common PDF forms

**Outcome:** Fill a simple school form locally and download a completed copy.

Prototype existing AcroForm text fields, checkboxes, radio groups and dropdowns using PDF.js annotations and pdf-lib's form APIs. Begin with one well-defined supported subset. Offer preservation of editable fields or explicit flattening, with an independent viewer check. Detect and decline XFA-only, scripted, signed, or unsupported form workflows rather than silently losing their behavior.

**Acceptance:** Values reopen in an independent viewer, keyboard labels and tab order are usable, unsupported files receive a clear explanation, and the source remains unchanged. **Effort: large; prototype before committing to a release.** [pdf-lib form API](https://pdf-lib.js.org/docs/api/classes/pdfform).

### P6 Optional recovery for an interrupted session

**Outcome:** A browser crash need not erase an entire editing session.

After P1, offer an explicit device-recovery opt-in using IndexedDB, a retention choice, storage usage, and a clear erase action. Keep PDFSplat's current memory-only default until this privacy change has been deliberately approved. Store no passwords. Describe the shared-device implications before enabling recovery.

**Acceptance:** Recovery restores the latest committed checkpoint, a quota failure preserves the live session, and erase removes sources and assets as well as the manifest. **Effort: medium; depends on P1 and updated privacy disclosures.**

## SplatWorks suite priorities

### S1 A consistent save and recovery contract

Define common meanings for Unsaved, Saving, Saved on this device, File downloaded, and Connection failed. Retain each app's native file format. Add a small shared interface for reporting persistence outcomes and offering the existing file-download route. Treat blocked storage, quota exhaustion, and cancelled downloads as separate states.

Build on current storage-error repairs rather than replacing proven persistence implementations all at once. A staged migration of two apps is safer and easier to assess than a suite rewrite.

**Acceptance:** Fault-injection tests prove that failed saves never display Saved and that the latest content can still be exported. **Effort: medium per initial pair.**

### S2 Transfer selected content between apps

Extend the existing file bridge with explicit transfer types: a GridSplat range to GraphSplat; a rendered graph with data and description to WriteSplat or ShowSplat; selected PDF text to WriteSplat. Show what will transfer and keep the source project untouched. Expire temporary handoffs and support deployments where the destination app is absent.

Start with GridSplat → GraphSplat and GraphSplat → ShowSplat. Preserve headers, units, category labels and source attribution. Do not reinterpret a chart image as editable chart data unless that data is included.

**Acceptance:** A transfer round trip preserves the selected values and labels; failed, blocked, expired and duplicate transfers have recoverable outcomes. **Effort: medium per pair.**

### S3 Conversion reports and a shared fixture corpus

Show imported, simplified, unsupported and omitted features immediately after an office-format import. Use the existing Word, spreadsheet, layout, presentation, and PDF fixtures as the starting corpus. Reports should reflect the actual parser's decisions, with links to format-specific guidance.

Begin with WriteSplat DOCX/ODT and GridSplat XLSX/ODS. Include the existing first-worksheet and size limitations where relevant. Keep originals available and avoid fidelity percentages without a defined measurement.

**Acceptance:** Fixtures with tables, merges, fonts, images and unsupported features produce accurate reports; a failed import preserves the working project. **Effort: medium.**

### S4 Classroom project bundles

Package teacher instructions, editable starters, references, a rubric, and a suggested PlanSplat checklist in one versioned ZIP. Each item identifies its destination app and format. Start with export/import of a local bundle; district assignments can later point to the same manifest.

Use ListSplat records and existing quiz/rubric formats where they already fit. Exclude student rosters, credentials, and submissions from a starter bundle. Make linked media size and licensing visible before distribution.

**Acceptance:** A science investigation opens the right starter in each app on an offline installation and does not require a new account. **Effort: large; depends on S2's transfer contracts.**

### S5 Shared media relinking and export jobs

Unify the language used for missing files, embedded versus referenced assets, export progress, cancellation and retry across AudioSplat, VideoSplat, MediaSplat and ClipSplat. Introduce an asset manifest adapter around existing native projects rather than changing every project schema immediately.

**Acceptance:** Move a project to a fresh browser, relink media, cancel an export, retry, and inspect actual audio/video output for duration, captions and completeness. **Effort: medium to large.**

## Tools and games priorities

### T1 Complete keyboard and reduced-motion paths

Address the existing tracked gaps in Untangle, Flow Free and Tangram with selectable items, arrow-key movement, clear focus, and announced placement results. For spinner/confetti effects, supply a static result path and respond when the preference changes while the app is open. Keep scoring and outcomes identical across interaction modes.

**Acceptance:** Complete a defined game/activity using keyboard only and both motion preferences; then perform touch-emulation and physical-device checks separately. **Effort: medium per game; see issues [65](https://github.com/mguhlin/drawsplat/issues/65) and [63](https://github.com/mguhlin/drawsplat/issues/63).**

### T2 Finish localization at the workflow level

Inventory untranslated menus, status messages, accessible names, examples, and exports. FontSplat and MemeSplat currently lack the language-switcher integration expected by the suite's static consistency check. ClipSplat already has a native JavaScript language module; its static detection was corrected during the audit. Implement an actual translation surface with reviewed strings, not an empty language control added to satisfy the test.

Start with opening, editing, saving and failure recovery in English/Spanish; then complete the existing language set with native review. Preserve authored document text, equations and numbers during interface-language changes.

**Acceptance:** A complete creation/export workflow changes language, screen-reader labels follow the choice, Arabic layout remains usable, and exported user content stays unchanged. **Effort: medium per app plus language review.**

### T3 Portable teacher settings and practice summaries

Offer a local settings file for vocabulary, typing passages, accessibility choices and teacher-selected game options. Start with the typing collection, which already supports imported passages and subject vocabulary. Export optional local practice summaries that explain speed, accuracy and completion without presenting game scores as grades.

**Acceptance:** Load a settings file in a fresh browser, run the same activity, export a summary, and clear it. No automatic student identity collection or network reporting. **Effort: medium.**

### T4 Verified modular updates

Add a machine-readable manifest to each ZIP listing its entry point, source commit, dependency assets, native format versions and file hashes. Provide a local check that compares installed files with that manifest and directs administrators to the correct module package. Check only program files, never learner work.

Keep releases immutable after verification; publish a new revision when package contents change. No unattended overwrite of a district installation or database migration.

**Acceptance:** A missing worker, altered asset and mismatched entry point are identified; user projects are untouched; every listed download and checksum resolves. **Effort: medium.**

## Delivery sequence and effort

Effort is an initial engineering estimate for one experienced maintainer: small is roughly 1–3 focused days, medium 4–8, and large 9–15 or more. Estimates include focused tests and documentation; device access, language review and unfamiliar formats can extend them. This is a backlog, not a commitment to deliver all items within one release.

| Wave | Proposed scope | Decision at the end |
| --- | --- | --- |
| 1 | P1 editable PDF projects; S1 save contract in two apps; P2 text search | Can a teacher safely resume and find work in a fresh browser? |
| 2 | P4 bounded processing and previews; S2 first transfer pair; S3 first conversion reports | Do larger and exchanged projects remain understandable and recoverable? |
| 3 | T1 one keyboard game plus spinner motion; T2 first complete app localization; T4 package manifests | Can the same workflow be used and installed reliably across environments? |
| 4 | P3 reading-order review; P5 form prototype; S4 starter bundles; S5 media adapters | Which prototypes justify a supported feature release? |
| Optional later | P6 opt-in recovery and T3 practice summaries | Are retention, shared-device behavior and user controls acceptable? |

Ship independent increments. Do not hold a reliable project-file improvement until every cross-app feature is finished.

## Validation and release criteria

- Exercise first use, import, edit, undo, export, fresh-browser reopen, cancel and retry. Inspect file contents and representative rendered pages or media, not only download events.
- Inject blocked storage, quota errors, worker failures and late asynchronous results. Every failed operation must preserve the current work or provide an explicit recovery route.
- Cover actual desktop Chrome and Firefox, available WebKit, and phone/tablet emulation. Keep physical camera, microphone, Chromebook, touch and assistive-technology results separate.
- Record measurable fixtures and budgets before promising performance improvements. Include a large scanned PDF, multi-column PDF, mixed-source project, and scripts/links designed to test safe parsing.
- Verify existing native files and links still work. Build static assets, test extracted packages offline, regenerate checksums, and verify production assets from the released commit.
- Update the wiki, examples, release notes, privacy inventory and package descriptions only for shipped behavior. Keep proposals distinct from supported features.

## Deferred proposals

**Secure semantic redaction:** The current visual covers and rasterized sanitizer do not establish secure content removal. A supported redaction engine, licensing review, adversarial fixture corpus and independent verification are prerequisites. Keep this out of the initial roadmap.

**Universal tagged-PDF repair and exact Office round trips:** These require substantially different document engines and validation. Continue improving HTML/EPUB alternatives and honest conversion reports first.

**StyleLaTeX-style recognition and document exchange:** Consider an explicitly enabled recognition provider for photos, handwriting and selected PDF pages, with side-by-side original/source review, uncertainty markers, correction history, cancellation, clear data-transfer consent and verified exports. Whole-document Word/LaTeX conversion and actual TeX compilation need separate engines and compatibility tests. The separately requested local table converter, .tex equation import and format-sharing exports are implemented outside this proposal backlog.

**Automatic handwriting, speech-to-math and computer algebra solving:** Separate recognition/solver engines, accuracy evaluation, licensing, device support and accessibility work are needed. The separately requested GraphSplat Equation Studio addresses typed equation authoring and reusable outputs first.

**Real-time collaboration across all apps:** Requires shared editing models, conflict resolution, identity and service operations. Existing district features and deliberate file handoffs provide a smaller first step.

**A compulsory suite-wide AI service:** Introduces provider, privacy and operating dependencies without being necessary for the priorities above.

## Implementation references

- [PDFSplat capabilities and limits](../solutions/pdfsplat/README.md); [page, annotation and history implementation](../solutions/pdfsplat/src/app.js); [text/document export](../solutions/pdfsplat/src/document-export.js); [OCR workflow](pdfsplat-ocr.md).
- [PDF.js page APIs](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html) expose text, annotations and structure information; they do not guarantee correct semantic reading order. Confirm compatibility with the bundled PDF.js version before implementation.
- [Shared file bridge](../splatworks/shared/file-bridge.js); [Google Drive integration](../splatworks/shared/google-drive.js); [media handoff](../solutions/shared/video-handoff/index.js).
- [GridSplat interchange limits](../splatworks/gridsplat/README.md); [WriteSplat](../splatworks/writesplat/README.md); [ListSplat](../splatworks/listsplat/README.md); [PlanSplat model](../splatworks/plansplat/model.mjs).
- [GraphSplat](../solutions/graphsplat/README.md); [registered tools](../data/drawsplat-tools.json); [privacy inventory](../data/privacy-inventory.json); [package builder](../scripts/make-selfhost-bundle.sh).
