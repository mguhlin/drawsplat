# DrawSplatTM v3.1.13 Release Notes

DrawSplatTM v3.1.13 starts ShowSplatTM, the SplatWorksTM presentation and WebDeck authoring tool, and expands the separate self-host packaging model to include a ShowSplatTM zip.

## Highlights

- **ShowSplatTM app scaffold.** Added `splatworks/showsplat/`, a static browser app for building slide decks with a thumbnail rail, central 16:9 canvas, menus, icon toolbar, notes, templates, themes, object drag/resize, media insertion, Markdown Studio, slideshow preview, and WebDeck export.
- **ShowSplatTM public page.** Added `pages/showsplat.html` and updated SplatWorksTM navigation so ShowSplatTM is an active app.
- **WebDeck export.** ShowSplatTM can export a self-contained HTML deck with slide data, navigation, progress, notes, hash links, fullscreen controls, and an optional frontend password prompt backed by a SHA-256 hash.
- **Markdown workflow.** Added built-in Markdown import/export so users can build a deck from a Markdown outline first.
- **Separate ShowSplatTM package.** The self-host bundle script now creates `splatworks-showsplat-selfhost-v3.1.13.zip` alongside the DrawSplatTM and GridSplatTM packages.

## Bundle Files

- `drawsplat-selfhost-v3.1.13.zip` — 203 MB  
  SHA-256: `caf2581bdd04664ede5878cefd64ae17f783ac6aee23f4bf01fec28026f8d02b`
- `splatworks-gridsplat-selfhost-v3.1.13.zip` — 7.2 MB  
  SHA-256: `0ba4066ab28ef0a4037d1c44e47b97f61a326a68a486a9ead7298d5ca905164a`
- `splatworks-showsplat-selfhost-v3.1.13.zip` — 24 KB  
  SHA-256: `d550456366905d24686a11a9421ed6b71c964540b65ae8cc992727c7f28f77ab`

## Notes

ShowSplatTM is an early app foundation, not yet feature-complete against the full long-term plan. ODP and PPTX export are listed as planned targets until real file writers are implemented. PDF export currently uses the browser print flow.
