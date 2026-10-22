# ImageSplat

**Current documentation:** [SplatWorks Wiki](https://drawsplat.org/wiki/) — setup, installation, licensing, pricing, OAuth, and district privacy review.


ImageSplat edits screenshots and images locally with layers, annotations, cropping, background tools, clipboard actions, and exports. Current packaged release: **v3.1.31**, included in complete DrawSplat and Tools. There is no separate ImageSplat ZIP. [Downloads](../../pages/download.html).

Select one image layer, then choose **Adjust photo…**. Brightness, contrast, saturation, and warmth controls include presets and a before/after preview. Apply updates only that image; Undo restores the original. Cancel leaves it unchanged. Photo adjustments run on local pixels and do not upload the image.

Common actions use icons with visible labels. Existing layer editing, crop, PNG/selection/clipboard export, and animation controls keep their behavior. The legacy SplatImage URL redirects to this tool.

[October 9 release notes](../../docs/release-notes/RELEASE_NOTES_v3.1.31.md). Verification: the ImageSplat photo-adjustment and labelled-action checks in the root Playwright icons configuration.

New text boxes start empty; paste or type only the text you want. To change an existing text layer, double-click its text on the canvas or its name in Layers, choose **Edit → Edit selected text**, or press Enter with one text layer selected. The dialog restores its wording and formatting; **Save changes** updates the same layer, Cancel leaves it unchanged, and Undo restores the prior text and styles.

Green Screen Studio offers a named camera picker and remembers the chosen device for the tab. Starting the same camera in another ImageSplat studio tab freezes the older preview into a still image and releases its camera tracks; different selected cameras can stay live. Other websites remain subject to browser/device camera sharing, with a retry and clear recovery guidance if access is blocked.

## BackdropSplat background removal

Select one or more image layers and choose **Effects → Background removal…**.
This replaces the previous external smart-cutout loader with the same local
worker and pinned models used by [BackdropSplat](../backdropsplat/).

- **Photo subject**: Fast ORMBG or Best BEN2, with a visible Fast fallback on unsupported devices. First use downloads model assets; image pixels are processed on the device.
- **White background**: remove white around a subject or every matching white pixel, including enclosed logo and lettering centers.
- **Colored background**: click the original to sample, or use the color picker; adjust tolerance and soft edges. Matching regions can be limited to those connected to any image border.
- Process up to 20 selected layers. Before/after previews, layer selection, and zoom help check each result. Changing cutout settings requires reprocessing.
- Choose transparent, white, or custom output backgrounds. Download full-resolution PNG, solid JPEG, or a ZIP with distinct names. JPEG transparency is flattened on white; selecting JPEG never changes how transparency is applied to layers.
- Apply updates all selected image layers atomically, preserving placement and dimensions. One Undo restores them all. Cancel and downloads leave layers unchanged. Stop terminates the worker and keeps completed previews available.

**Remove color…** and **Remove white / edge background…** open this same studio
in the corresponding mode. Green Screen Studio remains available separately.
White/color processing requires no external connection. Photo processing honors
the suite’s optional-connections preference, including stopping active work when
connections are disabled. Limits: 16 megapixels and 8,192 pixels per edge.

Guide: [Background removal](../../docs/backdropsplat.md). Browser regression
checks live in `tests/imagesplat-background.spec.mjs` and run with
`playwright.backdropsplat.config.cjs`.
