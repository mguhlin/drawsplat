# v3.1.43 — LayoutSplat v0.6.0 ebooks

October 16, 2026. LayoutSplat adds EPUB 2/3 import and EPUB 3 export, three
original ebook starters, metadata, heading-based contents and a searchable reading
preview. Text size and Paper/Sepia/Night themes help review a book before export;
the existing visual rich-text editor handles story changes.

Choose File → Templates → Ebooks, File → Ebook tools, File → Import → EPUB,
or File → Export → EPUB ebook. Reflowable output contains selectable rich text,
packaged pictures and tables in reading order. Fixed-layout output preserves
selected pages as pictures. Source XHTML/CSS layout is repaginated on import;
DRM and unsupported active content are not imported. Keep the native project
for complete editing. See the [ebook guide](../../docs/layoutsplat-ebooks.md).

The visible Publisher export label now says native export in all six languages.
Conversion reports retain specific format limits. Text rendered as bitmap
fallbacks now avoids an incorrect native-paragraph write, fixing PUB export for
RTL/decorative text. Microsoft Publisher itself remains an external validation
step; the independently verified LibreOffice workflow is unchanged.

All 77 Chromium workflows and three focused Firefox checks passed. Three actual exports (reflowable, illustrated,
and fixed layout) passed upstream EPUBCheck 5.4.0 with zero errors or warnings.
Native model tests cover all 126 templates in six publication languages; the
template layout proof also passed. Updated packages include the ebook guide.

Reader/editor workflow research included Sigil, PageEdit, epub.js, Foliate.js and
InkWeave. The feature implementations use LayoutSplat's existing editor and ZIP
tooling; these projects are not bundled as dependencies. Full XHTML/CSS source
editing, preserved footnotes/annotations/media overlays, broad reader validation
and accessibility certification remain future work.
