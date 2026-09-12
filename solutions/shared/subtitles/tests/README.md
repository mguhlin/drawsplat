`speech.mp4` contains a short excerpt from John F. Kennedy's 1961 inaugural
address (a US federal government work), with a generated solid-color video.
Source audio: https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav
The fixture is used only by tests; it is not loaded by either app.

`long-speech.mp4` repeats the same excerpt four times to exercise chunk boundaries
and guard against transcript merging that drops legitimately repeated phrases.

`resume.mp3` repeats the same public-domain speech excerpt to create a longer
audio-only fixture for saved-progress, cancellation, and reload tests.

For the optional two-hour streaming check, generate a bounded-size fixture:

```sh
ffmpeg -f lavfi -i sine=frequency=440:sample_rate=16000:duration=7199 -c:a libmp3lame -b:a 32k /tmp/splat-two-hours.mp3
LONG_AUDIO_FIXTURE=/tmp/splat-two-hours.mp3 npm --prefix solutions/mediasplat run test:e2e
```

This check uses real streaming audio decoding and resampling with a mocked speech
worker. Separate opt-in model tests verify actual speech recognition.
