# Browser binary Word decoder

Antiword 0.37 is a separate GPL-2.0-or-later program, by A.J. van Os
(see the upstream man page license). Original copyright notices and COPYING
accompany the decoder.
Source is from the Debian archive, with Debian 0.37-17 patches applied:

- https://deb.debian.org/debian/pool/main/a/antiword/antiword_0.37.orig.tar.gz
- https://deb.debian.org/debian/pool/main/a/antiword/antiword_0.37-17.debian.tar.xz
- https://sources.debian.org/src/antiword/0.37-17/

Both matching source archives are included. `browser-formatting.patch` retains
explicit normal/bold/italic/underline/strike flags, source font families, font
sizes, palette colors, native list numbers, and paragraph before/after/left/right/
first-line indents and alignment in the decoder's XML. This XML is an internal
interchange format. Native line leading, floating pictures, fields and advanced
Word layout are not fully retained. Original upstream paragraph/table extraction
remains bounded by the runtime and application limits.

The unchanged Emscripten 4.0.22 toolchain and its MIT runtime notices are pinned.
Toolchain source: https://github.com/emscripten-core/emscripten/tree/4.0.22
The package does not include or require a desktop Word or LibreOffice application.

Rebuild (Python 3.12+, `patch`, and emsdk 4.0.22):

```
python3 splatworks/shared/word-legacy/build.py /path/to/emsdk
```

`SHA256.json` pins matching source and the checked runtime outputs. Source archives,
patch, worker/controller and build script accompany standalone distributions.
The worker's virtual filesystem contains only its embedded resources and the
chosen document. Input is at most 20 MB, output XML at most 8 MB, memory is capped
at 256 MB, and decoding is terminated after 45 seconds. The adapter ignores the
known decoder-generated DocBook DTD and otherwise rejects entity declarations.
Desktop LibreOffice was used only to create a private test variant from a user's
DOCX. That converted file is not distributed or needed by the browser runtime.

The small-stream normalizer uses SheetJS CFB 1.2.2 and bundled CRC-32 1.2.1,
Apache-2.0. The original npm source archive, including the unminified browser
implementation, and license accompany `compound-file.mjs`. The only upstream
browser-file change is an appended ES module export. A short WordDocument stream
is padded in a new in-memory container, so Antiword can read its big-block layout;
original Word stream bytes and the selected file are not changed. Header sector
counts, stream sizes and entry counts are bounded. Source:
https://github.com/SheetJS/js-cfb and
https://registry.npmjs.org/cfb/-/cfb-1.2.2.tgz.
