# Browser legacy QuarkXPress decoder

The bundled libqxp 0.0.3 decoder reads QuarkXPress 3.1–4.1 documents/templates
in a browser worker. Later QuarkXPress files remain unsupported. Source text,
supported vectors and frame geometry become editable; source bytes are retained
as `originalQuark`. Linked-story metadata, text paths, hyphenation, external
pictures and advanced effects require review. This is experimental interchange.

[Upstream source](https://dev-www.libreoffice.org/src/libqxp/), matching 0.0.3
archive and MPL-2.0 notice accompany this directory. The source archive includes
the upstream test corpus. LibreOffice's release adds memory safety fixes.
`source/librevenge-0.0.5.tar.xz` supplies matching librevenge source.
Its MPL/LGPL notices, ICU 68.2, Boost 1.83.0, zlib 1.3.1 and Emscripten runtime
notices are in the adjacent `../publisher/` directory. The drawing adapter is
GPL-3.0-only, derived from LayoutSplat's existing Publisher adapter.

Rebuild with Emscripten 4.0.22 installed/activated:

```
python3 splatworks/layoutsplat/quark/build.py /path/to/emsdk
```

The script checks archive hashes, extracts them into a temporary build directory,
and uses the shipped adapter. Path-prefix mappings remove temporary build paths.
Emscripten installs the pinned library ports on first use. The decoder uses the
adjacent Publisher `unicode-data.dat` (all legacy converters retained); it does
not need a second language-data copy. Refresh the runtime manifest only after
reviewing rebuilt artifacts and running the native browser tests.

Input: 32 MB. Event output: 64 MB / 100,000 events. WebAssembly ceiling: 512 MB.
A 45-second timeout or cancellation terminates the dedicated worker. No upload,
desktop conversion app or QuarkXPress license is needed for supported imports.
