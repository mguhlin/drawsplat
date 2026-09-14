These MP3, OGG (Vorbis), and M4A (AAC) fixtures are audio-only conversions of
`../../../shared/subtitles/tests/speech.mp4`, a short excerpt from John F.
Kennedy's 1961 inaugural address (a US federal government work). See that
fixture's README for attribution. They verify actual browser audio decoding;
most UI tests replace only the speech recognition worker.

# Synthetic fixture

`streamed.webm` is two seconds of a generated 160 × 90 test pattern and 440 Hz
sine wave, remuxed without a duration header to simulate streamed recordings.
It contains no user media.

Generated from VideoSplat's synthetic tone fixture:

```sh
ffmpeg -i ../videosplat/tests/fixtures/tone.webm -c copy -live 1 streamed.webm
```
