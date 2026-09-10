# DrawSplat v3.1.24 — See your export progress

Released September 10, 2026.

MediaSplat and VideoSplat show animated purple progress bars, actual percentages,
elapsed time, and estimated remaining and total stage time in minutes or hours.
Estimates appear after enough progress is available and adapt to measured speed.
Stale progress hides the estimate and shows a waiting message. Animation alone
indicates a responsive interface, not guaranteed encoder progress.

- MediaSplat subtitle burn-in measures encoded time against the video duration.
  Progress reaches 100% when the output is ready.
- VideoSplat shows timeline rendering and MP4/OGM conversion as separate stages,
  each with its own percentage and estimate. Elapsed time covers the entire job.
- VideoSplat cancellation releases rendering and terminates active conversion.
  Repeated conversions use fresh progress callbacks, including recorded WebM
  sources without a usable header duration. Settings are disabled during export.
- Both apps retain automatic English captions, caption editing, SRT/VTT import,
  and local subtitle burn-in from v3.1.23.

Estimated total stage time = elapsed stage time / completed fraction. Remaining
stage time = estimated total minus elapsed. Estimates are approximate and vary
with resolution, encoding settings, device speed, and browser workload.
VideoSplat timeline rendering runs in real time, with conversion afterward.

All twelve self-host ZIPs are refreshed with SHA-256 checksums. Standalone
VideoSplat/MediaSplat, Tools, and full DrawSplat include the new interfaces.
Keep the included runtime folders together. Refresh an open app after any
current export finishes to load the new interface.

Validation: VideoSplat’s 62 unit tests and three browser checks passed, including
subtitle burn-in, audio failure reporting, cancellation and repeated MP4 exports.
MediaSplat progress was verified with a real MP4 burn-in and estimate tests.
