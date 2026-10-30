# v3.1.46 — ImageSplat PNG export and homepage discovery

October 30, 2026.

## ImageSplat PNG export

- **Export PNG** and **Copy PNG** now fit all visible artwork instead of exporting the entire white editing canvas. Both actions include all visible layers regardless of the selection.
- Images, multiline text, italic lettering, underlines, rectangles, lines, freehand strokes, and arrowheads retain their placement and stacking order. Selection handles and hidden layers are excluded.
- Gaps stay transparent. White pixels or borders already embedded in an imported image are preserved; this change removes workspace margins.
- **File → Export selection** uses the same bounds for the selected visible layers.
- Artwork outside the editing canvas is included. Canvas cropping still uses the original canvas coordinates. GIF/frame export and the background-removal/Green Screen studios retain their own output dimensions.

## Homepage

Search and the Create, Graph, Organize, Media, Teach, and Play categories appear above the SplatWorks hero illustration. Explore SplatWorks, Open DrawSplat Whiteboard, and Browse all apps appear below it.

## Downloads and updating

The full DrawSplat, Tools collection, and complete DrawSplat + SplatWorks district suite are refreshed as v3.1.46. There is no separate ImageSplat ZIP. Extract the whole package and keep its shared folders. Back up saved projects, database contents, and server configuration before updating. Use the included launcher for local editing. Older v3.1.45 ZIPs remain available and predate this PNG fix. Other office, media, Widgets, Games, PlanSplat, and ListSplat packages retain their separately listed versions.

The release includes `SHA256SUMS-v3.1.46.txt` for the three refreshed ZIPs and an individual district `.zip.sha256` file. [Download packages](../../pages/download.html#imagesplat-png-export) · [ImageSplat instructions](../../solutions/imagesplat/README.md) · [Modular installation](../modular-selfhost.md).

## Verification

Twelve Chrome/Firefox ImageSplat checks passed locally, and six production Chrome checks passed after the application fix. They cover image-only dimensions and preserved white pixels, transparent gaps, multiline italic/underlined text beyond the image, copy/download parity, strokes, arrowheads, hidden layers, selection exports, negative coordinates, canvas cropping, and text editing. The required WebKit test browser was unavailable. All 31 existing homepage discovery and wiki checks passed. Desktop (1440 px) and phone (390 px) checks confirmed the requested homepage order, working search, and no horizontal overflow. Packaged files are checked against the current application and documentation sources.
