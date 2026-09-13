# ONNX Medium vs Large v3 Turbo: browser test

Date: 2026-09-12 (America/Chicago). Test machine: Intel Core i7-10700KF, 32 GB RAM, Linux. Browser: Google Chrome 153.0.8010.36.

Temporary production-built Vite harness copied the apps’ shared speech worker and cue-processing code. Both models used Transformers.js 3.8.1, WASM CPU, one thread, q8, enableCpuMemArena=false, enableMemPattern=false. Turbo was added only to the harness registry. This benchmark ran independently of production; a subsequent app integration adds Turbo with explicit English transcription.

Pinned model revisions:
- Medium: onnx-community/whisper-medium.en_timestamped @ 475d02b986111e8e2d28206d82e64bb820f5c6db
- Large v3 Turbo: onnx-community/whisper-large-v3-turbo_timestamped @ b3f77bf9a8c4d5ea3415827033d1ffea7955fd9a

The first MP3 run for each model includes model download/loading. M4A and long MP3 reuse the loaded model. No transcript/checkpoint reuse occurs; each test runs inference. Models run sequentially on the same browser, with the worker terminated between models. One run per condition; these are observations, not statistically established speed differences.

| Model | Fixture | Audio seconds | Download/load seconds | Inference seconds | Token edits / reference words | Valid timings |
|---|---|---:|---:|---:|---:|---|
| turbo | speech.mp3 | 11.01 | 21.59 | 54.66 | 0/22 | Yes |
| turbo | speech.m4a | 11.01 | 0.00 | 53.41 | 0/22 | Yes |
| turbo | long.mp3 | 44.02 | 0.00 | 110.47 | 0/88 | Yes |
| medium | speech.mp3 | 11.01 | 44.15 | 34.32 | 0/22 | Yes |
| medium | speech.m4a | 11.01 | 0.00 | 34.01 | 0/22 | Yes |
| medium | long.mp3 | 44.02 | 0.00 | 77.26 | 1/88 | Yes |

Medium added a trailing `[Applause]` sound annotation on the repeated fixture. The simple scorer counts that as one insertion because the speech-only reference excludes annotations; it is not evidence of a spoken-word error. Both models recovered all 88 spoken words.

Word error scoring ignores case and punctuation and uses edit distance. Reference: the familiar 22-word Kennedy excerpt in the existing public-domain test fixture. The 44-second fixture repeats it four times, exercising section boundaries; it is not a broader accuracy dataset. These checks validate ordered non-overlapping bounded cue times, not manually annotated alignment accuracy.

## Full transcripts

### turbo / speech.mp3

And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country.

### turbo / speech.m4a

And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country.

### turbo / long.mp3

And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country. And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country. And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country. And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country.

### medium / speech.mp3

And so my fellow Americans, ask not what your country can do for you, ask what you can do for your country.

### medium / speech.m4a

And so my fellow Americans, ask not what your country can do for you, ask what you can do for your country.

### medium / long.mp3

And so my fellow Americans, ask not what your country can do for you, ask what you can do for your country. And so my fellow Americans, ask not what your country can do for you, ask what you can do for your country. And so my fellow Americans, ask not what your country can do for you, ask what you can do for your country. And so my fellow Americans, ask not what your country can do for you, ask what you can do for your country. [Applause]
