# ADR 0002: Local video optimization and proxy media

Status: accepted for implementation after core timeline editing.

VideoSplat will include an offline **Optimize video** workflow available both before a
file is added to a project and as a standalone shrinker. Optimization never
overwrites the source. It creates a user-downloadable compressed copy or a local
working proxy linked to the source asset by content hash.

Presets will prioritize understandable outcomes:

- **Editing proxy:** 720p, fast decode, moderate bitrate, keyframes suited to seeking.
- **Smaller share copy:** preserve dimensions where practical, lower target bitrate.
- **Tiny review copy:** 480p, aggressive bitrate reduction.
- **Custom:** maximum dimensions, target bitrate, frame rate, audio bitrate, and
  optional audio removal.

The preflight must show source size, estimated output size, codec support, available
device storage, and the fact that processing is local. The first encoder will use
WebCodecs plus a same-origin muxer. A same-origin FFmpeg.wasm adapter may provide a
fallback. No codec, model, or WASM binary may be loaded from a CDN at runtime.

Project clips retain source-relative timing. A proxy record stores source asset ID,
settings, duration, dimensions, codec, and local blob ID. Export may use the original
for quality or the proxy when the user explicitly chooses faster/lower-quality output.

The 512 MB import cap is temporary until hashing, decoding, and encoding are chunked
in workers. The optimizer should accept larger file handles without copying the
whole source into JavaScript memory where browser APIs allow it.
