# BackdropSplat

A focused SplatWorks background remover. Open `/backdropsplat/` (or the direct
`/solutions/backdropsplat/` address) on SplatWorks.org or DrawSplat.org.

- Photo subject cutouts with ORMBG and optional BEN2; explicit Fast fallback.
- Immediate white/color removal without a model download. Edges preserves
  enclosed matching regions; All also removes logo openings.
- Upload, drag/drop, or paste; original/result comparison; zoom; color sampling.
- Full-size PNG/JPEG with transparent, white, custom-color, or replacement-image backgrounds.
- Upload a background, choose one of six original built-in scenes, or load a direct HTTPS image URL. Centered Fill / Fit controls; preview and batch ZIP share the same compositor.
- Sequential batches and ZIP downloads with distinct filenames.
- Worker cancellation, bounded inputs, unchanged original files, and local
  processing. No account, API key, photo upload, or saved-image database.

Limits: 20 files per batch, 40 MB per file, 16 megapixels, and an 8,192-pixel
maximum edge. Supported formats depend on browser decoding. GIF uses its first
frame; HEIC/HEIF needs native browser support or a JPG/PNG conversion first.

Fast downloads a pinned 44.3 MB ORMBG model; Best uses 219.1 MB BEN2 and needs a
compatible WebGPU adapter with FP16 support. The local engine adds about 22 MB.
Downloads begin only after requesting Photo processing. Browser model caching
is subject to quota and eviction; white/color processing has no remote dependency.

Run locally from the repository with `python3 -m http.server 8000`, then open
`http://localhost:8000/solutions/backdropsplat/`. File URLs cannot reliably run
module workers. HTTPS or localhost is required for optional browser capabilities.

See [dependency/model notices](THIRD_PARTY_NOTICES.md), the
[design and implementation notes](../../docs/backdropsplat-design.md), and
[verification guide](../../docs/backdropsplat.md).

## Replacement backgrounds

After removing the original background, use **Choose a new background** below
the preview. Upload your own image, pick Studio Paper, Soft Lavender, Classroom
Board, Splat Confetti, Mountain Morning, or Coastal Calm, or enter a direct HTTPS
image URL and choose **Load image URL**. These six SVG illustrations are original
artwork shipped locally under the repository license; no stock-image provider is
used. They also work when optional external connections are disabled.

The cutout is painted over the chosen background. **Fill frame** centers and
crops the backdrop as needed; **Fit entire image** shows it all with white
margins. Output dimensions and subject placement stay unchanged. A replacement
is shared by all batch images and appears in the preview and PNG/JPEG/ZIP output.
Changing it reuses the cutout, without running a model again. Use Transparent to
recover the cutout alone, **Remove image background** to release the backdrop,
or **Clear all** to release subjects and the replacement image.

Online images are fetched directly by the browser with no credentials, referrer,
or subject-image data. Their hosts receive the download request and connection
metadata. The host must support browser cross-origin access (CORS). There is no
image proxy; if a link cannot load, download the image and upload it instead.
Only HTTPS is accepted; 40 MB, 16 megapixels, and 8,192 pixels per edge apply.
Downloads can be cancelled, time out after 30 seconds, and stop when optional
connections are disabled. A failed or cancelled load keeps the previous backdrop.
Chosen background images remain in tab memory until replaced, removed, or closed.
