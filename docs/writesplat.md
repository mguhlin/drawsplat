# WriteSplat: writing and Office document import

[Open WriteSplat](https://splatworks.org/writesplat). Documents save locally in
this browser; download native JSON to preserve the editable model elsewhere.
Readability decorations can highlight difficult sentences. Those overlays are
editor feedback and are separate from imported document highlighting.

## Word and LibreOffice imports

Open DOC, DOCX or ODT through File. The importer runs locally, with no conversion
upload or desktop office dependency. Word defaults, named style inheritance and
direct run formatting preserve common font families/sizes, colors, bold, italic,
underline and safe hyperlinks. Paragraph attributes retain source line spacing,
before/after spacing, left/right indents and first-line or hanging indents.
Numbered Word lists keep their counters across intervening blank paragraphs and
support source starts/overrides. Blank paragraphs retain source font/line metrics.
OpenDocument styles use actual named/automatic style properties, rather than
inferring bold or italic from a style's name.

The imported attributes survive native JSON saves and HTML serialization. Nested
lists and basic tables are retained. This is not complete Word/LibreOffice page
composition: floating pictures, headers/footers, tracked revisions, fields and
advanced table/page features require review. Binary DOC uses a bundled browser worker. Supported combined styles, native font
families/sizes, palette colors, numbering and paragraph spacing/indents are
retained. The decoder supports ordinary legacy Word variants; encrypted or damaged
files may fail. Native DOC line leading, fields/hyperlink targets and advanced
layout remain limited. Short compound streams are normalized in memory. DOCX/ODT input is limited to 20 MB,
with bounded XML and entity declarations rejected.

Block-drag handles sit outside text flow so they do not change paragraph wrapping
or list alignment. Existing educator, readability, library and language features
remain available.

## Page canvas, tabs and indents

New documents start with an empty paragraph. The title field supplies document
metadata; it does not add a heading to the body. Existing local drafts lose the old
“Untitled Document” heading only when the exact bundled starter paragraph follows
it; imported documents and user headings are kept.

The canvas shows Letter-size page outlines with one-inch margins. These are
continuous-editor guides, rather than a complete Word pagination engine. Browser
print output can break paragraphs differently from the on-screen guides. Use Print
preview to check final pages.

Choose inches, centimeters or points above the ruler. Drag the left, first-line
and right indent markers, or enter their values. Click the ruler to add a left tab
stop. Tab inserts a tab outside lists; inside lists it indents the list item.
Drag a tab to move it, drag down or double-click to remove it, or use Clear tab
stops. Focused markers support arrow keys (Shift changes by nine points), and
Delete removes a focused tab. The Insert tab button also works on touch screens.

Paragraph indents and tab stops survive native JSON saves and DOCX export/open.
DOCX left tab stops are imported. Advanced right/center/decimal tabs remain
limited. Fit width scales the whole page on smaller screens without changing
font sizes or document content. HTML exports retain rendered tab widths; ODT
exports retain tab characters, but not custom stop positions.

## LayoutSplat text boxes

In [LayoutSplat](https://splatworks.org/layoutsplat), right-click a text box and
choose **Import text** or **Append text**. DOCX/ODT text retains supported character
formatting, numbering, paragraph spacing and indents. Append preserves preceding
paragraph formatting and frame geometry. Source table cells become text paragraphs;
page layout and embedded pictures are not placed by this text-box action.
LayoutSplat reports unsupported highlighting/strike-through or substituted fonts
when present. Import an original font first to match its family where available.
Native JSON remains the editable backup for each application.
