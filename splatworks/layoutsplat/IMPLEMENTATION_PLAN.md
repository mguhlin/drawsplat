# LayoutSplat development plan

Approved October 13, 2026. LayoutSplat is SplatWorks' browser publication-design application: precise pages, editable templates, reusable branding, personalized publications, and dependable export. It uses `/splatworks/layoutsplat/` alongside WriteSplat, ShowSplat, GridSplat, and ListSplat.

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

Basic editing, ordinary exports, and merge work run locally. Bundle runtime assets for district use. Integrate the Apps launcher, component registry, file handoff, documentation, and installer inventory. Publisher `.pub` import has a separate feasibility/fidelity milestone. Initially support rebuilding publications and, later, imported PDF backgrounds; do not promise editable `.pub` conversion.

## Milestones and acceptance

1. **Prove layout fidelity.** Two pages with linked text, images, guides, English and Arabic samples. Editing/resizing reflows stories without losing words. Print-to-PDF preserves measured geometry, selectable text, and script appearance. Save/reopen, undo/redo, language changes, and keyboard movement work.
2. **First usable release.** Six template categories, page management, five ruler units, guides, core text/images/shapes/tables, grouping, recovery, checking, PDF and image export. A user creates, saves, reopens, and prints a publication.
3. **Publishing tools.** Masters, facing pages, drop caps, baseline alignment, advanced wrapping, WordArt, borders, format painter, folding, expanded templates. A branded newsletter flows stories across pages.
4. **Personalization and sharing.** Excel/CSV, labels, record previews, catalogs, HTML, Email preview, share, Pack and Go. Check every generated record for overflow and unresolved fields.
5. **Commercial print preparation.** Printer profiles, advanced preflight, validated PDF/X, printer handoffs, larger-document performance, and district release packaging.

Verification covers unit conversion, snapping, linked-story changes, font shaping, master overrides, archive validation, save/reopen fidelity, merge accuracy, keyboard/touch operation, language changes, offline resource loading, and exported geometry. Test meaningful user workflows and independent PDF measurements. Record deployment evidence and remaining milestones in PROGRESS.md.
