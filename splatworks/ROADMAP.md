# SplatWorks development roadmap

SplatWorks provides DrawSplat's browser applications for writing, presentations, spreadsheets, databases, and publication design. Preserve each application's own document model while sharing the app launcher, language preference, file handoff, and district installation inventory.

## LayoutSplat

The LayoutSplat plan was approved October 13, 2026. Development begins with the page layout and export proof described in [the complete LayoutSplat plan](layoutsplat/IMPLEMENTATION_PLAN.md). Its public application path is `/splatworks/layoutsplat/`.

| Milestone | Scope | Progress |
| --- | --- | --- |
| 1 | Two-page layout and export proof; linked stories; English/Arabic; precise geometry; local saves | Available in v0.1 and retained in v0.2 |
| 2 | Templates; editing tools; guides; recovery; core checker; PDF and image exports | Available in v0.4.4; 123 distinct compositions; 29 Avery geometries and name badges |
| 3 | Masters; facing-page preview; typography; wrapping; fold guidance; expanded templates | Core tools available in v0.2; advanced wrap/typography fidelity remains |
| 4 | Excel/CSV personalization; labels; catalogs; HTML editions; sharing; Pack and Go | Available in v0.4; native GridSplat/ListSplat merge uses their formula engines |
| 5 | Printer profiles; advanced preflight; independently validated PDF/X; district release packaging | ICC intent, bleed/crop boxes and optional Ghostscript PDF/X-3 conversion; expanded structural preflight, 500-page cached-layout regression and 100-page print proof in v0.4.4; external certification and broader target-app validation remain; downloads v3.1.36 contain v0.4.0 pending next refresh |

v0.2 also adds experimental browser-native Publisher import, editable layout
interchange, broad local media import, contextual object imports, and native
SplatWorks JSON content import/export. Keep the original file and review conversion
reports. The [feature guide](../docs/layoutsplat.md) documents format boundaries.

Record verified capabilities and remaining work in [LayoutSplat progress](layoutsplat/PROGRESS.md). Feature descriptions in the application registry must describe shipped functionality rather than the full roadmap.


## v0.3 progress

Core milestones 1–2 are implemented. Milestones 3–4 have their core tools, with
further text composition fidelity and dynamic fields remaining. Native suite merge
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

Native INDD/newer QXP/modern Pages IWA, richer proprietary source flow, dynamic fields,
editable reading order and external target-app certification remain open.
Current release ZIPs retain their published contents until the next full refresh.

The v0.4.4 milestone adds browser-native QuarkXPress 3.1–4.1 text/frame/vector
import with source retention. Newer QXP is still outside the decoder's scope.
