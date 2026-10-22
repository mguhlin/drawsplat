# BackdropSplat design and implementation

BackdropSplat is a focused SplatWorks image utility: photo subject cutouts, fast
white/color removal, comparison, and full-size exports. The reference is
https://utilz.net/background-remover/ and its linked white-background tool.
Implementation is independent; no Utilz interface or source code is copied.

## Design plan

- Palette: suite purple `#7c3aed`, deep purple `#5625ad`, ink `#182139`, cool paper
  `#f5f6fb`, rule `#d6dbea`, and teal `#0f766e` for completion.
- Type: the suite's familiar Arial/Helvetica system stack. A compact 28px app
  title, 20px working headings, and 15–16px controls keep image work central.
- Layout: a narrow controls column beside one large comparison stage. A batch
  queue sits below the stage. On phones, controls and stage form one column.
- The checkerboard is functional: it makes alpha visible. One purple reveal
  handle is the main visual accent. No decorative marketing cards or generated
  hero imagery are needed in a working image tool.

```
SplatWorks / BackdropSplat                         Help / Suite
┌ Controls ───────────┬ Original / result comparison ─────────┐
│ Photo / White /    │ Choose, drop, paste, or try a logo     │
│ Color + settings  │ Compare slider · zoom                  │
│ Process / Cancel  ├ Batch queue ───────────────────────────┤
│ Export options    │ Filename · state · select · remove     │
│ Save / ZIP        │                                       │
└───────────────────┴───────────────────────────────────────┘
```

Review against the brief: keep the existing suite's purple and plain controls;
make the image itself the distinctive element. An initial three-column layout
would leave too little room for wide images, so export controls stay in the same
left column. White removal works immediately without a model download. Photo
models download only after the user explicitly requests photo processing.

## Processing plan

- All image pixels stay in browser memory. No upload or inference API.
- Original files are immutable. Every new cutout starts from the original.
- A dedicated worker processes one image at a time and can be terminated to
  cancel a running operation. Export compositing does not rerun the model.
- Photo models: pinned ORMBG (Apache-2.0) for WASM and BEN2 (MIT) for WebGPU.
  Unsupported or failing WebGPU falls back to ORMBG with a visible explanation.
- White/color removal: target color, tolerance, soft edge, and border-connected
  versus all-matching regions. Source alpha is preserved.
- Transparent/white/custom backgrounds; PNG/JPEG; individual download and ZIP.
- Keyboard-operable comparison and file selection, status announcements,
  meaningful errors, responsive controls, and bounded image/batch dimensions.
- Respect the shared privacy control's optional-connections setting, including
  inside the worker. The white/color route requires no external connection.

Primary model and runtime references:

- https://huggingface.co/onnx-community/BEN2-ONNX
- https://huggingface.co/onnx-community/ormbg-ONNX
- https://huggingface.co/docs/transformers.js/v3.8.1/api/pipelines

The model licenses and runtime notices are retained with vendored runtime files.

## Replacement-background extension

Keep the same palette, type, and comparison stage. A scene chooser directly
below the preview puts six small illustrated thumbnails, upload, and URL loading
in one place. The selected scene receives a purple outline; the actual composite
remains the visual focus. At narrow widths the chooser follows processing
controls and uses three thumbnails per row. This avoids squeezing six scene
names into the sidebar or hiding the new feature behind a separate modal.

Original code-native SVG backgrounds: Studio Paper, Soft Lavender, Classroom
Board, Splat Confetti, Mountain Morning, and Coastal Calm. No stock service,
external asset references, generated raster dependency, or attribution lookup.

The cutout blob remains unchanged. A shared canvas compositor draws a centered
cover/contain background and then the cutout at native dimensions. The same
path drives preview, PNG, JPEG, and every ZIP entry. Background changes do not
invalidate the removal signature. Releasing a backdrop cannot race a pending
composite: the background is painted synchronously before cutout decoding.

URL import is an explicit credential-free, no-referrer HTTPS CORS fetch, with a
bounded streamed body, dimension checks, cancellation, timeout, and privacy
revocation. The page allows HTTPS image downloads; model-worker fetches remain
limited by their existing host allowlist. A blocked host gives download/upload
guidance; no server-side image proxy or photo upload is introduced. Imports
replace the previous background atomically after decode and validation.

## ImageSplat parity and language control

ImageSplat embeds the same six local scenes, HTTPS loader, bounded decoder, and
canvas compositor. The chooser sits under its before/after preview; the existing
purple palette, Arial type, sticky Close/Apply actions, and white checkerboard
stay consistent with the editor. Scene thumbnails use six columns on desktop
and three on narrower screens. A View result link returns mobile users to the
composition. Selected-layer application stays atomic with one Undo.

BackdropSplat uses the shared WidgetI18n picker and language preference, with
English, Spanish, Vietnamese, Arabic RTL, Chinese, and Hindi/Urdu controls. Image
and comparison orientation remain stable in RTL; language changes redraw
controls without replacing source images or cached cutouts.
