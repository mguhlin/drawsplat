# SplatWorks development roadmap

The SplatWorks ecosystem provides browser applications for writing, presentations, spreadsheets, databases, and publication design. DrawSplat remains the whiteboard. Preserve each application's own document model while sharing the app launcher, language preference, file handoff, and district installation inventory.

## LayoutSplat

The LayoutSplat plan was approved October 13, 2026. Current v0.6.0 development follows [the complete LayoutSplat plan](layoutsplat/IMPLEMENTATION_PLAN.md). Open `/layoutsplat/`; the original `/splatworks/layoutsplat/` path remains valid.

| Milestone | Scope | Progress |
| --- | --- | --- |
| 1 | Two-page layout and export proof; linked stories; English/Arabic; precise geometry; local saves | Available in v0.1 and retained in v0.2 |
| 2 | Templates; editing tools; guides; recovery; core checker; PDF and image exports | Available in v0.4.6; 126 distinct compositions; 29 Avery geometries and name badges |
| 3 | Masters; facing-page preview; typography; wrapping; fold guidance; expanded templates | Core tools available in v0.2; advanced wrap/typography fidelity remains |
| 4 | Excel/CSV personalization; labels; catalogs; HTML editions; sharing; Pack and Go | Available in v0.4; native GridSplat/ListSplat merge uses their formula engines |
| 5 | Printer profiles; advanced preflight; independently validated PDF/X; district release packaging | ICC intent, bleed/crop boxes and optional Ghostscript PDF/X-3 conversion; expanded structural preflight, 500-page cached-layout regression and 100-page print proof in v0.4.4; external certification and broader target-app validation remain; refreshed v3.1.37 and district-suite-v1.2.7 downloads contain v0.4.6 |

v0.2 also adds browser-native Publisher import, editable layout
interchange, broad local media import, contextual object imports, and native
SplatWorks JSON content import/export. Keep the original file and review conversion
reports. The [feature guide](../docs/layoutsplat.md) documents format boundaries.

Record verified capabilities and remaining work in [LayoutSplat progress](layoutsplat/PROGRESS.md). Feature descriptions in the application registry must describe shipped functionality rather than the full roadmap.


## v0.3 progress

Core milestones 1–2 are implemented. Milestones 3–4 have their core tools, with
further text composition fidelity and broader dynamic fields remaining. Native suite merge
sources now use the actual application engines. Milestone 5 has expanded print
preparation, independent structural preflight, 100-page print conservation and
500-page cached layout checks. External PDF/X certification, broader printer and
desktop interoperability validation remain. This is substantial implementation progress, not full roadmap completion.

v0.3 adds descriptive/logo templates, distinct menus, Avery labels/name badges,
contextual link/unlink, organized File submenus, font-file embedding and kerning,
Publisher crop/paragraph fixes, legacy Pages, Illustrator/PDF artwork, and local EPS.
Native INDD/newer QXP and modern Pages IWA are future compatibility work.

## v0.4.4 follow-up

Distinct geometry replaces color-only template counts. The rich story editor is
movable and supports selected B/I/U/alignment; 96 whiteboard backgrounds are
portable. Browser-native DOC and formatted DOCX/ODT insert into text frames.
Original Publisher fonts loaded before import are retained, with style matching
and specific substitution reports. WriteSplat has blank new documents, page
guides and a paragraph ruler with persistent left tabs and indents.

Native INDD/newer QXP/modern Pages IWA, richer proprietary source flow, dynamic master fields,
and external target-app certification remain open.
Current release ZIPs retain their published contents until the next full refresh.

The v0.4.4 milestone adds browser-native QuarkXPress 3.1–4.1 text/frame/vector
import with source retention. Newer QXP is still outside the decoder's scope.

The v0.4.5 milestone adds updating page/total folios and reading-order/omission
controls with richer HTML output. Expanded proofs conserve 800 body paragraphs
and 100 linked fragments over 100 Letter pages; the 500-page cache regression
uses newsletter-length copy. Core publishing features are implemented; source
composition fidelity and externally validated print/native compatibility remain
ongoing verification work.

The v0.4.6 milestone preserves supported WriteSplat paragraph metrics, blank
paragraphs and list labels across native suite exchange, in addition to inline
formatting. Embedded fonts and advanced spacing remain reported conversion limits.

## v0.6.0 current priorities

Ordinary page/total folios, reading-order controls, native GridSplat/ListSplat merge,
Word/DOCX/ODT text insertion and browser-native legacy QuarkXPress 3.1–4.1 imports
are implemented. WriteSplat exchange now preserves supported paragraph metrics,
blank paragraphs and list labels. The 21-section [illustrated feature guide](../docs/layoutsplat-features.md)
and [current progress](layoutsplat/PROGRESS.md) distinguish shipped behavior from limits.

### Remaining work — October 16, 2026

The [detailed remaining-work checklist](layoutsplat/IMPLEMENTATION_PLAN.md#remaining-work)
records acceptance criteria in priority order:

- [ ] Closer Publisher typography, hyphenation, contour wrapping and imported linked-story flow.
- [ ] Broader native-import coverage and external InDesign/Scribus round-trip validation; research modern Pages IWA, QuarkXPress 5+ and native INDD.
- [ ] Open exported `.pub` files in Microsoft Publisher and EPUBs in external readers and editors; record content, navigation and formatting results.
- [ ] Richer SplatWorks exchange, including font files, custom tabs and semantic list numbering.
- [x] Dynamic page/total fields in master-page artwork (v0.5.0).
- [ ] Larger and more varied document workloads beyond the controlled performance proofs.
- [ ] Independent PDF/X validation, printer-profile workflows and commercial-printer acceptance.

The latest rebuilt downloads and district suite have been published; packaging is
complete for LayoutSplat v0.6.0 in release v3.1.43. Shipped functionality above is not part of this open checklist.

## October 16, 2026 — v0.5.0

Reusable Publisher source masters and shared-text-ID linking are implemented.
Dynamic master-page folios resolve per assigned page through page changes, native
reopening, print/HTML/SVG and editable exports. The broader Publisher composition
work remains open. Real Google Drive upload/download/reopen was user-confirmed;
the downloaded project passed archive/native validation. Native Publisher
2000 `.pub` export now runs in the app with native text/basic shapes, bitmap
fallbacks and fingerprinted native recovery. Microsoft Publisher itself still
needs external validation. See the authoritative
[remaining-work checklist](layoutsplat/IMPLEMENTATION_PLAN.md#remaining-work).


## October 16, 2026 — v0.6.0 ebooks

EPUB 2/3 import, reflowable/fixed-layout EPUB 3 export, three original ebook
starters, heading navigation, metadata and reading preview are available. The
preview includes chapter search, text size and reading themes. Full source
XHTML/CSS editing, preserved footnotes/annotations/media overlays, broad external
reader verification and ebook accessibility certification remain on the roadmap.
