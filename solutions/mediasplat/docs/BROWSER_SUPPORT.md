# Browser and format support

Current desktop Chrome and Edge are the primary support tier. Firefox and Safari are best effort because WebAssembly memory limits, media-element preview codecs, download behavior, and service-worker support vary.

Processing support comes from the bundled FFmpeg core and is broader than preview support. Native browser preview usually covers MP4/H.264/AAC, WebM/VP8/VP9/Opus, MP3, WAV, and OGG, but exact support depends on the operating system and browser. AVI, WMV, OGM, MKV, FLAC, and older codecs may show **Process only** and can still be sent to FFmpeg.

Large files require enough available memory for the source, FFmpeg's virtual filesystem, and output. Keep the tab visible and use a desktop computer for long or high-resolution media. The current single-thread engine avoids requiring cross-origin isolation from every deployment host.

Fast joining requires the same stream count, codecs, resolution, frame rate/time base, and compatible container parameters. Use Normalize when these do not match. Normalize is slower and changes quality because it re-encodes.
