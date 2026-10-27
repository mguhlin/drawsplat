# FontSplat: lettering, SpellArt, and glitch text

Open [FontSplat](https://splatworks.org/fontsplat). Text and font files are
processed on your device. No generation account, external font service, or
text-upload backend is used.

Choose one of 16 original looks: Splat shine, Neon nights, Chrome studio,
Liquid gold, Retro print, Comic pop, Rainbow ribbon, Sunset glow, Outline only,
RGB glitch, Ice lettering, Ink stamp, Dimensional, Sticker cutout, Satin gradient,
or Soft shadow. Change text, typeface, colors, weight, italic, letter spacing,
outline, depth, arch, rotation, and slant. Use up to eight text lines.

Download a PNG with a transparent or colored background at 1×, 2×, or 3×,
a scalable SVG with its typeface embedded, or an editable `.fontsplat.json`
project. SVG can optionally pulse its opacity; PNG and app insertions are still
images. Raster exports are limited to 16 megapixels. Custom font files are
limited to 6 MB; use fonts whose license allows embedding and sharing.

The Unicode glitch panel has separate Above, Through, and Below controls,
Shuffle marks, Copy glitch text, and Copy plain text. Enable Use glitch marks in
artwork to include those marks in PNG/SVG. Combining marks vary by font and
reader; lower the sliders for lighter lettering. Keep a plain-text description
for accessibility.

In LayoutSplat use the FontSplat · SpellArt toolbar button. In WriteSplat and
ImageSplat use Insert → FontSplat · SpellArt. The same editor opens inside the
app. Use in document inserts a PNG; it does not rewrite surrounding text.
WriteSplat/LayoutSplat retain the plain text as the picture description.
Save a FontSplat project to retain editable lettering controls separately.

The effects are original implementations. They do not call Cool Text or
FontGlitch APIs or include those services' artwork, fonts, or code.

![FontSplat lettering studio](../assets/fontsplat-guide/studio.png)

## SpellArt shapes, pictures and motion

The feature formerly labeled WordArt is now **SpellArt**. Enter up to eight lines (400 characters); press Enter for a new line. Shape buttons offer text-only, banner, ribbon, oval, circle, badge and rounded backgrounds. Change shape fill/edge colors separately from lettering. Circle keeps a square canvas. Shapes remain part of editable saved projects and SVG/PNG output.

Use **Add image**, drop pictures onto the preview, or paste a clipboard picture while the preview is focused. Up to six PNG/JPEG/WebP/GIF pictures can be added; GIF input uses a still frame. Imports are rasterized locally and reduced to a maximum 2048-pixel edge. Choose a picture, drag it in the preview, or adjust horizontal/vertical position, width, opacity, rotation and layer. Choose “In front” to place it above the text/shape. Pictures embed in project files, PNG and SVG exports. Project loading validates local raster data and limits embedded sizes; SVG picture uploads and remote image URLs are not accepted.

**Animated GIF** prepares a two-second looping pulse with a preview and download link. **MP4 video** renders three pulse cycles (six seconds) as H.264/yuv420p video with the selected background color. It loads the bundled FFmpeg converter only when requested. Both render locally, retain picture layers and shapes, and pulse the text from full opacity to 60% and back. Motion exports fit within a 960-pixel edge and 600,000 pixels per frame. GIF uses indexed colors and ordered transparency dithering to approximate partial opacity; choose a solid background for smoother GIF edges. MP4 has no alpha channel. PNG and document insertions remain still images; SVG retains its pulse animation. Cancel is available while encoding.
