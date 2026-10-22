# v3.1.45 — BackdropSplat and ImageSplat replacement backgrounds

October 22, 2026.

- BackdropSplat: local photo cutouts (ORMBG Fast / optional BEN2 Best), white/color removal, edge/all-pixel matching, comparison, zoom, and batch exports.
- Both tools: upload a replacement background, choose Studio Paper, Soft Lavender, Classroom Board, Splat Confetti, Mountain Morning, or Coastal Calm, or load a direct HTTPS image URL. Centered Fill/Fit and the shared compositor drive preview and PNG/JPEG/ZIP exports without repeating removal.
- ImageSplat: preview selected layers, apply their compositions together, restore all with one Undo, or Cancel without editing the document. Closing the studio cancels pending background loads.
- BackdropSplat: visible six-language picker, shared language preference, Arabic RTL, and language changes that preserve source images and cached cutouts. Native-speaker review is pending.
- Privacy: local uploads and scenes work with optional connections off. Online background requests omit credentials/referrers, never contain subject pixels, and stop on cancellation, timeout, or privacy revocation. A failed load keeps the previous background.
- Documentation: new SplatWorks blog walkthrough, updated wiki, feature catalogue, download cards, package sizes, and portable checksums.

The full DrawSplat and Tools downloads include the tools, browser runtime, and six scenes. The complete district suite is refreshed as v3.1.45. Other standard packages are rebuilt with their existing app behavior and shared resources.

Photo models download on first use (Fast 44 MB; Best 219 MB plus the 22 MB browser engine). Best requires compatible WebGPU/FP16 and falls back visibly to Fast. Image URL hosts must permit browser cross-origin access; save/upload a local copy if blocked. Inputs are limited to 40 MB, 16 megapixels, and 8,192 pixels per edge. Cutouts are estimates; inspect fine edges and transparent subjects.
