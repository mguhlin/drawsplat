# DrawSplatTM v3.1.9 Release Notes

DrawSplatTM v3.1.9 refreshes the self-host bundle with the latest ImageSplat™ upgrades and the new SketchSpace VR classroom workflow.

## Highlights

- Adds SketchSpace VR as a standalone DrawSplat Tool for turning a photographed 4x3 student room grid into an explorable virtual room in the browser.
- Adds the SketchSpace VR Teacher Guide with setup steps, lesson ideas, assessment prompts, image prompt patterns, curriculum starter links, and source-inspiration links by article title.
- Adds the SketchSpace VR Play page with example rooms, starter workflow language, and full-screen linked example visuals.
- Adds six image-backed SketchSpace VR curriculum starters: citizenship, ecosystems and adaptations, geography, history, life cycles, and weather and water cycle.
- Adds corrected SketchSpace VR overview visuals that show the actual flat template workflow: print, draw, capture, upload, and explore. No cutting or folding is required.
- ImageSplat™ now supports clipboard image paste/import workflows for Canva-style copied images, plus selected-object PNG copy/export.
- ImageSplat™ adds a richer text dialog with adjustable font size, bold, italic, underline, alignment, and preview before placing text.
- ImageSplat™ adds Smart background cutout and Remove edge background tools, with a visible Working dialog while longer cutout processing runs.
- ImageSplat™ keeps the non-AI naming in the interface and uses classroom-friendly labels for cutout actions.
- The bundled blog RSS snapshot includes the latest DrawSplat update items so self-hosted copies show current DrawSplat news without external requests.

## Self-Host Bundle

The self-host zip is labeled `drawsplat-selfhost-v3.1.9.zip`.

Build locally with:

```bash
./scripts/make-selfhost-bundle.sh v3.1.9
```

The bundle includes the static site, Apps Script backend, MySQL backend, documentation, legal/compliance pages, standalone classroom tools, ImageSplat™, SketchSpace VR, and the generic DrawSplat Hub dashboard with the `hubcampus` demo instance. Real Hub campus folders are intentionally excluded from self-host bundles.
