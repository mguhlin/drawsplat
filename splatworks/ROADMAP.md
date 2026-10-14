# SplatWorks development roadmap

SplatWorks provides DrawSplat's browser applications for writing, presentations, spreadsheets, databases, and publication design. Preserve each application's own document model while sharing the app launcher, language preference, file handoff, and district installation inventory.

## LayoutSplat

The LayoutSplat plan was approved October 13, 2026. Development begins with the page layout and export proof described in [the complete LayoutSplat plan](layoutsplat/IMPLEMENTATION_PLAN.md). Its public application path is `/splatworks/layoutsplat/`.

| Milestone | Scope | Progress |
| --- | --- | --- |
| 1 | Two-page layout and export proof; linked stories; English/Arabic; precise geometry; local saves | Available in v0.1 and retained in v0.2 |
| 2 | Templates; editing tools; guides; recovery; core checker; PDF and image exports | Available in v0.3; 305 designs; 29 Avery geometries and name badges |
| 3 | Masters; facing-page preview; typography; wrapping; fold guidance; expanded templates | Core tools available in v0.2; advanced wrap/typography fidelity remains |
| 4 | Excel/CSV personalization; labels; catalogs; HTML editions; sharing; Pack and Go | Available in v0.2; further native suite data-source integration remains |
| 5 | Printer profiles; advanced preflight; independently validated PDF/X; district release packaging | ICC intent, bleed/crop boxes, packages, optional Ghostscript PDF/X-3 conversion and structural checks available; exhaustive certification, performance work, remain; release ZIPs rebuilt in v3.1.35 |

v0.2 also adds experimental browser-native Publisher import, editable layout
interchange, broad local media import, contextual object imports, and native
SplatWorks JSON content import/export. Keep the original file and review conversion
reports. The [feature guide](../docs/layoutsplat.md) documents format boundaries.

Record verified capabilities and remaining work in [LayoutSplat progress](layoutsplat/PROGRESS.md). Feature descriptions in the application registry must describe shipped functionality rather than the full roadmap.


## v0.3 progress

Core milestones 1–2 are implemented. Milestones 3–4 have their core tools, with
further text composition fidelity, dynamic fields, and native suite merge sources
remaining. Milestone 5 has print preparation and refreshed packages; stronger
preflight, exhaustive PDF/X certification, performance, and desktop interoperability
remain. This is substantial implementation progress, not full roadmap completion.

v0.3 adds descriptive/logo templates, distinct menus, Avery labels/name badges,
contextual link/unlink, organized File submenus, font-file embedding and kerning,
Publisher crop/paragraph fixes, legacy Pages, Illustrator/PDF artwork, and local EPS.
Native INDD/QXP and modern Pages IWA are future compatibility work.
