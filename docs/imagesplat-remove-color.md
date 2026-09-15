# ImageSplat color and green-screen removal

Select one image layer, then choose **Effects → Remove color…**.

- Click/tap the original preview to sample the actual backdrop color, or use the green screen, blue screen, white, and black presets or color picker.
- **All matching colors** removes matches throughout the image.
- **Connected area at clicked point** removes only the matching region reachable from the sampled pixel (four neighboring directions). Separate matching regions remain intact. Select a point before applying or downloading this mode.
- Tolerance controls color matching; edge smoothing gradually reduces opacity for colors just beyond that tolerance. Zero smoothing produces a hard threshold. Existing alpha is preserved or reduced, never increased.
- Preview adjustments always start from unchanged source pixels. Preview images are capped at 700 pixels on the longest side, so fine edges or narrow connections may differ from the full-resolution result.
- **Download PNG** exports the image at its original pixel dimensions with transparency, independent of the white editor canvas. **Apply to layer** replaces the selected image without changing its placement; Undo restores the original.
- Import now retains white margins and original dimensions rather than automatically trimming them. Imported image data remains available for Undo after loading.

All processing is local. This is color-based transparency, not AI subject segmentation or automatic green-spill correction. Uneven lighting may require sampling and tolerance adjustments. The existing smart background cutout and edge-background tool remain available.

## Checks

`npx playwright test tests/imagesplat.spec.js tests/imagesplat-remove-color.spec.js`

Tests verify connected versus global green-screen removal, full-resolution PNG alpha, tolerance and soft edges, preview reset, cancellation, applying and undoing, and the existing clipboard and route behavior. Also run with Firefox and iPhone-emulated WebKit before publication.
