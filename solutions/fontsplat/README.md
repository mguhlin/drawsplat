# FontSplat

Original local lettering and SpellArt generator. Open `/solutions/fontsplat/`
or `/fontsplat`. See [the guide](../../docs/fontsplat.md).

Application source follows the repository's GPL-3.0-only license. The shared
iframe insertion bridge is MIT, consistent with `splatworks/shared/LICENSE.txt`.
No Cool Text or FontGlitch assets, fonts, code or APIs are included. The example
names describe original effect implementations.

Local bundled typefaces are under `splatworks/layoutsplat/fonts/`; their Liberation,
DejaVu and Noto license files remain there. SVG export embeds the selected font;
PNG export renders it to pixels. User-imported font rights remain the user's.

SpellArt now supports eight text lines, seven shape choices, six embedded pictures, a looping GIF and H.264 MP4 export. See [the full guide](../../docs/fontsplat.md) for controls, local processing, limits and portable project saving. The MP4 converter is the locally bundled FFmpeg runtime shared with MediaSplat; its notices remain included with that runtime.
