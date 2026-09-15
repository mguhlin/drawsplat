# Green screen with video

## Imported video or image clips

1. Import the background video/image and the green-screen subject video.
2. Place the background on an earlier track in the track list and the subject on a later track. Later tracks draw in front. Align their timeline start times and durations so the background covers the keyed footage.
3. Select the subject clip. In the Clip inspector, enable **Green screen → Remove green / blue screen**.
4. Choose green, blue, or another screen color. Adjust tolerance and edge smoothing. Optional spill reduction suppresses excess green/blue and can affect matching clothing.
5. Play or scrub to inspect the result. Existing position, size, rotation, opacity, fit, transitions, trimming, and audio controls remain available.
6. Use **File → Export video…** to render the scene with sound. The selected export format receives the same keyed composition. WebM is browser-native; other formats use the existing local conversion path.

Clip settings are non-destructive and saved with autosave and `.videosplat.json` project copies. Uncheck the effect or use Undo to restore the original appearance. Native MLT interchange does not translate this filter to a third-party editor. Exported video is a flattened composition; uncovered areas use the project background, rather than an alpha-channel video.

## Camera recording

Open **Record video**, choose **Camera only** or **Screen + camera overlay**, and enable the same green-screen controls before starting. Upload a **Virtual background image** to replace the screen. With no replacement image, the shared screen (camera overlay) or black recording background shows through.

The recording preview and saved recording use the keyed camera frames. Microphone and shared audio continue through the existing audio mix. Green-screen mode does not load the person-segmentation model. When it is off, choosing a virtual background retains the existing automatic person-background replacement.

Settings are fixed when recording starts. For adjustable keying after recording, record the original footage without the effect, then key its timeline clip. Video replacement backgrounds are supported on the timeline; the recorder's replacement upload accepts still images.

## Performance and verification

Everything is processed locally. Preview keying uses at most 960 pixels on the source's longest side and avoids reprocessing unchanged paused frames. Export processes frames at up to the output's longest dimension. Fine edges can differ between the reduced preview and exported resolution. Keep the tab visible for composition recording/export; lower resolution helps slower devices. Existing browser and codec limitations still apply.

Checks: `npm test`, `npm run build`, and `npm run test:e2e -- green-screen.spec.ts app.spec.ts recorder-interruption.spec.ts media-processing.spec.ts`.

Tests include color thresholds, soft alpha, blue spill, disabled effects, normalized/serialized settings, actual video-on-video export with audible audio, and actual encoded camera output with a replacement image using simulated camera streams in Chromium and Firefox. Physical cameras are not covered by these automated checks.
