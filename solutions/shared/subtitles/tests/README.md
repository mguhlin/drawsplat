`speech.mp4` contains a short excerpt from John F. Kennedy's 1961 inaugural
address (a US federal government work), with a generated solid-color video.
Source audio: https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav
The fixture is used only by tests; it is not loaded by either app.

`long-speech.mp4` repeats the same excerpt four times to exercise chunk boundaries
and guard against transcript merging that drops legitimately repeated phrases.
