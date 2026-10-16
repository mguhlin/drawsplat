# LayoutSplat bundled components

LayoutSplat application source is GPL-3.0-only; see `COPYING`. Components retain
their respective licenses. The distribution supplies licensed bundled fonts; local user-imported fonts are
embedded only in that user’s saved projects and exports.

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


## Additional v0.3 components

- **Ghostscript WebAssembly**, `@jspawn/ghostscript-wasm` 0.0.2, AGPL-3.0.
  The license, pinned source links, build instructions, hashes, and the only wrapper
  change accompany the decoder in `vendor/ghostscript/BUILD.md`.
- **Avery label geometry data** comes from LibreOffice's label database, revision
  `baddf594428a2e6cb011d3e1c710f380ec02d594`, under the LibreOffice MPL-2.0 /
  Apache-2.0 licensing terms. Source and product URLs accompany every stock record
  in `label-stocks.json`. Dimensions are converted from hundredths of millimeters
  to points; selected US nominal dimensions are normalized to exact inch fractions.
  Avery is a product compatibility reference; its logos or commercial designs are
  not included. See `docs/layoutsplat-labels.md` for the stock list and adjustments.

The legacy Pages XML parser and artwork import adapters are LayoutSplat source.
They do not bundle Apple, Adobe, Quark, or Microsoft desktop applications.

## Native suite merge (v0.4)

HyperFormula 3.3.0 (GPL-3.0-only), Chevrotain 6.5.0 (Apache-2.0),
regexp-to-ast 0.4.0 (MIT), and tiny-emitter 2.1.0 (MIT) calculate native
GridSplat recipients. Matching source, license notices, pinned versions and
rebuild instructions accompany `vendor/suite-data/BUILD.md`. ListSplat
calculations use the ecosystem's GPL application sources.

## Browser binary Word import (v0.4.2)

Antiword 0.37 with Debian 0.37-17 patches (GPL-2.0-or-later), Emscripten
4.0.22 runtime notices, and SheetJS CFB 1.2.2 / bundled CRC-32 1.2.1
(Apache-2.0) accompany `splatworks/shared/word-legacy/`. Matching source,
the formatting patch, build script, licenses and SHA-256 manifest are included.
The decoder runs in a separate browser worker; short compound streams are
normalized in memory without changing the chosen file.

## Browser legacy QuarkXPress import (v0.4.4)

libqxp 0.0.3 (MPL-2.0), librevenge 0.0.5 and their matching source archives
accompany `quark/`. The GPL-3.0-only drawing adapter, pinned build script and
runtime hashes are included. ICU, Boost, zlib and Emscripten notices are shared
with the adjacent `publisher/` directory. Supported native input is QuarkXPress
3.1–4.1; no desktop application is required. Newer files remain unsupported.

## Publisher export (v0.5.0)

The browser Publisher 2000 writer and bitmap-only WMF reader are LayoutSplat
GPL-3.0-only application source. The writer reuses the unmodified SheetJS CFB
1.2.2 / CRC-32 1.2.1 Apache-2.0 runtime and notices under
`splatworks/shared/word-legacy/`. The native record implementation follows the
reverse-engineered libmspub readers (MPL-2.0 source supplied in `publisher/source/`);
it does not bundle or require Microsoft Publisher. Container/image structures use
[MS-CFB](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/) and
[MS-WMF](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-wmf/).
