# LayoutSplat development progress

## Current roadmap status — October 14, 2026

Milestones 1–2 are implemented. The core publishing and personalization tools in
3–4 are implemented; advanced composition and richer conversion remain. Milestone 5
has print preparation and independent structural checks, but is not certified complete.

Remaining priorities (acceptance criteria are in the [current roadmap checklist](IMPLEMENTATION_PLAN.md#remaining-work)):

- Closer Publisher paragraph composition, hyphenation, contour wrapping and imported linked-story fidelity.
- More varied Publisher fixtures and source/round-trip checks in external InDesign/Scribus applications; modern Pages IWA, QuarkXPress 5+ and native INDD remain unavailable.
- Richer suite exchange for complex content, font files, custom tabs and semantic list numbering. Native GridSplat/ListSplat mail-merge sources are already implemented.
- Dynamic page-number fields in master artwork. Ordinary-page page/total folios already update.
- Broader large-document workloads beyond the controlled 500-page cache regression and 100-page print proof.
- Exhaustive independent PDF/X validation, printer-supplied profile workflows and real commercial-printer acceptance.

Historical “remaining” lists below describe their dated versions; later entries
record work completed since then. The current template library, Word/DOCX/ODT
insertion, browser legacy Quark import, whiteboard collections and reading-order
controls are shipped capabilities, not future milestones.

## v0.4.6 package and publication verification

Release v3.1.37 refreshes all 16 application/collection ZIPs; district-suite-v1.2.7
refreshes the complete district installation. Built from committed e2eb037.
All 17 ZIPs passed archive, checksum, path/private-file and runtime inventory checks.
The 16 app packages passed 32 offline Chromium/Firefox checks; WriteSplat editing
was rechecked after its audit wait was changed to await the debounced word count.
Twelve standalone LayoutSplat import/font/template/link workflows passed. Four
district Quick Start workflows passed against the packaged start-here.html entry.

The SplatWorks blog article is published with 14 actual screenshots. The personal
MGuhlin.org edition is scheduled for October 15, 2026 at 5:00 AM Central. Both sites
host their own matching image assets. A future-date preview shows all 14; the
current personal-blog build and live feeds hide its future post. Its one-minute
Cloudflare publication timer is enabled. The Desktop package retains Markdown,
offline HTML, the exact scheduled Astro source, captions, sources and verification.

## October 14, 2026 — illustrated documentation

Added a 20-section feature inventory with 14 actual v0.4.6 production screenshots,
covering all 18 publication types and explicit editability, native-format, media,
text-flow and print limits. The README and technical guide link to it; wiki navigation
and full-text search include it. A separate Desktop blog package contains editable
Markdown, offline HTML, an Astro draft, captions, provenance and primary retirement
references. It has not been posted automatically to the personal blog.

Five focused v0.4.6 workflows passed on production for paragraph/list exchange,
folios, reading order, Publisher properties and binary Word formatting.

## October 14, 2026 — v0.4.6 paragraph-aware WriteSplat exchange

Native WriteSplat input now retains supported paragraph leading, spacing, indents,
alignment, blank paragraphs and list starts/overrides as visible labels. Available
imported font families/variants are matched. HTML input uses the shared formatted
story converter. LayoutSplat output generates the actual WriteSplat paragraph
attributes and inline marks, retaining blank paragraphs and tab atoms. Original
font family names replace internal LayoutSplat font IDs; unavailable embedded font
files and unsupported advanced spacing receive explicit conversion reports.

Validation: all 52 LayoutSplat workflows, ten model checks and both independent
PDF text/font/geometry checks passed locally.
The browser workflow reopens exported JSON in real WriteSplat and checks physical
indent/leading measurements plus styled text. Native list semantics, custom tab
positions and page composition remain limited; labels and text are preserved.

## October 14, 2026 — v0.4.5 folios, reading edition and richer document proofs

Page/total folios update as pages change. Reinsert updates formats without
creating duplicates and covers new blank pages. Story editing/import/linking
converts a folio to ordinary text. Master copies are static; dynamic master
fields remain limited. Reading order has per-item earlier/later and omission
controls, independent of print geometry/stacking. Native saves retain the choices;
reading HTML now keeps supported inline/paragraph formatting and links.

The 100-page PDF proof now conserves 100 linked fragments plus 800 body
paragraphs, rather than only a marker per page. The 500-page cached-layout
benchmark uses newsletter-length copy. Validation: all 51 LayoutSplat workflows and ten model checks passed, followed
by the two field/reading checks after improving pale-ink contrast. Both
independent PDF checks passed. Native legacy QuarkXPress v0.4.4 deployed
and passed its real import/save/reopen test on SplatWorks.org; all CI checks passed.

## October 14, 2026 — v0.4.4 legacy QuarkXPress browser import

A bounded WebAssembly worker with libqxp 0.0.3 reads supported QuarkXPress 3.1–4.1
text, frame geometry and vectors. Matching local fonts and the common drawing
conversion retain supported editing. Native saves keep the original source bytes.
Source archives, licenses, adapter, build script and hashes accompany the runtime.
Two pinned-toolchain builds produced identical WASM/JavaScript hashes.

Real 3.3/4.x upstream text samples open offline, preserve their exact source bytes,
and survive native save/reopen. A 5.x detection fixture and the supplied private
QXP file are rejected without replacing the publication. Newer QXP, linked-story
metadata, text paths, external pictures, hyphenation and complex effects remain
limited; this is not complete modern QuarkXPress support.
All 49 LayoutSplat browser workflows, nine model checks and both independent
PDF geometry/font/text checks passed after this update.

Production follow-up for v0.4.3: all application CI checks passed. The Git-linked
Cloudflare Pages build uploaded its assets but stalled before activation. A clean
archive of committed `0fe6895` was redeployed directly to the same Pages project
(deployment `413df828`), preserving domain bindings and application data. The
WriteSplat ruler fix passed on DrawSplat.org; Publisher/Office font matching passed on both public domains, and the 100-page
linked-story print workflow passed on SplatWorks.org.

## October 14, 2026 — v0.4.3 original fonts and independent print checks

Publisher imports retain previously loaded font files and choose matching family
and weight/italic variants. Office text-box imports use the same matching logic.
Reports name remaining font substitutions. Supported fonts stay embedded in native
projects and exports. This improves text metrics without claiming source layout
parity for unsupported source effects or linked-story metadata.

The optional PDF/X-3 helper now inspects embedded font programs, Type3 glyphs and
Unicode mappings, nested forms/resources, RGB vector/text/image colors,
transparency, active content, encryption and page boxes. Reports include file and
ICC hashes and tool versions. Ten deliberate faulty/clean PDF checks and a real
Ghostscript-converted proof validate it. Characterized RGB remains allowed for
PDF/X-3. This is structural preflight, not external ISO/commercial certification.

A real 100-page linked-story browser export is independently checked for all
100 distinct fragments, exact page counts/Letter dimensions and embedded fonts.
The original two-page selectable Arabic proof remains in regression coverage.
All 48 LayoutSplat browser workflows and nine model checks passed locally.
WriteSplat's live tests found and fixed ruler focus loss during consecutive arrow
adjustments. Canvas/ruler checks passed on SplatWorks.org; the fix is verified
locally and will be checked again on both production domains.

## October 14, 2026 — WriteSplat canvas and suite text follow-up

WriteSplat v0.2.0 removes the bundled body heading from new documents, adds Letter
page guides, units, draggable/keyboard indents and paragraph left tabs, plus Fit
width zoom. Native JSON and DOCX preserve supported indents/tab stops; LayoutSplat
suite import preserves WriteSplat's new tab atoms. ODT export no longer injects a
metadata title into document content. Old starter-heading cleanup applies narrowly
to exact bundled local drafts and does not remove imported headings.

Validation: 49 unit checks, all 40 existing editor workflows across the full run
and focused fixes, two physical-ruler/mobile/DOCX-round-trip browser checks and
22 Wiki checks passed. The guides are a continuous canvas aid, not exact Word
pagination; advanced tab alignment and ODT custom stops remain limited.

## October 14, 2026 — v0.4.2 binary Word compatibility

Native binary DOC text now decodes locally in a bounded WebAssembly worker in
LayoutSplat and WriteSplat. Original fonts, font sizes, palette colors, combined
B/I/U, native list counters, paragraph spacing/indents and alignment survive the
supported conversion. A CFB normalizer enables small-stream documents that the
upstream decoder rejects. Original source files are not modified. File → Import
adds alphabetically grouped Microsoft Word and LibreOffice Writer text-box choices.

GPL/Apache/MIT notices, matching source archives, the formatting patch, rebuild
script and runtime hashes accompany the worker. A pinned-toolchain rebuild matched
both runtime hashes before the font-table enhancement. The original source corpus,
a synthetic short styled document and a private Word-derived sample were checked.
The private sample keeps all six numbered questions and its 10/11-point Arial runs.
Native source line leading, fields/hyperlink targets and complex page features are
still limited. No desktop office app is required at runtime.

Office v0.4.1 deployed successfully on both origins; two live import workflows and
both new Wiki pages were verified. A transient unrelated GridSplat divider-drag CI
failure passed when the failed job was rerun; all milestone CI checks are green.
Validation: all 46 LayoutSplat browser workflows, 45 WriteSplat unit tests, nine model tests, and the independent two-page Letter PDF/font/text check passed. Browser-only tests cover both small-stream combined formatting and the upstream legacy DOC corpus, with invalid input preserving the publication.

Next priorities remain WriteSplat page outlines/ruler and starter cleanup, printer
preflight and larger print proofs, further native layout import compatibility,
and the next complete download refresh.

## October 14, 2026 — v0.4.1 formatted Office insertion

Shared browser DOCX/ODT conversion resolves defaults, named/inherited styles,
OpenDocument automatic styles, supported font/character properties, Word list
starts/overrides, paragraph spacing/indents and relative/fixed leading. Selected
text-box import/append keeps frame geometry and existing paragraphs, validates
before replacing a story, and preserves native saves. Imported local font families
are matched before built-in fallbacks; reports identify actual unsupported styling.

WriteSplat uses the same parser and saves paragraph attributes. The private Word
sample retains list numbers 1–6, 10-point question text and 1.15 leading. Floating
block handles were removed from flow; all six list text starts now align exactly.
DOCX/ODT page layout, floating pictures and advanced features are not fully decoded;
legacy DOC feasibility remains next. Word export composition parity, modern native
layout formats, printer preflight and the requested WriteSplat ruler/pages remain
active work.

The v3.1.36/v1.2.6 v0.4.0 downloads are published: 16 clean app packages, 32 offline
startup checks, five deep offline LayoutSplat workflows, and all 20 uploaded asset
SHA-256 digests matched their local files. Production v0.4 was verified on both
origins, including short URLs. Office insertion is the next deployed code milestone. Validation: 45 WriteSplat
unit tests, two existing shell/drag browser checks, two Office browser workflows,
service-worker regression, 21 Wiki checks plus a focused rerun after adding the
new WriteSplat article. The private Word sample was inspected locally; source
files and screenshots are not distributed.

## October 14, 2026 — v0.4 composition, editing and performance milestone

123 distinct physical compositions replace color-counted variants, with 738 valid
language models. Added bifold/trifold brochures, two ten-tab tear-off flyers,
newspaper/magazine/bulletin newsletters, resumes, collages and document layouts.
Industry remains a filter. All 29 Avery geometries and 127 codes remain available.
Private visual reference PDFs informed original geometry and are not distributed.

The draggable Edit story window now supports selected bold/italic/underline and
paragraph alignment. Rich round trips retain blank paragraphs, mixed fonts,
tracking, leading, paragraph spacing and indents. Publisher conversion now retains
these paragraph metrics, asymmetric frame insets, columns and column gaps.

Unchanged story layouts are cached; visible thumbnails are rendered lazily, and
print/preview trees are built when needed. A controlled 500-page regression checks
500 cached stories and exactly one reflow after editing one story, with all text
preserved. Shared whiteboard artwork provides 96 embedded background/picture
choices. Native GridSplat/ListSplat JSON becomes merge recipients using the suite's
actual formula engines, formatting and archive filtering; errors stop that source.

Verification: nine model tests; all 738 language compositions render without
detected text overflow. Forty-two browser workflows passed across the full run
and focused fixes. The independent PDF proof checks two exact Letter pages,
eight conserved story paragraphs, selectable Arabic and embedded fonts. Catalog
contact sheets were visually reviewed and overlapping decorations corrected.

Remaining priorities: formatted DOCX/ODT insertion, browser legacy DOC feasibility,
additional native import fidelity, independent printer preflight and target-app
validation. WriteSplat DOCX numbering/spacing and page/ruler improvements requested
in this session remain scheduled after this LayoutSplat milestone. Native INDD/QXP
and modern Pages IWA are still unsupported; the private Publisher benchmark still
reports one overflowing story. The roadmap remains open.

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

Final regression follow-up: font-load redraws preserve focused property input values; a browser regression checks column/spacing edits while a font-load event triggers redraw. Affected LayoutSplat, suite, and district archives were refreshed before release completion.
