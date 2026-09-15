# Green Screen Studio

Open **Effects → Green Screen Studio…** (also under File and Capture). If exactly one image is selected, it becomes the initial subject. Otherwise choose a photo, use the native phone photo picker, or start a live camera.

## Compose a scene

1. Select **Background (back)** and choose the replacement background photo. It fills the output frame; use the size and position sliders to change its framing.
2. Select **Subject** and choose a green-screen photo or start the front/back camera. Click the source preview to sample the actual screen color. Adjust tolerance and edge smoothing. Green and blue presets are available.
3. Optionally select **Overlay (front)** for a logo, frame, or foreground image. Each layer has its own color-removal toggle and settings.
4. Use position, size, rotation, flip, and crop controls to arrange each layer. The source view offers an erase brush, restore brush, mask-stroke undo, and clear mask. Restore affects manual masks, while crop and color removal still apply. Optional spill suppression reduces excess green/blue, including on matching clothing.
5. Choose HD, Full HD, square, or portrait output. Empty areas can be transparent or filled with a chosen color.
6. **Save scene PNG** downloads the combined image at the selected dimensions. **Add scene to ImageSplat** adds the combined image as one new layer; the editor's Undo removes that layer. Both actions close the studio and stop the camera.

## Camera behavior

Live preview uses `getUserMedia` without microphone access. Freeze captures the current frame and releases camera tracks. Closing, leaving the page, switching/replacing the camera, and permission responses arriving after cancellation also release tracks. Camera permission errors keep photo upload and the native `capture="environment"` input available. Preview processing is limited to roughly 15 frames per second at up to 960 pixels on the longest side; PNG output uses the selected resolution. Actual performance depends on device and image complexity.

All processing is local. Source assets and layer adjustments live only for the open studio session. PNG output is flattened; save or add a scene before closing if you want to keep it. This version supports photos and live-camera still capture, not video import, video recording, timelines, or Do Ink project files.

## Validation

`npx playwright test tests/imagesplat-green-screen.spec.js tests/imagesplat-remove-color.spec.js tests/imagesplat.spec.js`

The studio tests cover scene PNG dimensions/pixels, layer ordering, chroma toggling, crop/position/scale, manual erase/restore/undo, adding a scene with editor Undo, camera denial fallback, live compositing with a synthetic camera stream, freeze/close cleanup, and late permission responses. Run on Chrome, Firefox, and mobile-emulated WebKit. A synthetic camera verifies the browser pipeline, not physical device camera behavior.

Reference workflow: https://www.doink.com/support
