# ImageSplat photo adjustments

Select one visible image layer, then choose **Adjust photo…** in the canvas toolbar.
The Before and After previews let you compare brightness, contrast, saturation,
and warmth while keeping the canvas untouched. Reset clears the sliders; Cancel,
Close, or Escape discards the preview. Apply to layer saves the changes at the
image's original resolution, preserves transparency and placement, and adds one
undo step. Undo and redo work with the existing layer history.

Processing happens locally in the browser. Preview images are scaled to at most
700 pixels on their longest edge to keep slider updates responsive. Applying
uses the original pixels; the preview is never used as the export source.
Adjustments are baked into the selected layer on Apply, as with existing effects.

Inspired by PhotoCraft's live filter previews and reversible editing workflows:
https://github.com/storytold/photocraft. This is an independent implementation;
no PhotoCraft code, assets, or runtime dependencies are included.

Validation covers neutral and adjusted pixel values, alpha preservation, source
immutability, preview cancellation, apply, reset, undo, redo, and mobile layout.
The ImageSplat test configuration also includes the existing clipboard, legacy
URL, remove-color, and green-screen regression tests.
