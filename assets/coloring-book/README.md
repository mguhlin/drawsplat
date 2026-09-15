# DrawSplat Coloring Book Assets

The curated picker contains **24 pages**: 12 retained JPG illustrations and 12 new PNG illustrations generated on September 15, 2026 using the built-in image_gen tool. New pages are 1024 × 1536 pixels. The existing project CC0 dedication applies to these assets to the extent rights exist.

## Curation

Reviewed all 22 previous pages visually and checked native dimensions. Removed the ten visibly pixelated 180–190 × 237–245 animal thumbnails: Anteater, Beaver, Beaver Pup, Giraffe, Goat, Leopard, Meerkats, Platypus, Raccoon, and Wolves. The new `wildlife-anteater.png` replaces the old anteater drawing. The twelve sharper existing JPGs are unchanged.

New subjects: anteater, lunar exploration, robotics lab, solar and wind energy, pollinator garden, coral reef, inclusive playground, soccer practice, healthy rangelands, space telescope, repair and reuse, and community garden. These are coloring illustrations, not technical or anatomical reference diagrams.

The asset list is in `manifest.json`; the Whiteboard catalog in `assets/js/app.js` mirrors it. Each entry names its exact file extension, avoiding failed JPG/JPEG probes for PNG pages. Prompt template and all twelve subject prompts are recorded in `generation-prompts.json`. Final images live in this directory, without resizing or sharpening the generated files.

## Maintenance

Inspect new artwork at native resolution and at normal board size. Use at least 1024 × 1536 for new portrait pages; do not enlarge thumbnails and call them high resolution. Keep a white background and clear outlines with room to color. Update both catalogs and run `tests/whiteboard-gallery.spec.js`.

`tools/generate-coloring-book-assets.js` is an obsolete SVG experiment; it does not generate this curated collection and must not be run over this directory.

Contemporary inspiration: [NASA lunar exploration](https://science.nasa.gov/moon/exploration/) and the [2026 International Year of Rangelands and Pastoralists](https://www.fao.org/rangelands-pastoralists-2026/). No generated scene claims to depict a particular real mission or event.
