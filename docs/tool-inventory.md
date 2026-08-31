# DrawSplat public destination inventory

This inventory is the source audit behind `data/drawsplat-tools.json`. It records discovery destinations, not every internal route or alternate build file. Existing URLs remain unchanged.

## Inventory summary

| Group | Registry coverage | Notes |
| --- | ---: | --- |
| Main workspace | 1 | DrawSplat Whiteboard |
| SplatWorks workspaces | 4 | GridSplat, ShowSplat, WriteSplat, ListSplat |
| Standalone solutions | 36 | Public `/solutions/` destinations, including PDFsplat, QRSplat, and CipherSplat; legacy graph URLs route to GraphSplat |
| Games and puzzles | 12 | Every game card currently listed on `/games/`; Dots and Boxes is hosted under `/solutions/` |
| Educator/family/support destinations | 5 | Teacher Admin, Family Access, templates, guides, and support |

## Classification decisions

- Function is primary. `type` remains secondary metadata and is never required knowledge for search.
- Tools can have multiple categories. For example, Picture Graph belongs to data, creation, and assessment.
- Branded names are preserved. Natural-language alternatives live in `aliases` and `keywords`.
- Alternate implementation pages such as `index.vite.html`, student/player routes, presentation routes, and individual quiz packs are child routes rather than separate discovery records.
- Legal and compliance pages remain prominently linked from institutional navigation but are not treated as creative applications.
- Major whiteboard capabilities are discoverable through Whiteboard keywords until stable standalone URLs or launcher commands exist for individual capabilities.

## Overlap resolved by intent

| Intent | Primary destination | Nearby choices |
| --- | --- | --- |
| Quick conventional or CSV chart | GraphSplat — Quick Chart | GridSplat |
| Picture-first elementary graph | GraphSplat — Picture Graph | Whiteboard |
| Coordinates and equations | GraphSplat — Coordinate Plane or Expression Calculator | GridSplat |
| Visual idea relationships | Concept Map Studio | Whiteboard, Mermaid Diagram |
| Slides and presentation | ShowSplat | Whiteboard, ImageSplat™ |
| Image editing | ImageSplat™ | Draw & Sketch, Whiteboard |
| Video editing | VideoSplat | MediaSplat, Animated GIF Maker |
| Random student choice | Wheel Spinner | Fortune Wheel, Dice Roller |

## Validation expectations

- Registry IDs are unique.
- Category IDs resolve to the category list.
- Related IDs resolve to registry tools.
- Root-relative URLs and icon paths resolve to files in the published site.
- A new public application should normally require one registry entry to appear in Studio and search.
