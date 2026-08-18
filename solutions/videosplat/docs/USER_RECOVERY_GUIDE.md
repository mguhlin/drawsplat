# Project and media recovery

VideoSplat autosaves projects and imported media in this browser profile. If a tab
closes unexpectedly, reopen VideoSplat and use **Open** to restore the local project.
Use **Save copy** regularly to download a portable project manifest.

The manifest records edits but does not embed original media. Keep source files in a
separate backed-up folder. If a restored or imported project reports missing media,
re-import the matching originals; VideoSplat uses local identifiers and content
hashes where possible to reconnect them.

If export stops, the partial result is discarded and the saved project remains
unchanged. Free browser/device storage, keep the tab in the foreground, choose a
smaller export, and retry. The export preflight reports missing media, unsafe storage
headroom, invalid ranges, and browser capability problems before rendering.

Clearing site data, using the in-app clear-data control, deleting the browser
profile, or storage eviction can remove autosaves and media. That action cannot be
undone by VideoSplat. A downloaded project copy plus the original media is the
recovery boundary.
