# BackdropSplat dependencies and models

BackdropSplat’s interface and color-removal implementation are original
SplatWorks code. The Utilz background-removal workflow was a product reference;
no Utilz code, text, or design assets are included.

## Locally hosted browser runtime

- **Transformers.js 3.8.1**, Hugging Face, Apache-2.0.
  Source: https://github.com/huggingface/transformers.js/tree/3.8.1
  Distribution: https://registry.npmjs.org/@huggingface/transformers/-/transformers-3.8.1.tgz
  License: [Apache-2.0](vendor/LICENSE-transformers.txt).
- **ONNX Runtime Web 1.22.0-dev.20250409-89f8206ba4**, Microsoft, MIT.
  Source: https://github.com/microsoft/onnxruntime/tree/89f8206ba4
  Files: `ort.bundle.min.mjs`, `ort-wasm-simd-threaded.jsep.mjs`, and
  `ort-wasm-simd-threaded.jsep.wasm`.
  [License](vendor/LICENSE-onnxruntime.txt) and
  [third-party notices](vendor/ThirdPartyNotices-onnxruntime.txt).
- **@huggingface/jinja 0.5.3**, bundled within Transformers.js, MIT.
  Source: https://github.com/huggingface/transformers.js
  [License](vendor/LICENSE-jinja.txt).
- **JSZip**, the suite’s existing local `../../vendor/jszip.min.js`, MIT or
  GPL-3.0-or-later at the recipient’s option. BackdropSplat uses it under MIT.
  Source and license: https://github.com/Stuk/jszip

The runtime files are unmodified upstream distributions. Their SHA-256 values
are recorded in [vendor/checksums.json](vendor/checksums.json). Optional model
downloads do not send image pixels to a server.

## Downloaded on request, not included in the site repository

**Fast: ORMBG**, Maximilian Schirrmacher, Apache-2.0.

- Source: https://github.com/schirrmacher/ormbg
- Model: https://huggingface.co/onnx-community/ormbg-ONNX
- Pinned revision: `034e2d884afbab897e10e78fc5bb566b29533fd6`.
- File: `onnx/model_quantized.onnx` (`q8`).
- License: [Apache-2.0](vendor/LICENSE-ORMBG.txt).

**Best quality: BEN2**, Prama LLC, MIT.

- Source: https://github.com/PramaLLC/BEN2
- Model: https://huggingface.co/onnx-community/BEN2-ONNX
- Pinned revision: `c552aa82688edce09f0ac9d2e31ad53d9d629010`.
- File: `onnx/model_fp16.onnx`.
- License: [MIT, Copyright (c) 2025 Prama LLC](vendor/LICENSE-BEN2.txt).

Downloads come from Hugging Face and its file-delivery hosts. Those hosts
receive connection metadata such as IP address and requested model path. They
do not receive the selected photos. Browser Cache Storage may retain public
model files, subject to browser capacity, eviction, and privacy clearing.
