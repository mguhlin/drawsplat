# Browser and desktop feature parity

The combined desktop preview includes fourteen apps. The [desktop guide](../wiki/desktop-apps.html) lists them, explains native saving and recording, and links to the current downloads. The six smaller standalone candidates have their own release and may contain an earlier snapshot; do not assume every combined-suite update is already in those downloads.

Desktop workspaces remain open when switching apps, but unsaved work stays in memory with no automatic recovery copies. Native saves wait for the write to finish; cancelled or failed saves keep work available for retry. Use browser editions for Google Drive and Calendar, and export ShowSplat WebDeck HTML for browser presentation. See the [office support matrix](https://github.com/mguhlin/splatworks-desktop/blob/main/docs/OFFICE.md) for format and chart limits.

GIFsplat, ImageSplat and QRSplat share their application scripts with SplatWorks Desktop. `splatworks/shared/project-files.js` provides the same versioned portable project format in both editions. Edit features here first, import the committed revision into `mguhlin/splatworks-desktop`, and run the browser/desktop source comparisons and bidirectional project tests before publishing both updates.

Save project / Open project preserve frames, timing, layers, text, canvas settings, QR content, styling and logos. Wi-Fi passwords are excluded from QR projects. Nothing is stored automatically. Browser saves request a download and retain the unsaved-work warning; native desktop saves await the filesystem write. Invalid projects and corrupt image imports preserve existing work.

ImageSplat uses the same background-removal engine in both editions. The desktop installer bundles the pinned default model and runtime; the browser downloads the model when requested. Optional desktop connections default off. Best-model downloads, configured editable QR services and online image backgrounds need explicit permission. Capture and recording use the available browser/webview APIs and still need physical-device validation.

FontSplat embedded in ImageSplat returns still PNG lettering. The standalone browser FontSplat retains its separate animation-export controls.
