# DrawSplatTM v3.1.8 Release Notes

DrawSplatTM v3.1.8 refreshes the self-host bundle with the latest classroom tools, Concept Map Studio upgrades, and Quiz & Flashcard Studio science sample sets.

## Highlights

- SplatImage Studio is now included in the Tools dropdown as a standalone browser-only image editor with resize and crop handles for quick classroom image cleanup.
- SplatImage Studio arrowheads now scale with thicker annotation lines so large arrows keep a clear, proportional head.
- SplatImage Studio image cropping now supports double-click-to-crop on an image, crop handles around that image, and Crop now lives in the Edit menu.
- SplatImage Studio image-crop handles now stay active even when clicked on the part of the handle just outside the image edge.
- SplatImage Studio paste/import now displays images immediately from a temporary object URL, then backfills the data URL in the background for smoother large screenshot pastes.
- SplatImage Studio paste/import trims transparent or near-white outer margins so copied images do not arrive with oversized empty selection bounds.
- SplatImage Studio adds a Masks dropdown that crops selected image layers into circle, oval, ellipse, square, rectangle, diamond, pentagon, and star shapes.
- SplatImage Studio star and pentagon masks now scale to rectangular image bounds instead of leaving wide transparent margins around the masked image.
- SplatImage Studio adds File > New layer plus visible New layer and Duplicate layer buttons in the Layers panel, per-layer opacity from 0-100%, text alignment for text boxes, and expanded Effects: sharpen, lighten, darken, pixelate, mosaic, and Picasso cubism, with an Effect strength slider.
- Adds the DrawSplat Hub dashboard at `hub/index.html` plus the first school-specific instance scaffold at `hub/hubcampus/`, including the DrawSplat Hub banner, campus hero image, guided instance admin wizard, Google OAuth admin binding pattern, and `apps-script/InstanceRegistry.gs` starter backend for one-time setup password plus Google account binding.
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

The bundle includes the static site, Apps Script backend, MySQL backend, documentation, legal/compliance pages, standalone classroom tools, and the generic DrawSplat Hub dashboard with the `hubcampus` demo instance. Real Hub campus folders are intentionally excluded from self-host bundles.
