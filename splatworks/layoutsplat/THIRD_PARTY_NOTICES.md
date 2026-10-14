# LayoutSplat bundled components

LayoutSplat application source is GPL-3.0-only; see `COPYING`. Components retain
their respective licenses. No operating-system or imported publication fonts are
redistributed.

| Component | Use | Source / notices |
| --- | --- | --- |
| ProseMirror and dependencies | Rich story editor | MIT notices in `vendor/licenses/`; rebuild with `scripts/build-layoutsplat-rich.mjs` using WriteSplat's locked dependencies |
| libmspub + librevenge | Browser-native Publisher decoder | Source archives, build instructions, patch, and licenses in `publisher/` |
| ICU, Boost, zlib, Emscripten | Publisher runtime | Notices and pinned build versions in `publisher/BUILD.md` |
| libheif-js 1.23.5 | HEIC/HEIF decoder | LGPL-3.0 notices in `vendor/`; matching wrapper, build, and library source archives in `vendor/source/` |
| ag-psd 31.0.3, pako, base64-js | Photoshop composite decoder | MIT notices in `vendor/`; [ag-psd source](https://github.com/Agamnentzar/ag-psd) |
| FFmpeg JavaScript wrapper | Local image/video conversion | MIT notice in `vendor/ffmpeg/`; existing MediaSplat FFmpeg core, source/license notices under `solutions/mediasplat/` |
| ExcelJS | Local workbook merge data | MIT notice in `vendor/exceljs.LICENSE` |
| pdf-lib | PDF proofs | MIT notice in `vendor/pdf-lib.LICENSE.md` |
| html2canvas 1.4.1 | Raster page export | MIT notice in root `vendor/html2canvas.LICENSE` |
| PDF.js, JSZip | PDF pictures and portable ZIP files | Shared root `vendor/` runtime and existing repository notices |
| Liberation, DejaVu, Noto | Portable typefaces and script fallbacks | Font files, manifests, and individual licenses in `fonts/` |

The unchanged HEIF wrapper source is revision
`d8ec4bc3bc5bf8055975577bccbbc7e1d7313c2d` of catdad-experiments/libheif-js.
Its decoder build is libheif-emscripten `v1.23.5`, using strukturag/libheif revision
`413e2a87e6a70b3eccc3a3adc5801179dd2d9e00`. The included build scripts identify
codec dependencies and rebuilding steps. The decoder is a replaceable ES module;
LayoutSplat does not restrict use of modified builds.
