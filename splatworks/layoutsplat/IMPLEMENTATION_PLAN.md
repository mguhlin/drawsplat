# LayoutSplat development plan

Approved October 13, 2026. LayoutSplat is SplatWorks' browser publication-design application: precise pages, editable templates, reusable branding, personalized publications, and dependable export. It uses `/splatworks/layoutsplat/` alongside WriteSplat, ShowSplat, GridSplat, and ListSplat.

The user subsequently authorized continuing through all milestones and requested maximum compatibility with other layout applications. JSON save/open must be explicit. Add editable SVG, InDesign IDML, Scribus SLA packages, HTML/PDF exchange, and documented conversion paths for proprietary formats. Preserve a lossless native payload in supported exchange files where possible, and report converted or unsupported features. Bold, italic, and underline belong in both the rich-text editor and ordinary formatting controls.

Additional approved scope: broad local image/video decoding and conversion, printable video posters, object-specific context menus (right-click, Mac Control/Command-click, keyboard), text import into an existing frame, media replacement without changing frame geometry, and a large original template library inspired by the publication types/industry breadth of StockLayouts. The user explicitly requested native `.pub` import and subsequently required browser-contained decoding without LibreOffice. This supersedes the earlier desktop-bridge proposal. v0.2 bundles libmspub as WebAssembly with experimental editable conversion and source retention. Import/export native content from WriteSplat, ShowSplat, GridSplat, and ListSplat as well as routing files to their original applications. Clearly distinguish editable native imports from PDF backgrounds and preserve/report conversion limitations. Update README/wiki/release documentation, commit, push, deploy the next substantial update, and verify production.

## Remaining work

Current checkpoint: **v0.5.0, October 16, 2026**. Work proceeds in the priority
order below, starting with Publisher typography and text flow. These items remain
open; the original milestone descriptions later in this plan describe the full
approved scope rather than a list of unfinished features.

- [ ] **Publisher typography and text flow.** Improve paragraph composition,
  hyphenation, contour wrapping and imported linked-story flow. Compare editable
  imports and printed output with reference publications/PDFs using matching fonts;
  record remaining line-break, overflow and positioning differences. Reusable source
  masters and shared-source text-ID linking now ship; source ordering and full
  composition parity still need reference comparisons.
- [ ] **Native imports and external application checks.** Expand Publisher fixtures
  and independently open/round-trip supported IDML and Scribus SLA exports in their
  target applications. Research modern Pages IWA, QuarkXPress 5+ and native INDD
  decoding; these formats are not currently implemented. Record supported versions,
  editable features and conversion losses before claiming compatibility.
- [ ] **Richer SplatWorks exchange.** Preserve more complex content, embedded font
  files, custom tab positions and semantic list numbering between applications.
  Verify formatting and content after a round trip, and report unsupported features.
  Native GridSplat/ListSplat mail-merge sources are already implemented.
- [x] **Dynamic fields on master pages.** Page/total values resolve separately
  on every assigned page, including insertion, duplication, deletion, undo and native
  reopening. Master overrides and visual/editable exports retain the resolved values.
- [ ] **Broader large-document performance.** Exercise image-heavy publications,
  complex masters and multiple linked stories on modest devices. Measure memory,
  editing/reflow, preview and print behavior beyond the existing controlled 500-page
  cache regression and 100-page linked-story PDF proof; fix demonstrated bottlenecks.
- [ ] **Independent commercial-print validation.** Validate PDF/X output, printer
  profile handling, fonts, transparency, color and page boxes with independent tools
  and actual commercial-printer proofs. Existing structural preflight and Pack and
  Go are preparation tools; they do not establish printer acceptance or certification.

The core editor, distinct templates, shared whiteboard backgrounds, browser-native
PUB/legacy DOC/legacy Quark imports, formatted DOCX/ODT insertion, ordinary folios,
HTML reading order and current download/district packages have shipped. Rebuilding
the v0.4.6 packages is **complete**, not an outstanding roadmap item.

v0.5.0 adds in-app experimental Publisher 2000 `.pub` export: native editable
Unicode text/basic shapes, bitmap fallback objects and a fingerprinted native
LayoutSplat copy. Native decoding and LibreOffice opening are verified; opening in
Microsoft Publisher and broader file interoperability remain external acceptance
checks. A real user-run Google Drive upload/download/reopen passed October 16; the
downloaded one-page project passed archive and native-model validation. This is a
specific observed workflow, not a guarantee for all school account policies.

Record acceptance evidence and deployed improvements in [PROGRESS.md](PROGRESS.md)
as each checkbox is completed. No completion date or fidelity guarantee is assigned
to proprietary-format research before feasibility is established.

## Interface and language

Reuse SplatWorks purple (`#7c3aed`), orange (`#ff9f2f`), white panels, dark text (`#1f2937`), pale purple surfaces (`#f7f4ff`), and subtle borders (`#d8d2ff`). Follow the existing system-font stack and line-icon vocabulary. Publication pages remain white against a quiet workspace. Left-align controls; reserve strong color for selection and primary actions.

The header contains the application identity, publication title, save/undo/redo, Apps launcher, and language picker. Menus provide File, Home, Insert, Page layout, Arrange, Mail merge, View, and Help as those capabilities ship. A contextual toolbar changes with selection. Page thumbnails, masters, templates, and assets occupy the left panel; rulers and a central page occupy the workspace; properties, layers, and design checking occupy the right panel. The status bar shows page number, saving status, units, guides, zoom, and preview.

The File workspace offers New, Open, Save, Save as template, Print, Share, Export, and Pack and Go. Place Share below Print. Smaller displays use collapsible panels and touch controls without changing page geometry.

Reuse `assets/js/widget-i18n.js` and the `drawsplat.language` preference. Match the original six choices: English, Español, Tiếng Việt, العربية, 中文, and हिन्दी / اردو (`uh`, the suite's current combined option). Translate menus, dialogs, tooltips, errors, accessibility labels, and design-check findings. Arabic mirrors the interface. Publication language/direction is separate from interface language; switching the interface never rewrites document content or moves objects. Provide script-appropriate fonts and deliberate translated template editions.

## Publication features

| Area | Target behavior |
| --- | --- |
| Templates | Flyers, brochures, newsletters, business cards, catalogs, and greeting cards; editable school/community/business examples; filter by type, language, size, and orientation. |
| Page setup | Letter, Legal, A4, A5, custom sizes, orientation, facing pages, margins, bleed, safe areas, and fold/panel guidance. |
| Rulers | Independent horizontal/vertical rulers; inches, centimeters, picas, points, pixels; adaptive ticks; configurable origin. |
| Guides | Margins, columns, rows, baselines, and draggable custom guides; lock/hide/copy; snap edges and centers. |
| Placement | Numeric X/Y, width/height, rotation, anchor; align/distribute to page, guides, and other objects. |
| Text | Rich text, paragraph/character styles, font/spacing/tracking, columns, bullets, tables, drop caps, format painter. |
| Stories | Continuous text through linked frames across pages; visible overflow and connections; shrink with a minimum size, grow frame, or continue into another frame. |
| Graphics | Paths, arrows, built-in/custom shapes, image fitting/cropping, transparency, watermarks, border art, and WordArt-style effects. |
| Objects | Layers, nested grouping, locks, duplication, stacking, alignment, reusable styles. |
| Masters | Reusable backgrounds/logos/headers/footers/page numbers/guides; selected-page application; explicit overrides; facing-page variants. |
| Mail merge | Local Excel/CSV input, worksheet selection, field mapping, filters, record previews, personalized publications, labels/cards/catalogs. |
| Design checker | Overflow, fonts/assets, effective image resolution, safe-area/bleed issues, unresolved fields, broken links; select the affected object and explain a fix. |

## Saving and outputs

The final native `.layoutsplat` format is a versioned ZIP containing the publication, assets, styles, masters, previews, and redistributable font assets. Early development may use an embedded-asset `.layoutsplat.json` interchange format; support migrations explicitly. Provide local autosave, recovery snapshots, undo/redo, and downloadable project saves.

PDF export preserves dimensions, text, font appearance, vector objects, page ranges, and optional bleed/crop marks. The first proof uses browser print-to-PDF from the same rendered pages; label it honestly and test the resulting PDF. Dedicated downloadable PDF output follows only when text shaping and font embedding are verified.

Photo exports offer PNG/JPEG with explicit pixel dimensions and 150/300/600 ppi choices. HTML offers a fixed-layout edition first, then an accessible reading edition with an explicit reading order. Pack and Go gathers the project, assets, permitted fonts, PDF proof, color information, instructions, and design-check report into a ZIP.

Share offers the current page, PDF, project, and HTML package. Detect device share support and fall back to download. Email preview shows content/attachments. Email delivery, if added later, is explicit and separate from preparing a document. Imported merge data stays on the device.

Commercial print preparation includes printer profiles, page boxes, bleed, font embedding, and preflight. Claim PDF/X compliance only after independent validation against printer requirements. PDF/X-4 requires an embedded output-intent profile: [PDF Association requirements](https://pdfa.org/technical-side-and-requirements-of-pdfx/). Browser sharing requires feature detection and generally HTTPS: [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API).

## Technical foundation

Store all geometry in points. Ruler units, screen pixels, and zoom are conversions; they never mutate the publication geometry. Use a versioned model for pages, objects, continuous text stories, styles, masters, assets, and merge fields. Keep layout computation separate from controls. Editing and export consume the same computed layout.

Reuse suitable ProseMirror components from WriteSplat for rich editing; custom frame flow/pagination remains LayoutSplat's responsibility. [ProseMirror's structured document/transaction model](https://prosemirror.net/docs/guide/) does not itself provide a desktop publication engine. The first proof can use plain-text story editing and browser-shaped lines, preserving a migration path to rich stories. Evaluate font metrics, multilingual shaping, line breaking, and print consistency before advanced typography.

Basic editing, ordinary exports, and merge work run locally. Bundle runtime assets for district use. Integrate the Apps launcher, component registry, file handoff, documentation, and installer inventory. Publisher `.pub` import is experimental browser interchange: supported objects become editable, while advanced fidelity requires comparison with the source. Retain original bytes and include source/build/license notices for the bundled decoder.

## Milestones and acceptance

1. **Prove layout fidelity.** Two pages with linked text, images, guides, English and Arabic samples. Editing/resizing reflows stories without losing words. Print-to-PDF preserves measured geometry, selectable text, and script appearance. Save/reopen, undo/redo, language changes, and keyboard movement work.
2. **First usable release.** Six template categories, page management, five ruler units, guides, core text/images/shapes/tables, grouping, recovery, checking, PDF and image export. A user creates, saves, reopens, and prints a publication.
3. **Publishing tools.** Masters, facing pages, drop caps, baseline alignment, advanced wrapping, WordArt, borders, format painter, folding, expanded templates. A branded newsletter flows stories across pages.
4. **Personalization and sharing.** Excel/CSV, labels, record previews, catalogs, HTML, Email preview, share, Pack and Go. Check every generated record for overflow and unresolved fields.
5. **Commercial print preparation.** Printer profiles, advanced preflight, validated PDF/X, printer handoffs, larger-document performance, and district release packaging.

Verification covers unit conversion, snapping, linked-story changes, font shaping, master overrides, archive validation, save/reopen fidelity, merge accuracy, keyboard/touch operation, language changes, offline resource loading, and exported geometry. Test meaningful user workflows and independent PDF measurements. Record deployment evidence and remaining milestones in PROGRESS.md.
