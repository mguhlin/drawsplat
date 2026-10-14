# ImageSplat

**Current documentation:** [SplatWorks Wiki](https://drawsplat.org/wiki/) — setup, installation, licensing, pricing, OAuth, and district privacy review.


ImageSplat edits screenshots and images locally with layers, annotations, cropping, background tools, clipboard actions, and exports. Current packaged release: **v3.1.31**, included in complete DrawSplat and Tools. There is no separate ImageSplat ZIP. [Downloads](../../pages/download.html).

Select one image layer, then choose **Adjust photo…**. Brightness, contrast, saturation, and warmth controls include presets and a before/after preview. Apply updates only that image; Undo restores the original. Cancel leaves it unchanged. Photo adjustments run on local pixels and do not upload the image.

Common actions use icons with visible labels. Existing layer editing, crop, PNG/selection/clipboard export, animation, and background-removal controls keep their behavior. The legacy SplatImage URL redirects to this tool.

[October 9 release notes](../../docs/release-notes/RELEASE_NOTES_v3.1.31.md). Verification: the ImageSplat photo-adjustment and labelled-action checks in the root Playwright icons configuration.

New text boxes start empty; paste or type only the text you want. To change an existing text layer, double-click its text on the canvas or its name in Layers, choose **Edit → Edit selected text**, or press Enter with one text layer selected. The dialog restores its wording and formatting; **Save changes** updates the same layer, Cancel leaves it unchanged, and Undo restores the prior text and styles.

Green Screen Studio offers a named camera picker and remembers the chosen device for the tab. Starting the same camera in another ImageSplat studio tab freezes the older preview into a still image and releases its camera tracks; different selected cameras can stay live. Other websites remain subject to browser/device camera sharing, with a retry and clear recovery guidance if access is blocked.
