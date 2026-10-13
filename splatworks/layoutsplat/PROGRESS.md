# LayoutSplat development progress

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

### Remaining milestones

- Six publication-template categories, fuller editing tools, tables, alignment/distribution, grouped objects, image export, and broader recovery controls.
- Rich-text story editing, AutoFit choices, advanced wrapping, masters, facing pages, drop caps, WordArt, border art, format painter, folding, and expanded templates.
- Excel/CSV merge, labels/catalog generation, semantic HTML reading editions, sharing/Email preview, and complete Pack and Go.
- Printer profiles, bleed/crop marks, advanced preflight, independently validated PDF/X, commercial printer handoffs, and dedicated release packages.
- Fonts in editable projects currently use those available on the viewing computer; redistributable font packaging and deterministic cross-computer text metrics remain future work. Browser PDF output embeds the fonts actually used for the tested print proof.

Serve the repository over HTTP(S), including a loopback server for offline use. Direct `file://` opening does not support this module-based editor. Native Publisher `.pub` conversion is a separate feasibility milestone.
