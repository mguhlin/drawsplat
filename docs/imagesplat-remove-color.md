# ImageSplat background and color removal

Select one or more image layers, then choose **Effects → Background removal…**.
ImageSplat now embeds the same BackdropSplat worker, white/color pixel processing,
and local photo models as the standalone tool. The older external smart-cutout
loader is no longer used.

**Remove color…** opens the studio in Colored background mode. Click/tap the
original preview to sample a color, or use the picker. Choose **Connected to
image edges** to preserve enclosed matching regions, or **Every matching pixel**
to clear all matching pixels, including logo and lettering centers. Border mode
starts from every image edge; sampling selects the color, not a flood-fill seed.
Tolerance and soft edge control matching and partial opacity. Existing alpha is
never increased. White mode fixes the target to white.

Process the selected layers, inspect their before/after previews and zoom, then
download full-resolution PNG/JPEG or a ZIP. Changing cutout settings invalidates
previous results. Choose transparent, white, or custom background output. JPEG
downloads use a solid background; selecting JPEG does not flatten layer Apply.

Apply updates all selected image layers together. One Undo restores them all.
Cancel and downloads leave the document unchanged. The ImageSplat stage remains
white, so check transparency against the studio checkerboard. Photo adjustments,
layer placement, image dimensions, and the separate Green Screen Studio remain
available.

White/color removal needs no model or external connection. Photo mode downloads
pinned open models and processes pixels on the device. See the
[BackdropSplat guide](backdropsplat.md) for model sizes, privacy controls, formats,
limits, and licensing.

Verification: `npx playwright test --config playwright.backdropsplat.config.cjs`
covers white/color pixel output, stale previews, selected-layer batch Apply,
Undo/Redo, Cancel, ZIP names, PNG/JPEG, model cancellation, privacy, and mobile.
`tests/imagesplat-remove-color.spec.js` retains compatibility checks for the
legacy color module; new editing actions use BackdropSplat’s shared engine.
