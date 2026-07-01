# DrawSplatTM v3.1.14 Release Notes

Released: 2026-06-14

## Highlights

- **SplatWorksTM folder layout.** GridSplatTM and ShowSplatTM now live under `splatworks/`, with app routes at `/splatworks/gridsplat/` and `/splatworks/showsplat/`.
- **SplatWorksTM hub page.** Added `pages/splatworks.html` with app icons, launch buttons, and planned WriteSplatTM/ListSplatTM placeholders.
- **ShowSplatTM editor expansion.** Added purple slide templates, graph and concept-map templates, slide/deck audio support, visible JSON save/load, richer slide thumbnails, child-friendly object editing, four-corner resize handles, rotate handle, text fit/autofit, and image crop mode.
- **Privacy/licensing alignment.** SplatWorksTM legal language now covers GridSplatTM and ShowSplatTM, with Terms/Privacy and GDPR links added to SplatWorks pages and ShowSplatTM Help.

## Self-Host Bundles

- `drawsplat-selfhost-v3.1.14.zip` is 203 MB with SHA-256 `8960ccd31ba45ee8a7f5212a363b92b9e6415f15aeee78782da12b6674603b47`.
- `splatworks-gridsplat-selfhost-v3.1.14.zip` is 7.2 MB with SHA-256 `4599fef60d4797b916eefa804e1c5121a33ae5ffb5e91b0536d9536b47ffa664`.
- `splatworks-showsplat-selfhost-v3.1.14.zip` is 1.6 MB with SHA-256 `61be6822d8ac3aba6156f7d90c72dfdc37913f819d037758a10292058da5fb60`.

## Current Live Updates After v3.1.14

These changes are live on `main` and the public site, but are newer than the
tagged v3.1.14 ZIP artifacts.

- **ShowSplatTM import/export menus.** File Import and Export now group WebDeck
  HTML, Markdown, PDF, ODP, and PowerPoint/PPTX paths under clear submenus.
- **PPTX and ODP compatibility.** ShowSplatTM can import and export PPTX and
  ODP files with best-effort text, image, shape, background, and grouped-object
  preservation.
- **PDF workflows.** PDF import creates full-slide image pages, including
  password-protected PDFs after a password prompt. PDF export uses the browser
  print dialog and Save as PDF.
- **Editor controls.** Selected text boxes can toggle bullets on/off, decrease
  or increase font size, and use a zoom slider. Deleting the final slide now
  creates a blank title slide instead of leaving the deck empty.
- **Presentation mode.** Presenter navigation auto-hides after a few seconds
  and returns on hover. Speaker notes can pop out into a movable window.

## Next Run Improvement Areas

- Improve PPTX/ODP fidelity for freeform shapes, clipping, image masks, group
  transforms, master-slide inheritance, theme fonts, charts, tables, and notes.
- Add editable PDF import with positioned text extraction and optional OCR.
- Move large imported assets from localStorage into IndexedDB, lazy-render
  thumbnails, and add large-deck save warnings.
- Add a direct deterministic PDF writer or dedicated print layout.
- Add stronger table-cell editing, object/layer controls, lock/background
  controls, and clearer warnings for image-snapshot imports.
- Build fixture-based regression tests for WebDeck, PPTX, ODP, and PDF imports.
