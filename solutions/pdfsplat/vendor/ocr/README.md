# Local PDFSplat OCR runtime

Pinned Tesseract.js 7.0.0 and Tesseract.js-core 7.0.0 (Apache-2.0), plus English and Spanish 4.0.0_best_int language data from @tesseract.js-data/eng and /spa 1.0.0 (Apache-2.0). Model gzip archives are decompressed to .traineddata; the worker uses gzip:false. The six .wasm.js core builds include their WebAssembly bytes; separate .wasm files are unnecessary for this browser build. Engine, core and models are served from this same directory; no CDN or document upload is used. IndexedDB model caching is disabled.

Upstream: https://github.com/naptha/tesseract.js · https://github.com/naptha/tesseract.js-core · https://github.com/naptha/tessdata

Reproduce with npm pack tesseract.js@7.0.0 tesseract.js-core@7.0.0 @tesseract.js-data/eng@1.0.0 @tesseract.js-data/spa@1.0.0. Copy the dist runtime/worker, all six core .wasm.js files, and the two decompressed 4.0.0_best_int traineddata files. SHA256.json records source package integrity and local asset hashes. See the adjacent Apache-2.0 license files. OCR requires HTTP(S) workers: use the bundled local launcher rather than file://.
