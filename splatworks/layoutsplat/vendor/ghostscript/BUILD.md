# Browser PostScript/EPS decoder

The shipped `gs.js` and `gs.wasm` are from **@jspawn/ghostscript-wasm 0.0.2**.
`gs.mjs` is the same JavaScript with `export default Module;` appended to allow
module imports. No changes to the WebAssembly binary are made. See `LICENSE`
for GNU AGPL-3.0 terms. Local EPS conversion runs in a disposable browser worker;
no server or desktop Ghostscript installation is used.

Matching wrapper source and build scripts:
[ghostscript-wasm at 385cb08a95a2b5671f3357024700708c319645f8](https://github.com/jsscheller/ghostscript-wasm/tree/385cb08a95a2b5671f3357024700708c319645f8).
Its submodules pin GhostPDL/Ghostscript to
`00f6bd069221701d054abc67909e80ff61561d75` at
[the Ghostscript source repository](https://git.ghostscript.com/?p=ghostpdl.git;a=commit;h=00f6bd069221701d054abc67909e80ff61561d75),
and zlib to `21767c654d31d2dccdde4330529775c6c5fd5389`.
Clone the pinned wrapper revision recursively, follow its README/build scripts
with the specified Emscripten toolchain, and replace both generated runtime files.
Alternatively extract the pinned npm archive, retain its license, and append the
module export to a copy of `gs.js`. `SHA256.json` identifies the shipped artifacts.

Input is bounded to 32 MB. Conversion uses `-dSAFER`, a first-page limit,
300 ppi maximum and a 40 megapixel/6000-pixel edge ceiling. DOS EPS headers are
validated and stripped before processing. Timeout/cancellation terminates the
worker. Supported PostScript variants produce flattened artwork, not editable
PostScript objects.
