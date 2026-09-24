# Live tool updates — September 23, 2026

These updates are live on drawsplat.org and in current source. Initially newer than the v3.1.25 downloads, they are now included in the September 24 v3.1.26 packages.

## PDFSplat

- Finger, stylus, and mouse handwriting stays active across strokes. Color, width, stroke undo, and Done drawing controls support signing directly on the document.
- Drawing mode captures touch gestures; leaving it restores scrolling. The phone editing panel hides to give the page more space.
- Pointer identity and cancellation handling avoid stray marks from interrupted or secondary touches.
- Corrected drawing proportions on rectangular pages; exported PDF ink retains its position and round stroke ends.
- Capture to PDF supports desktop tab/window capture. Captures are local image-only pages, limited to 20 at a maximum 2,200-pixel longest edge. The URL/print workflow has been removed; unsupported browsers show a capture availability message.

## MediaSplat and VideoSplat

- Automatic English captions detect usable WebGPU adapters, with CPU compatibility mode and CPU retry after GPU failure.
- Completed transcript checkpoints survive fallback. Local GGML files remain CPU-based.
- GPU model downloads differ from CPU variants; the interface shows estimates and backend status. No media or transcript upload is introduced.
- VideoSplat Auto export tries hardware-preferred then software WebCodecs encoding, with direct supported WebM/MP4 output, mixed audio, and compatibility fallback.
- Software and Compatible export choices remain available. OGM stays on the compatible path. Cancellation does not trigger another export.
- MediaSplat FFmpeg trim/join/burn-in operations are unchanged.

## Checks and limits

PDF changes passed 44 cross-browser regression checks, a touchscreen gesture check, and subsequent focused/live checks including iPhone emulation and saved-PDF pixel validation. Media checks covered transcription backend selection, fallback/checkpoints, video dimensions/duration/audio, cancellation, and live export. Physical device touch testing and physical NVIDIA speed benchmarks remain unverified.

GPU support is browser/driver-dependent and does not guarantee higher speed. Caption limits remain 120 minutes and 512 MB per source; available memory can impose smaller practical limits.

[Feature walkthrough](../../blog/touch-signing-media-acceleration.html) · [Acceleration implementation and limits](../media-acceleration.md) · [PDFSplat guide](../../solutions/pdfsplat/README.md)
