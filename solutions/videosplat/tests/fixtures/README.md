# Synthetic media fixtures

`tone.webm` contains two seconds of FFmpeg's generated `testsrc2` pattern
(160 × 90, 15 fps) and a 440 Hz sine wave. It contains no user recording.

Generate it with:

```sh
ffmpeg -f lavfi -i testsrc2=size=160x90:rate=15 \
  -f lavfi -i sine=frequency=440:sample_rate=48000 -t 2 \
  -c:v libvpx -b:v 100k -c:a libopus tone.webm
```
