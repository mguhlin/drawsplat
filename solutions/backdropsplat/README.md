# BackdropSplat

A focused SplatWorks background remover. Open `/backdropsplat/` (or the direct
`/solutions/backdropsplat/` address) on SplatWorks.org or DrawSplat.org.

- Photo subject cutouts with ORMBG and optional BEN2; explicit Fast fallback.
- Immediate white/color removal without a model download. Edges preserves
  enclosed matching regions; All also removes logo openings.
- Upload, drag/drop, or paste; original/result comparison; zoom; color sampling.
- Full-size PNG/JPEG with transparent, white, or custom-color backgrounds.
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
