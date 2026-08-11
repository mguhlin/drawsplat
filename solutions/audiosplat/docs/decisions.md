# AudioSplat Architecture Decisions

## 0001. Original static TypeScript application

AudioSplat is an original Vite and TypeScript application, not an embedded
service or a port of Wavacity/Audacity. It uses browser media APIs and has no
required backend or runtime CDN.

## 0002. Non-destructive source and clip model

Imported and recorded sources are immutable. Timeline clips reference a source
with a start time, source offset, and duration. Split and trim operations change
clip metadata and remain reversible.

## 0003. Native browser audio stack

V1 uses `getUserMedia`, `MediaRecorder`, Web Audio, Canvas, IndexedDB, and local
WAV encoding. MIME support is detected at runtime. AudioWorklet PCM capture can
be introduced after the compatibility prototype without changing the project
model.

## 0004. Timeline direction

The application shell follows the active writing direction. Timeline time
always increases left-to-right, including in Arabic, because that convention is
fundamental to audio editing. Track text and controls still follow RTL layout.

## 0005. Overlapping clips

Clips may overlap and are summed through their track gain and master output.
The master meter warns about clipping; AudioSplat does not silently normalize.
