# LayoutSplat development progress

## October 14, 2026 — v0.3 templates, typography, imports, and packages

305 templates (1,830 template/language models), 42 menu presets in 12 composition
families, six business-card compositions, replaceable official SplatWorks logo
examples, and 29 Avery sheet geometries / 127 product codes. Labels include two
name-badge stocks, physical geometry, printer offsets, and used-label skipping.
File has grouped Templates, alphabetical Import, page/print controls, and Export
with HTML. Context menus link selected boxes and unlink while retaining text.

Serif/sans selection, kerning, tracking, word spacing, horizontal scale, ligatures,
and local TTF/OTF/WOFF/WOFF2 font embedding are available. Publisher gains bitmap
fills, masks/crops, paragraph styles, gradient fallback, and source text scale.
Legacy Pages XML, PDF-compatible AI, all-page PDF artwork, and EPS/PS conversion run
locally. Native INDD/QXP and modern Pages IWA remain explicit unsupported paths.
The private Publisher benchmark retains one detected overflowing story; see the
[accuracy report](../../docs/layoutsplat-import-accuracy.md).

The website/Wiki/blog use SplatWorks ecosystem branding and the supplied glossy logo.
DrawSplat whiteboard/tools and technical database/service names remain unchanged.
The refreshed v3.1.35 packages add standalone LayoutSplat and include it in the full
SplatWorks suite; district-suite-v1.2.5 refreshes complete installation sources.
Verification: 35 LayoutSplat browser workflows passed across the full run and
focused reruns after menu/logo changes; synthetic Pages and Publisher regressions
cover editable text, picture bytes/crops, source scale, and paragraph metrics.
Model checks validate all 1,830 template/language combinations. The independent
Letter PDF check verified two exact pages, all eight paragraphs, selectable Arabic,
and embedded fonts. All 35 homepage/Wiki/navigation/school-setup checks passed.
The official-logo business card and distinct café/fine-dining layouts were visually
inspected. Production and package verification are recorded after publication.


## October 14, 2026 — v0.2 publishing release

Follow-up: File → Clear saved browser data removes the current workspace's draft
and recovery, resets memory/undo by reloading, and keeps a blank starting state.
Its cancel/confirm and reload behavior are checked independently. Other apps'
storage and downloaded project files are preserved. SplatWorks.org began serving
the shared SplatWorks homepage during this release's production verification.

The next substantial update adds 270 original templates (18 industries × 15 types),
six publication-language editions, rich editing and ordinary bold/italic/underline,
columns, drop caps, AutoFit, WordArt, tables, groups, alignment/distribution,
paths/shapes/borders, cropping, watermarks, format painter, masters and overrides,
facing-page preview, and expanded page setup. Right-click, Mac modifier-click,
and keyboard menus offer contextual text import and picture/video replacement.

Native Publisher `.pub` decoding now runs in a bundled browser WebAssembly worker.
No LibreOffice, desktop bridge, or conversion upload is required. Supported objects
are editable; original PUB bytes are preserved. Legacy encoding settings address
older text. This remains experimental interchange, with explicit conversion reports.
JSON/SVG/IDML/SLA/HTML and PDF picture imports, native SplatWorks content import/export,
TIFF/HEIC/Photoshop image decoding, local video conversion, and motion posters are added.

CSV/TSV/Excel merge includes mapping, filtering, previews, record checking,
personalization, and label sheets. Outputs add high-resolution PNG/JPEG/PDF,
HTML reading editions, sharing, Email preview, Pack and Go, bundled fonts,
bleed/crop/trim boxes, ICC output intents, and an optional Ghostscript PDF/X-3 helper
with independent structural checks. The downloadable PDF proof is flattened;
Print / Save as PDF retains selectable text and vectors. PDF/X is not exhaustively
certified by the browser or helper.

### Verification

Model checks validate all 1,620 template/language combinations and exercise merge
formatting ranges, multiline CSV, leading zeros, and labels spanning sheets.
Browser checks cover the original proof and new publishing tools, a real native PUB
opening with Cyrillic encoding and source retention, invalid PUB preservation,
gallery filters and Arabic content, contextual frame imports, supported media
fixtures, native JSON and layout-package round trips, and real WriteSplat reopening.
Publisher language-data rebuilding reproduces the shipped SHA-256 exactly.

The PDF/X-3 helper independently checked a Ghostscript-converted bleed proof with a
test CMYK profile: page geometry and boxes were preserved and structural checks
passed. A test profile does not replace a printer-supplied production profile.
All 26 LayoutSplat browser workflows passed locally after the File/Shapes/transparency changes. The independent two-page PDF check confirms all eight story paragraphs, selectable Arabic, exact Letter dimensions, and embedded font programs. The 35 existing homepage, wiki, navigation, and district setup checks passed (the suite guide count now includes LayoutSplat). Production verification is recorded after deployment.

### Remaining work

- External InDesign/Scribus and broader Publisher fidelity checks; additional proprietary layout formats.
- More precise typography/wrapping combinations, dynamic page numbers, and editable reading order controls.
- Native GridSplat/ListSplat sources directly in mail merge, richer suite media/content exchange.
- Larger-document optimization, advanced preflight/exhaustive PDF/X validation, and refreshed downloadable district release ZIPs.

The live application and source receive this feature update first. Previously
published package ZIPs keep their published contents. Current package-building code
includes LayoutSplat and its shared media converter for the suite.

[Feature guide](../../docs/layoutsplat.md) · [Third-party notices](THIRD_PARTY_NOTICES.md).

## October 13 2026 initial layout proof

Version 0.1.0 completes the first development milestone from the [approved plan](IMPLEMENTATION_PLAN.md). [SplatWorks future work](../ROADMAP.md) tracks the remaining publication features.

### Available

- SplatWorks purple/orange editor shell with the shared Apps launcher and original six-option language picker. Interface changes preserve publication content and physical layout; Arabic interface direction is separate from text direction.
- Two-page newsletter proof with an embedded local illustration, English and Arabic text, and a story flowing through three frames across pages. New blank publications and page add/duplicate/delete controls.
- Point-based geometry; inch/centimeter/pica/point/pixel rulers; margin/column/row/baseline and custom guides; snapping; numeric geometry; drag/resize/rotation; keyboard placement; locking and stacking.
- Plain-text story editing, font/size/color/spacing/alignment/direction, frame linking, next-page continuation, and visible overflow. Pictures, rectangles, ellipses, and lines.
- Undo/redo, local autosave and previous-draft recovery, validated portable `.layoutsplat` ZIP saves with embedded pictures, JSON interchange, and isolated cross-app file imports.
- A checker for overflow, page edges, margins, and effective picture resolution. Fixed-page HTML export, preview, and browser Print / Save as PDF.
- App registry, searchable feature reference, suite hub, district installer inventory, and future suite-bundle inclusion. Existing downloadable release ZIPs retain their published contents until a new package release.

### Verification

Four model tests, thirteen LayoutSplat browser workflows, and thirty-five existing suite/navigation/installer checks passed locally. The browser workflows cover text conservation during reflow, undo, all five units, six languages, drag/resize/guides, inert imported text, images, archives, invalid projects, local recovery, cross-app draft isolation, mobile layout, Apps discovery, and PDF generation.

The independently parsed PDF has exactly two 612 × 792 point Letter pages. All eight sample story paragraphs survive export; Arabic remains selectable; all used font subsets are embedded. Both rendered PDF pages and desktop/phone editor screenshots were visually inspected. `scripts/check-layoutsplat-pdf.py` repeats PDF checks in CI. The initial print exporter uses the same computed story fragments as the editor, preserving continuation text after print styles hide the editor.

GitHub Actions runs the LayoutSplat proof workflow. Production deployment and live verification are recorded below after publication.

### Remaining milestones recorded at v0.1

- Six publication-template categories, fuller editing tools, tables, alignment/distribution, grouped objects, image export, and broader recovery controls.
- Rich-text story editing, AutoFit choices, advanced wrapping, masters, facing pages, drop caps, WordArt, border art, format painter, folding, and expanded templates.
- Excel/CSV merge, labels/catalog generation, semantic HTML reading editions, sharing/Email preview, and complete Pack and Go.
- Printer profiles, bleed/crop marks, advanced preflight, independently validated PDF/X, commercial printer handoffs, and dedicated release packages.
- Fonts in editable projects currently use those available on the viewing computer; redistributable font packaging and deterministic cross-computer text metrics remain future work. Browser PDF output embeds the fonts actually used for the tested print proof.

Serve the repository over HTTP(S), including a loopback server for offline use. Direct `file://` opening does not support this module-based editor. Native Publisher `.pub` conversion is a separate feasibility milestone.


## Publication verification — October 14, 2026

LayoutSplat v0.3.0 is live at both SplatWorks.org and DrawSplat.org. The SplatWorks
Wiki header, official glossy logo, Avery/accuracy articles, and new download links
are verified live. Release v3.1.35 publishes 16 rebuilt app/collection ZIPs and
checksums; district-suite-v1.2.5 publishes the complete district ZIP and checksum.
The installer skill ZIPs were rebuilt from current repository instructions.

All 20 GitHub release assets matched local SHA-256 digests and byte sizes. Every
ZIP passed CRC checks. All 16 app packages started in Chromium and Firefox with
external requests blocked. The compact standalone LayoutSplat ZIP is 57.6 MB;
ten import/font/template/link/merge workflows passed against the extracted package
without internet. District archive structure, Quick Start, branding, version,
starter SQL, and four installation-plan checks passed. MariaDB/MySQL and extracted
installation CI passed. Production testing caught asynchronous template-selection
test races; the tests now await the dialog closing after the new document loads.

The roadmap remains open as described above; native proprietary formats and
advanced print/typography validation are not claimed complete.
