# DrawSplatTM v3.1.16 Release Notes

Released: 2026-06-30

## Summary

v3.1.16 makes SplatWorksTM available as a browser-based office suite package and
adds drop-in DrawSplatTM module packages for Tools, Widgets, and Games.

## Highlights

- Added `splatworks-suite-selfhost-v3.1.16.zip` with GridSplatTM, ShowSplatTM,
  WriteSplatTM, and ListSplatTM in one static suite bundle.
- Added `splatworks-listsplat-selfhost-v3.1.16.zip` for the classroom database
  app.
- Added `drawsplat-tools-selfhost-v3.1.16.zip`,
  `drawsplat-widgets-selfhost-v3.1.16.zip`, and
  `drawsplat-games-selfhost-v3.1.16.zip`.
- Updated `scripts/make-selfhost-bundle.sh` so all package families build from
  one command.
- Added `docs/modular-selfhost.md` explaining how to unzip modules into the same
  web root so paths connect without an installer.

## ListSplatTM

ListSplatTM now ships with the SplatWorksTM suite and as an individual app
package. The current browser app includes tables, forms, cards, galleries,
labels, reports, CSV import/export, JSON save/open, image fields, language
switching, formulas, relationship lookup formulas, teacher notes, project packet
export, and per-layout field visibility.

## Package model

All packages are static browser files. The packages keep their normal top-level
paths:

- `/splatworks/` for SplatWorksTM apps.
- `/solutions/` for DrawSplatTM Tools and Widgets.
- `/games/` for DrawSplatTM Games.
- `/pages/` and `/assets/` for launch pages and shared site assets.

To combine packages, unzip them into the same web root and keep folder names
unchanged.
