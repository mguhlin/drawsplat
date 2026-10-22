# BackdropSplat background removal

Open [BackdropSplat](https://splatworks.org/backdropsplat/) in SplatWorks.
The same tool is available on DrawSplat.org. Find it in Studio under Create or
Media, or search for “background”, “transparent”, “white background”, or its
original suggested name, “DisappearBkgrndSplat”.

## Use it

1. Add, drop, or paste one or more images.
2. Choose **Photo subject**, **White background**, or **Colored background**.
3. For white/color mode, set tolerance and soft edge. **Connected to the image
   edges** protects enclosed matching areas. **Every matching pixel** clears
   white centers inside lettering and logos, too. Color mode also lets you click
   the original image to sample its backdrop.
4. Choose **Remove background** for the selected file or **Process all images**.
5. Compare the original and result using the slider, arrow keys, or Original /
   Result buttons. Zoom to inspect edges.
6. Choose transparent, white, or custom-color output and download PNG or JPEG.
   JPEG always has a solid background; transparent + JPEG is flattened on white.
   A ZIP contains completed results with distinct filenames, including duplicates.

Changing cutout settings marks old results as out of date. Reprocess before
saving. Background and export-format changes reuse the existing cutout. Every
processing attempt starts from the original, so adjustments are not cumulative.
Cancel stops the worker; existing completed results remain available.

## Use the same engine inside ImageSplat

Select image layers in [ImageSplat](https://splatworks.org/imagesplat/) and choose
**Effects → Background removal…**. White and color menu shortcuts open the same
studio in the corresponding mode. Process, inspect before/after previews, and
apply all selected layers together. One Undo restores them all; Cancel and
exports leave layers unchanged. Layer positions and dimensions are preserved.
PNG/JPEG and ZIP downloads are also available. The same worker, pinned models,
white/color algorithm, and optional-connections preference serve both apps.

## Local processing and first-use downloads

White/color removal is ordinary pixel processing with no model or external
connection. Photo removal runs locally with pinned open models. ORMBG Fast is
44.3 MB; BEN2 Best is 219.1 MB and uses supported WebGPU/FP16 hardware. The local
browser engine adds about 22 MB. Unsupported or failing Best falls back to Fast
with a visible note. The app does not silently describe the fallback as Best.

Hugging Face and its file hosts receive model-download connection metadata, not
photos. Model requests contain no selected image pixels. The suite’s optional
connections preference is checked before photo processing, and the worker also
guards external downloads. Turning connections off stops an active photo job;
white/color removal remains usable.

Images and results stay in tab memory until cleared or closed. The app does not
write image projects to localStorage or IndexedDB. Browser Cache Storage may
retain public model files. Clearing origin data through Privacy or browser
settings removes those caches; exports already saved to disk are separate.

No Utilz source, text, or visual assets were copied. The requested reference
workflow was implemented independently. Models, runtime versions, and licenses
are listed in [THIRD_PARTY_NOTICES](../solutions/backdropsplat/THIRD_PARTY_NOTICES.md).

## Limits

- 20 files, 40 MB each, 16 megapixels, and at most 8,192 pixels on either edge.
  Larger files are rejected with instructions to resize a copy; output is not
  silently reduced.
- PNG/JPG/WebP/AVIF/BMP and first-frame GIF where browser decoding supports them.
  HEIC/HEIF requires browser decoding support; otherwise convert to JPG/PNG first.
- AI cutouts are estimates. Hair, glass, shadows, similar foreground/background
  colors, and busy groups may need further editing in ImageSplat.
- Static hosting requires HTTP(S); direct file URLs do not reliably run workers.
- Existing downloadable suite releases are not changed by a new web tool. Future
  packages that include `solutions/` include this tool and its local runtime.

## Verification commands

```sh
node --test tests/backdropsplat-pixels.test.mjs
BROWSER_EXECUTABLE_PATH=/usr/bin/google-chrome npx playwright test --config playwright.backdropsplat.config.cjs
# Optional real-model test, using a local photo:
BACKDROPSPLAT_REAL_AI=1 BACKDROPSPLAT_PHOTO=/path/to/photo.jpg BROWSER_EXECUTABLE_PATH=/usr/bin/google-chrome npx playwright test --config playwright.backdropsplat.config.cjs --grep 'real ORMBG'
node scripts/validate-tool-registry.mjs
node scripts/check-privacy-coverage.cjs
```

Pixel checks distinguish enclosed white, border-connected regions, existing
alpha, soft edges, source preservation, and bounds. Browser checks inspect actual
exported PNG/JPEG pixels and ZIP contents, cancellation/retry, disabled external
connections, invalid inputs, keyboard comparison, and mobile layout. The optional
photo test uses the real ONNX model and checks that outbound traffic is asset GETs.

## Verified October 22, 2026

Nine pixel/filename/bounds tests and eight Chromium workflows passed. Seven
Firefox workflows passed across the core and new keyboard/paste/discovery
checks. A real ORMBG run processed a 500 × 500 local image in the browser;
request inspection found only external asset GETs, with no image upload. A
separate Best selection verified the explicit Fast fallback on hardware without
compatible WebGPU/FP16. BEN2 inference on supported graphics hardware was not
available in this verification environment.

The suite navigation, wiki, naming, shortcut, and privacy regression checks were
also run. Guide and shortcut counts now include BackdropSplat. Existing author
files and unrelated local test artifacts were left untouched.

ImageSplat integration was verified with real ORMBG photo inference, PNG/JPEG
pixel inspection, unique ZIP filenames, two-layer atomic Apply and one-step Undo,
Undo/Redo, Cancel, stale settings, disabled optional connections, pending-download
cancellation, keyboard controls, and mobile layout. The existing ImageSplat text,
photo adjustment, clipboard, action icon, and Green Screen Studio checks passed.
