# LayoutSplat: publications, templates, and file exchange

LayoutSplat **v0.4.1** is the SplatWorks publication editor.
[Open LayoutSplat](https://splatworks.org/splatworks/layoutsplat/).
Create precise publications locally in your browser. The original six-language
picker and shared Apps launcher remain available. DrawSplat remains the whiteboard
and its existing tools; SplatWorks is the ecosystem brand.

## Templates

Choose **File → Templates**. Browse all designs or jump to Avery labels/name badges,
business cards, or menus. There is one template library, with **123 distinct editable compositions**
and six publication-language editions. Filter by industry, publication type,
orientation, palette, or search. Descriptive card titles identify the design;
industry remains a filter. Download a filtered collection as JSON files in a ZIP.

The library includes **12 menu compositions**, including
café, fine dining, diner, bistro, pizza, bakery, tapas, Asian, coastal, farm, buffet,
and hotel layouts. Business cards have six compositions and replaceable logo
examples. Other publications also include appropriate branding examples. The
SplatWorks example logo can be replaced from its picture context menu.
Each counted design has different object geometry. Color and industry variations
are customizations, not additional designs. The catalog includes eight flyers
(two with ten vertical name/phone tear-off tabs and dotted cutting lines), eight
brochures (four trifold and four bifold), six newsletters, six resumes, six photo
collages, and six document layouts. Fold guides distinguish equal Z-folds from
roll folds with a narrower fold-in flap. Templates use editable original geometry;
private Canva and StockLayouts references provided visual inspiration, without
copying their artwork or distributing the supplied reference PDFs.

**File → Templates → Whiteboard backgrounds & images** opens 96 shared classroom
organizers, ScratchArt backgrounds, coloring pages and animal pictures. Place a
locked page background, an ordinary picture, or fill a selected unlocked picture
box. Images are embedded in saved projects and can be undone or replaced. The
standalone package includes the collection for offline use.

**29 Avery sheet geometries cover 127 product codes**, including US Letter and A4,
address/shipping/return labels, file-folder labels, and insert/adhesive name badges.
Search a product number; label cards lead with Avery stock numbers rather than
industries. **File → Label sheet & printer alignment** adjusts horizontal/vertical
printer offsets and the first unused label. Merge fills remaining slots and then
new sheets. Print at actual size, without browser headers/footers or scaling.
[Stock list and measurements](layoutsplat-labels.md).

## Page layout, objects, and text

**File → Page layout** controls page size, margins, columns, rows, baseline guides,
ruler origins, bleed, safe insets, and facing pages. Rulers support inches,
centimeters, picas, points, and pixels. Units/zoom do not change physical geometry.
Preview, Print / Save as PDF, and Design checker are also grouped under File.

The **Edit story** window has bold, italic, underline and paragraph alignment
buttons. Select words before applying inline formatting; drag the title bar to
move the window. Applying edits preserves mixed fonts, paragraph spacing, blank
paragraphs and indents, and supports undo.

Text flows through linked boxes. Shift-select two or more boxes, right-click,
and choose **Link text boxes**. Unlink splits the chain while retaining text and
formatting. A single-box link action lets you choose a target. Continue on next
page adds another frame. Supported rich text includes bold, italic, underline,
columns, drop caps, AutoFit, alignment/direction, WordArt, and format painting.

Properties offer **serif/sans-serif selection, font metrics kerning or no kerning,
letter spacing (tracking), word spacing, horizontal text scale, ligatures, and
line spacing**. **File → Import → Fonts** accepts local TTF, OTF, WOFF, and WOFF2.
Imported fonts are embedded in native saves and portable HTML, and included in
Pack and Go. Limits: 16 MB per font, 16 fonts and 64 MB total. Import fonts you
are entitled to use. Exact fonts improve metrics, but paragraph composition and
unsupported effects can still differ between programs.

**Shapes** contains rectangles, ellipses, lines, hexagons, arrows, custom paths,
and other shapes. Group, align, distribute, rotate, lock, and reorder objects.
Layers have transparency sliders: 0% opaque to 100% transparent. Tables, drawing,
watermarks, border art, and masters provide reusable publication elements.
Picture wrapping is rectangular; wrapped drop caps remain a checker limitation.

Right-click, Mac Control/Command-click, or Shift+F10 opens contextual actions.
Import/append text into a text box or replace media in a picture box while keeping
its geometry. DOCX and ODT imports retain supported font sizes/colors, bold/italic/underline,
source list numbering, paragraph leading, spacing and indents. Named/default
styles and OpenDocument automatic styles are resolved locally. Append preserves
existing paragraph formatting. Available imported font families are matched before
fallbacks; the report identifies actual substituted fonts or unsupported styles.
Text imports support TXT, Markdown, CSV/TSV, HTML text, DOCX, ODT,
and WriteSplat JSON; document tables and page layouts are not placed through this
text-box action.

## Open versus Import

**File → Open LayoutSplat project** restores this editor's native JSON, `.layoutsplat`
ZIP, or exported HTML with its native payload. **File → Import** offers alphabetically
named source formats and converts them into LayoutSplat objects or page artwork.
Native JSON is the lossless format; other applications use different document models.

| Source | Import behavior |
| --- | --- |
| Microsoft Publisher `.pub` | Browser WebAssembly decoder; supported editable text, shapes, bitmap fills, crops, gradients, and embedded pictures; retains source bytes |
| Apple Pages `.pages` | Legacy ZIP/XML documents are parsed locally with text, geometry, paths, styles, and embedded pictures; modern IWA documents require another export |
| Adobe Illustrator `.ai` | PDF-compatible files become high-resolution page artwork; supported PostScript artwork uses the local converter |
| PDF | All supported pages become correctly sized high-resolution artwork, with noneditable text |
| EPS / PostScript | Local Ghostscript WebAssembly produces first-page flattened artwork; no desktop installation |
| SVG | Supported editable objects; complex effects may need flattening |
| InDesign IDML / Scribus SLA | Editable supported subsets and linked assets in packages; external application validation remains |
| Native InDesign INDD/INDT / Quark QXP/QXD | Native decoding unavailable; use IDML (InDesign), SVG, or PDF. Import errors preserve the current project |
| SplatWorks content | WriteSplat stories, ShowSplat pages, GridSplat/ListSplat tables from their native JSON |

Publisher conversion does **not require LibreOffice**, a server, or uploads.
File → Import → Publisher import settings handles legacy encodings. Input is bounded
to 32 MB, with a 45-second timeout and worker cancellation. No native PUB writer.
Preserved crops, paragraph leading/alignment, bitmap fills, and text scaling improve
accuracy. Compare source fonts, composition, and unsupported effects before printing.
[Accuracy findings and remaining work](layoutsplat-import-accuracy.md).

## Images, video, and suite exchange

Local decoding covers common browser images, TIFF, HEIC/HEIF, PSD composites,
and supported EPS/PS. Other image/video containers are attempted through bundled
FFmpeg; actual codec and file variant determine support. Layered, multipage, HDR,
and color-profile material may be flattened. Media input is bounded to 96 MB;
raster pictures to 40 megapixels. Videos retain a print poster and can play in HTML.

File → Import → SplatWorks content places native WriteSplat, ShowSplat, GridSplat,
and ListSplat content. File → Export offers those four apps' native JSON. Text stories,
slides, and tables are converted; formulas, charts, relationships, and all cell
styles are not reconstructed. The conversion report describes omissions.
Opening another app's JSON through ordinary project handoff opens that app in an
isolated draft. Saving the LayoutSplat original remains the lossless backup.

## Merge, saving, and output

Mail merge reads local CSV, TSV, XLSX, and native GridSplat/ListSplat JSON.
Choose a worksheet or table. GridSplat formulas and number formats use its actual
calculation engine; ListSplat calculations use its own formula syntax, with hidden
fields and archived records excluded. Formula errors stop that data source rather
than printing incorrect recipients. Map fields, filter, preview,
and check records before generation. Labels span sheets and skip used positions.
Recipient source tables are not saved in generated templates. Batches are bounded.

Save produces a portable `.layoutsplat` ZIP. **File → Export** offers native JSON,
fixed-page HTML, an HTML reading edition, PDF proofs, high-resolution PNG/JPEG,
SVG, IDML, Scribus SLA, suite content, and Pack and Go. Visual exports support
page ranges; native and interchange projects contain the publication.

**Print / Save as PDF** preserves browser-shaped selectable text and vectors.
The downloadable PDF proof is flattened. Print preparation includes bleed, crop
marks, trim boxes, ICC output intents, and 150/300/600 ppi image output. Pack and Go
collects the project, media, fonts, HTML editions, proof, checker findings, and
printer instructions. Its optional Ghostscript helper offers PDF/X-3 conversion
with structural checks; exhaustive PDF/X certification and printer acceptance
remain separate validation work.

**File → Clear saved browser data** clears this workspace's draft/recovery and undo,
then reloads a blank publication. Cancel preserves the current work. Other apps'
drafts and downloaded projects remain available. Browser drafts are specific to
browser/device/domain: save a project before moving from DrawSplat.org to SplatWorks.org.

## Installation and roadmap

Serve over HTTP(S), including the supplied loopback launcher for offline use;
direct `file://` opening is unsupported. Bundled fonts and decoder workers run locally.
Keep shared assets and the MediaSplat FFmpeg runtime with the app. The current
release packages include a standalone LayoutSplat ZIP, the five-app SplatWorks
suite, and the complete district installation. [Downloads](../pages/download.html).

Milestones 1–2 are implemented; the core tools in 3–4 are implemented, with further
composition fidelity and direct suite data-source integration remaining. Milestone 5
has print preparation and packaging, with stronger preflight, exhaustive PDF/X,
large-document optimization, and external application validation still remaining.
[Progress](../splatworks/layoutsplat/PROGRESS.md) ·
[Approved plan](../splatworks/layoutsplat/IMPLEMENTATION_PLAN.md) ·
[Library notices](../splatworks/layoutsplat/THIRD_PARTY_NOTICES.md).

## Large documents and current verification

Unchanged story layouts are reused, including after edits to another story.
Font loads, frame changes, wrap images and text/style changes invalidate affected
layouts. Page thumbnails render near the visible viewport; full print pages are
built for printing, and preview pages only while preview is enabled. A 500-page
regression confirms text conservation and reflow of one edited story rather than
all 500. This is a controlled browser check, not a guarantee for every complex
500-page publication or independent commercial-printer certification.
