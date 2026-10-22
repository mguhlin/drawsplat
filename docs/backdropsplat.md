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
6. Choose transparent, white, custom-color, or replacement-image output and download PNG or JPEG.
   JPEG always has a solid background; transparent + JPEG is flattened on white.
   A ZIP contains completed results with distinct filenames, including duplicates.

Changing cutout settings marks old results as out of date. Reprocess before
saving. Background and export-format changes reuse the existing cutout. Every
processing attempt starts from the original, so adjustments are not cumulative.
Cancel stops the worker; existing completed results remain available.

## Put your subject on a new background

In BackdropSplat, use **Choose a new background** below the image
preview. In ImageSplat, the same chooser appears inside **Effects → Background removal…**, below its previews. Choose from six locally shipped original illustrations:

- **Studio Paper**: warm paper and soft studio lighting.
- **Soft Lavender**: a quiet lavender and sky-blue wash.
- **Classroom Board**: deep green with chalk details around the edges.
- **Splat Confetti**: colorful splashes with room for the subject.
- **Mountain Morning**: layered mountains beneath a pale sky.
- **Coastal Calm**: blue water and warm sand.

You can also choose **Upload background**, or enter a direct HTTPS image link
and choose **Load image URL**. The cutout is composited over that image in the
preview and all PNG/JPEG/ZIP exports. The comparison switches to Result so you
can see the full composition. No additional background-removal run is needed.
You can select a backdrop before adding the subject, too.

**Fill frame** centers and crops the background to cover the subject image's
original dimensions. **Fit entire image** includes the entire backdrop with
white margins. The subject retains its size and position; every image in a batch
uses the selected backdrop. Choose Transparent to export the cutout alone again.
**Remove image background** releases the replacement; **Clear all** releases it
and all subjects. An unsuccessful or cancelled load keeps the previous backdrop.

Online images are downloaded directly by the browser. The image host receives
your image URL request and ordinary connection metadata, without your subject
image, account cookies, or a referrer. Online image fetches use no-store caching. The host must permit cross-origin browser
access (CORS); some image links or web pages do not. If a link fails, download the
image and upload a local copy instead. No third-party proxy is used. Optional
connections must be enabled to load an online background. Turning them off stops
an active online download; uploads, built-in scenes, and already loaded
backgrounds remain usable. Online requests time out after 30 seconds and can be
cancelled. Background files have the same 40 MB / 16 MP / 8,192-pixel bounds.

## Use the same engine inside ImageSplat

Select image layers in [ImageSplat](https://splatworks.org/imagesplat/) and choose
**Effects → Background removal…**. White and color menu shortcuts open the same
studio in the corresponding mode. Process, inspect before/after previews, and
apply all selected layers together. One Undo restores them all; Cancel and
exports leave layers unchanged. Layer positions and dimensions are preserved.
PNG/JPEG and ZIP downloads are also available. Upload a backdrop, choose the same six built-in scenes, or load a direct HTTPS image URL. Fill/Fit and the chosen backdrop are included in previews, exports, and layer Apply. One Undo restores the whole selection; closing the studio cancels pending background loads. The same worker, models, image loader, compositor, and optional-connections preference serve both apps.

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

Subjects, chosen replacement backgrounds, and results stay in tab memory until cleared or closed. The app does not
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
- Static release v3.1.45 includes BackdropSplat and the updated ImageSplat in the full DrawSplat and Tools packages. District suite v3.1.45 includes the complete ecosystem. Photo model files still download on first use; the browser engine and all six built-in backgrounds are shipped locally.

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

Replacement-background verification includes all six bundled scenes, uploaded
images, direct online URLs, no-credential/no-referrer requests, composited pixel
inspection in preview/PNG/JPEG/ZIP, centered Fill/Fit placement, unchanged
foreground cutouts, failed-load recovery, privacy changes, cancellation, bounds,
clearing, and mobile layout. Both BackdropSplat and ImageSplat now provide these replacement-background controls. ImageSplat adds selected-layer Apply, complete-selection Undo/Redo, and cancellation when its studio closes.

## Language picker

BackdropSplat’s header now includes the same six-language picker as the other
suite tools: English, Spanish, Vietnamese, Arabic, Chinese, and Hindi/Urdu.
Arabic uses right-to-left layout; image pixels and the comparison slider retain
their original orientation. The language preference is shared with the suite,
survives reloads, and supports `?lang=es` links. Switching languages preserves
loaded images, cutouts, background choices, and download readiness. Interface
translations are provided; native-speaker review is pending.
