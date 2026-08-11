# Browser support

AudioSplat uses feature detection for `getUserMedia`, `MediaRecorder`, Web
Audio, OfflineAudioContext, Canvas, IndexedDB, Blob downloads, and service
workers. The supported target is current and previous Chrome/Edge, Firefox,
and Safari, including ChromeOS and current iPadOS/iOS Safari.

Recording MIME type preference is Opus in WebM, Opus in Ogg, then MP4, followed
by the browser's MediaRecorder default. Import depends on the browser's native
`decodeAudioData` codecs. WAV export is project-owned 16-bit PCM and does not
depend on a browser encoder.

After microphone permission is granted, AudioSplat lists the browser's exposed
audio-input devices and remembers the selected input. If Firefox, Android, or
iOS rotates a stored device identifier, AudioSplat falls back to the browser's
default input instead of failing. Recorded buffers are checked for a measurable
signal; silent input produces corrective guidance rather than reporting a
successful recording.

Real-device validation remains required for microphone permissions, Bluetooth
and USB input changes, Safari recording formats, long recordings, and storage
quota behavior.
