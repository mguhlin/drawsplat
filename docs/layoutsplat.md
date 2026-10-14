# LayoutSplat: publications, templates, and file exchange

LayoutSplat v0.2 is the SplatWorks publication editor. [Open LayoutSplat](../splatworks/layoutsplat/).
Create flyers, brochures, newsletters, business cards, catalogs, greeting cards,
labels, posters, menus, invitations, certificates, and other publications locally
in your browser. The interface shares the suite's Apps launcher and original six
language choices.

## Start with a template

Choose **Template library** in the top menu. Browse 270 original editable designs:
18 industries × 15 publication types. Filter by industry, type, orientation, or
search; choose the publication language and palette. **Download this collection**
saves the filtered templates as JSON files in a ZIP. Extract it before opening an
individual template. The seven quick-start categories remain under File → Templates.

These are independently created designs. They do not contain StockLayouts files,
artwork, or copy. Replace the sample text, merge placeholders, and picture frames
with your own material. A local illustration fills picture placeholders.

## Edit and arrange

Use rulers in inches, centimeters, picas, points, or pixels. **File → Page layout** offers
custom dimensions, margins, columns, rows, baseline guides, ruler origins, bleed,
safe insets, guide locking, and facing-page preview. Unit and zoom changes preserve
the publication's physical measurements.

Text stories flow through linked frames. Select a frame to change font, size,
color, bold, italic, underline, alignment, direction, tracking, columns, drop caps,
AutoFit, and WordArt effects. The rich editor applies formatting to selections.
AutoFit can shrink to a minimum size; Grow overflowing frame is an explicit action.
Continue on next page adds another linked frame. Picture wrapping is rectangular;
drop caps are suppressed in wrapped frames and the checker explains that limit.

Shift-click for multiple selection; group, align, distribute, resize, rotate, lock,
or change stacking. **Shapes** opens one picker for rectangles, ellipses, lines,
hexagons, triangles, arrows, stars, hearts, callouts, border art, and custom paths.
More tools includes tables, drawing, watermarks, and a format painter. Each layer
has a transparency slider: 0% is opaque and 100% is transparent. The selected
object also has a transparency control in Properties; locked layers cannot change.
**Preview** and **Design checker** are under File. Masters hold reusable background objects and
support page assignments, left/right variants, editing, and local hidden-object
overrides. Creating a master moves the chosen objects into it.

## Right-click imports

Right-click an object for actions relevant to it. Mac Control-click or Command-click
and Shift+F10 also open the menu. Text frames offer import, append, paste, rich
editing, and continuation. Pictures offer replacement, crop, watermark, and motion
preview. Replacing content preserves the existing frame's size, position, and rotation.

Text imports support TXT, Markdown, CSV/TSV text, HTML text, DOCX, ODT, and WriteSplat
JSON. Word imports retain supported direct character formatting; page layout,
pictures, headers, and document tables are not placed through this text-frame action.

## Open Publisher and other layout files

Choose **File → Open project** for `.pub`, `.layoutsplat`, `.layoutsplat.json`, SVG,
IDML, Scribus SLA, interchange ZIPs, LayoutSplat HTML, or PDF.

Microsoft Publisher decoding runs inside a bundled WebAssembly worker. It does
**not require LibreOffice**, a desktop helper, or a conversion service. Supported
text, graphics, and embedded pictures become editable objects; the original PUB
is retained with the project. This import is experimental: review fonts, older
encodings, effects, fields, and linked text against the source. If old text is
garbled, choose its encoding under **File → Publisher import settings** and reopen.
There is no native PUB export. Files are limited to 32 MB and decoding times out
after 45 seconds; Cancel terminates the decoder.

JSON is the lossless native exchange format. SVG, IDML, and SLA support a useful
subset of external documents. LayoutSplat's own interchange exports include a
native payload for faithful reopening. IDML/SLA packages include links and a
conversion report; sophisticated effects may be flattened. Target InDesign/Scribus
application fidelity has not been certified. Keep originals and compare conversions.
PDF imports place a selected page as a picture, with non-editable text.

## Images and video

Browser image formats, TIFF, HEIC/HEIF, and Photoshop composite previews have local
decoding paths. Additional image/container formats are attempted through the
bundled FFmpeg converter. Support depends on the actual codec and file variant;
the file picker is broader than a guarantee that every variant will decode.
Layered, multi-page, HDR, and color-profile content can be flattened.

MP4/WebM and supported browser videos play locally. Containers such as AVI and MOV
can be converted to MP4/H.264 when supported. Video and animation retain a picture
poster for print/PDF and play in interactive HTML. File imports are limited to
96 MB; raster pictures to 40 megapixels. Import failures preserve the publication.

## Exchange SplatWorks content

Use **File → Import SplatWorks content** to place native WriteSplat, ShowSplat,
GridSplat, or ListSplat JSON content in a LayoutSplat publication. Ordinary Open
still routes another app's JSON file to that app in an isolated draft.

WriteSplat imports become linked text frames with supported character formatting.
ShowSplat imports become publication pages. Spreadsheet/database values become
editable tables split across pages with repeated headers. Charts, database
relationships, cell styles, and formulas are not evaluated or reconstructed.

Export & share offers native JSON for the same four apps. WriteSplat receives
complete text stories; ShowSplat receives editable slide elements; GridSplat and
ListSplat receive publication tables. The included conversion warnings explain
omitted content. These formats serve different document models and are not a
lossless substitute for saving the original LayoutSplat project.

## Mail merge

Choose local CSV, TSV, or XLSX data, select a worksheet, map headers to `{{fields}}`,
filter records, and preview. Check every record before generating publications.
Labels fill consecutive slots across sheets. Generated publications contain the
personalized values; the recipient source table is not saved with the template.
Generation supports up to 500 pages per batch.

## Save, print, export, and share

Save creates a portable `.layoutsplat` ZIP; Export & share → LayoutSplat JSON makes
an explicit editable JSON file. Both preserve stories, masters, assets, and rich
formatting. Browser autosave and previous-draft recovery remain device/browser/domain
specific. Download backups regularly, especially before moving to SplatWorks.org.

Print / Save as PDF preserves browser-shaped selectable text and vectors. The
dedicated downloadable PDF is a high-resolution flattened proof. PNG/JPEG offer
150/300/600 ppi; PDF proofs can include bleed, crop marks, trim boxes, and an ICC
output intent. Page ranges apply to visual exports; native project and desktop or
SplatWorks interchange exports contain the full publication.

HTML exports include fixed-layout media and a separate reading edition. Shared
files are prepared before a second Share click invokes device sharing. Unsupported
devices download the file. Email preview prepares a draft; attach the downloaded
file yourself. Nothing is sent automatically.

Pack and Go gathers JSON, HTML, a reading edition, PDF proof, pictures, motion media,
bundled licensed fonts, printer specifications, and checker findings. Its optional
Ghostscript helper converts a proof with a printer-supplied CMYK profile and checks
PDF/X-3 structure independently. Neither an ICC output intent nor these structural
checks constitutes exhaustive PDF/X certification; obtain printer approval.

## Deployment and remaining work

Serve the repository over HTTP(S); `file://` is unsupported. Runtime fonts, media
decoders, and the Publisher worker are bundled locally. Publisher/media codecs
download only when used. Updated source suite packages must include the shared
MediaSplat FFmpeg runtime. Previously published download ZIPs retain their contents
until rebuilt; the live application and GitHub source receive this update first.

The [progress log](../splatworks/layoutsplat/PROGRESS.md) and
[approved plan](../splatworks/layoutsplat/IMPLEMENTATION_PLAN.md) track further
wrapping/typography fidelity, external interchange validation, larger-document
performance, stronger print preflight, and refreshed district release packaging.
[Bundled-library notices](../splatworks/layoutsplat/THIRD_PARTY_NOTICES.md).
