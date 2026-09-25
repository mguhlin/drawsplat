# DrawSplat v3.1.26 — Recording fixes and current downloads

Released September 24, 2026. All thirteen self-host ZIPs are refreshed from current source. Package versions are independent of whiteboard v3.1.12 and individual app versions.

## VideoSplat

- Read encoded WebM timestamps even when the browser reports a finite but incorrect short duration.
- Warn when saved video is substantially shorter than active recording time or cannot be verified.
- Download original recordings from review, including after import failure. Select an item in Media and choose **File → Download original media** to recover source bytes from an existing project without timeline edits.
- Import videos above 512 MB using bounded-memory SHA-256 hashing. Browser memory/storage still limit practical sizes; audio/image import and caption limits are unchanged.
- Preserve the original bytes when a full-frame crop is requested.

The reported native twenty-minute unplayable capture was not available for inspection. Controlled duration failures are fixed, but this release does not claim to restore missing frames or prove all physical-device recording failures resolved. Existing clips are not automatically lengthened.

## Also included since v3.1.25

Touch PDF handwriting/signing, permission-based tab/window capture to PDF, GPU-assisted English captions with CPU fallback, and accelerated VideoSplat WebCodecs export with compatible fallback. GPU support and performance depend on the device/browser. Current whiteboard, portable MySQL saving, media tools, shared runtimes, and module dependencies remain included.

## New standalone PDFSplat package

PDFSplat now has its own ZIP with the editor, touch signing, scan/capture tools, PDF.js worker, PDF-Lib, JSZip, Argon2, shared menus, language controls, and hosting instructions. It remains included in Tools and full DrawSplat. The download page separates complete packages, individual apps, the office suite, and smaller collections.

## Downloads

Full DrawSplat; SplatWorks suite; individual GridSplat, ShowSplat, WriteSplat, and ListSplat; Tools, Widgets, and Games; AudioSplat, VideoSplat, MediaSplat, and PDFSplat. Verify all thirteen ZIPs against `SHA256SUMS-v3.1.26.txt`. Previous releases remain available unchanged.

Finish recording/exporting and save project copies before updating. Install matching module versions and preserve private server configuration. MySQL requires a separately deployed API/database.

## Validation

105 VideoSplat unit tests, 78 Chrome/Firefox integration checks including a playable twenty-minute, 513 MB import/reopen fixture, and two additional byte-identical original-media download checks. The large fixture is padded with an MP4 free box; it is not a twenty-minute live screen-capture soak. Packages are checked for ZIP integrity, SHA-256 checksums, current VideoSplat assets, source provenance, and shared runtime references before publication.
