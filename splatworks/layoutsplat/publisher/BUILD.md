# Browser Publisher decoder

LayoutSplat v0.5.0 reads Microsoft Publisher files inside a dedicated browser worker.
There is no LibreOffice installation, server process, or external conversion upload.
The decoder produces bounded drawing events; `publisher.mjs` converts those events
to the validated publication model. The original PUB bytes remain in the project.

This is interchange. Check substituted fonts, linked-frame flow,
graphics, fields, effects, and older text encodings against the original. The File
menu's Publisher import settings allow explicit legacy encodings. The separate
`../publisher-binary.mjs` and `../publisher-export.mjs` modules write
Publisher 2000 binary publications locally; see `../../../docs/layoutsplat.md` for
editable features, picture fallbacks, native-payload recovery and validation limits.

## Sources and licenses

- `source/libmspub.tar.gz`: LibreOffice libmspub source archive, MPL-2.0.
  [Upstream](https://github.com/LibreOffice/libmspub).
- `source/librevenge-0.0.5.tar.xz`: librevenge 0.0.5, MPL-2.0 / LGPL alternatives.
  [Upstream](https://sourceforge.net/projects/librevenge/).
- `adapter.cpp`: LayoutSplat's GPL-3.0-only drawing-event adapter.
- Emscripten 4.0.22, ICU 68.2, Boost headers 1.83.0, zlib 1.3.1.
  Their notices are included in this directory. `SHA256.json` pins the distributed
  source archives, worker, Unicode data, and generated decoder artifacts.

The build script applies these source changes to the supplied libmspub archive:

- `layoutsplat_pub_encoding()` overrides legacy encoding selection when requested.
- OfficeArt picture crop properties (0x0100–0x0103, signed 16.16 fractions) are
  collected and emitted as `layoutsplat:crop-*` attributes for bitmap-filled shapes.
- Empty complex gradient stop arrays fall back to the recorded endpoint colors.
- Master pages are emitted once, with source master IDs on assigned pages, instead
  of painting static copies into each normal page. Blank pages are retained.
- Text objects expose source text IDs. The application links repeated IDs only
  when text and supported formatting agree, and reports the inferred frame order.

Both `scripts/build-layoutsplat-publisher.py` and the distributed `build.py` contain
these patches. The upstream source archives remain unchanged. Crop fields follow
[Microsoft's OfficeArt format](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-odraw/ef3b1918-4b34-45d2-9b3c-ee1776669c49).

## Rebuild from the repository

1. Prepare Emscripten 4.0.22 at `.tmp/layoutsplat-publisher-wasm/emsdk`, install and
   activate its embedded SDK, and source its `emsdk_env.sh`.
2. Extract the two supplied library archives below `.tmp/layoutsplat-publisher-wasm/`.
   They create `libmspub-master` and `librevenge-0.0.5` directories.
3. Run `python3 scripts/build-layoutsplat-publisher.py` from the repository root.
   Emscripten downloads the pinned ICU, Boost, and zlib ports on its first build.
4. Run `python3 scripts/build-layoutsplat-unicode.py
   .tmp/layoutsplat-publisher-wasm/emsdk/upstream/emscripten/cache/ports/icu/icu/source/data/in/icudt68l.dat
   splatworks/layoutsplat/publisher/unicode-data.dat` as one command.
5. Run the Publisher Playwright checks and refresh `SHA256.json` for changed outputs.

The subsetting script retains all legacy converters, alias data, Unicode case and
property data, normalization, and root/English resources. It does not change their
contents. Runtime decoding is limited to 32 MB input, 100,000 events, a 512 MB WASM
memory ceiling, and a 45-second worker timeout. Cancellation terminates the worker.

`build.py` is a copy of the repository build script for source distribution; use
the repository script at its original path to rebuild. The compiler and source
trees are build dependencies only and are excluded from the web application.
