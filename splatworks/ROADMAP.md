# SplatWorks development roadmap

SplatWorks provides DrawSplat's browser applications for writing, presentations, spreadsheets, databases, and publication design. Preserve each application's own document model while sharing the app launcher, language preference, file handoff, and district installation inventory.

## LayoutSplat

The LayoutSplat plan was approved October 13, 2026. Development begins with the page layout and export proof described in [the complete LayoutSplat plan](layoutsplat/IMPLEMENTATION_PLAN.md). Its public application path is `/splatworks/layoutsplat/`.

| Milestone | Scope | Progress |
| --- | --- | --- |
| 1 | Two-page layout and export proof; linked stories; English/Arabic; precise geometry; local saves | Available in v0.1 and retained in v0.2 |
| 2 | Templates; editing tools; guides; recovery; core checker; PDF and image exports | Available in v0.2; 270 original library designs |
| 3 | Masters; facing-page preview; typography; wrapping; fold guidance; expanded templates | Core tools available in v0.2; advanced wrap/typography fidelity remains |
| 4 | Excel/CSV personalization; labels; catalogs; HTML editions; sharing; Pack and Go | Available in v0.2; further native suite data-source integration remains |
| 5 | Printer profiles; advanced preflight; independently validated PDF/X; district release packaging | ICC intent, bleed/crop boxes, packages, optional Ghostscript PDF/X-3 conversion and structural checks available; exhaustive certification, performance work, and refreshed release ZIPs remain |

v0.2 also adds experimental browser-native Publisher import, editable layout
interchange, broad local media import, contextual object imports, and native
SplatWorks JSON content import/export. Keep the original file and review conversion
reports. The [feature guide](../docs/layoutsplat.md) documents format boundaries.

Record verified capabilities and remaining work in [LayoutSplat progress](layoutsplat/PROGRESS.md). Feature descriptions in the application registry must describe shipped functionality rather than the full roadmap.
