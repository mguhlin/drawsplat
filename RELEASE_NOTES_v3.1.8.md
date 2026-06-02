# DrawSplatTM v3.1.8 Release Notes

DrawSplatTM v3.1.8 refreshes the self-host bundle with the latest classroom tools, Concept Map Studio upgrades, and Quiz & Flashcard Studio science sample sets.

## Highlights

- SplatImage Studio is now included in the Tools dropdown as a standalone browser-only image editor with resize and crop handles for quick classroom image cleanup.
- SplatImage Studio arrowheads now scale with thicker annotation lines so large arrows keep a clear, proportional head.
- SplatImage Studio image cropping now supports double-click-to-crop on an image, crop handles around that image, and Crop now lives in the Edit menu.
- SplatImage Studio image-crop handles now stay active even when clicked on the part of the handle just outside the image edge.
- SplatImage Studio paste/import now displays images immediately from a temporary object URL, then backfills the data URL in the background for smoother large screenshot pastes.
- SplatImage Studio adds File > New layer plus a visible New layer button in the Layers panel, per-layer opacity from 0-100%, and expanded Effects: sharpen, lighten, darken, pixelate, mosaic, and Picasso cubism, with an Effect strength slider.
- Concept Map Studio adds Markdown import, text controls, dropdown menus, improved import collision layout, and cleaner selected-node editing.
- Quiz & Flashcard Studio now ships with selectable science sample data sets for Grade 3 Science TEKS, Grade 5 Science TEKS, and Grade 10 Biology TEKS.
- Quiz & Flashcard Studio flashcards now keep the correct answer visually distinct from optional explanation text on the card back.
- Blog RSS content is refreshed so the self-hosted site carries the latest bundled blog snapshot.

## Self-Host Bundle

The self-host zip is labeled `drawsplat-selfhost-v3.1.8.zip`.

Build locally with:

```bash
./scripts/make-selfhost-bundle.sh v3.1.8
```

The bundle includes the static site, Apps Script backend, MySQL backend, documentation, legal/compliance pages, and standalone classroom tools. It excludes `.git`, `node_modules`, `.env`, logs, and build artifacts.
