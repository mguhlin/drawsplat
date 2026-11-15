# Browser and desktop feature parity

GIFsplat, ImageSplat and QRSplat share their application scripts with SplatWorks Desktop. `splatworks/shared/project-files.js` provides the same versioned portable project format in both editions. Edit features here first, import the committed revision into `mguhlin/splatworks-desktop`, and run the browser/desktop source comparisons and bidirectional project tests before publishing both updates.

Save project / Open project preserve frames, timing, layers, text, canvas settings, QR content, styling and logos. Wi-Fi passwords are excluded from QR projects. Nothing is stored automatically. Browser saves request a download and retain the unsaved-work warning; native desktop saves await the filesystem write. Invalid projects and corrupt image imports preserve existing work.

ImageSplat uses the same background-removal engine in both editions. The desktop installer bundles the pinned default model and runtime; the browser downloads the model when requested. Optional desktop connections default off. Best-model downloads, configured editable QR services and online image backgrounds need explicit permission. Capture and recording use the available browser/webview APIs and still need physical-device validation.

FontSplat embedded in ImageSplat returns still PNG lettering. The standalone browser FontSplat retains its separate animation-export controls.
