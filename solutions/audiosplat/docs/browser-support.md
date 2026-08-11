# Browser support

AudioSplat uses feature detection for `getUserMedia`, `MediaRecorder`, Web
Audio, OfflineAudioContext, Canvas, IndexedDB, Blob downloads, and service
workers. The supported target is current and previous Chrome/Edge, Firefox,
and Safari, including ChromeOS and current iPadOS/iOS Safari.

Recording MIME type preference is Opus in WebM, Opus in Ogg, then MP4, followed
by the browser's MediaRecorder default. Import depends on the browser's native
`decodeAudioData` codecs. WAV export is project-owned 16-bit PCM and does not
depend on a browser encoder.

Real-device validation remains required for microphone permissions, Bluetooth
and USB input changes, Safari recording formats, long recordings, and storage
quota behavior.
