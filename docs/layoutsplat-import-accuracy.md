# LayoutSplat import accuracy — v0.7.0

Private user-provided samples were opened and compared locally. Source publications,
reference PDFs, and screenshots are not distributed with the repository.

The two-page Publisher sample produced 37 editable text stories, 9 picture placements
and 6 unique image assets. Fixes preserve bitmap fills, native JPEG/PNG bytes,
OfficeArt crop fractions, arbitrary picture masks, paragraph leading/alignment,
source horizontal scaling, mixed paragraph font struts, relative leading,
blank paragraphs, paragraph spacing/indents, frame columns and asymmetric insets. The latest sample
still has one detected overflowing story. Keep and inspect the source and conversion
report rather than assuming a pixel-identical result.

The supplied reference PDF was created by Quark/Distiller and uses NeoSansIntel,
NeoSansIntel-Light, NeoSansIntel-Medium, and BellGothic-Light. The Publisher variant
uses Arial. These are different source font choices; importing Arial faithfully
cannot reproduce the other variant's font metrics. Embedded local fonts, kerning,
tracking, word spacing, and scale controls improve matching when appropriate source
fonts are available. Text composition engines and unsupported effects remain work.

Both legacy Apple Pages samples imported editable text, shapes, and pictures from
index.xml. Both PDF-compatible Illustrator spreads imported correctly sized page
artwork. Four binary-header EPS files converted locally. Modern Pages IWA, native
InDesign INDD, and the supplied Quark QXP variant are not natively decoded. A
libqxp feasibility check rejected that sample; it is not advertised as working.
Use IDML/SVG/PDF conversion paths as described in the feature guide.

Next accuracy work: additional Publisher versions, source-specific fields/effects,
scaled/rotated Pages groups, modern Pages IWA decoding, direct proprietary native
formats, paragraph composition parity, and real target-application validation for
InDesign/Scribus exports. Current CI verifies model/native round trips, emitted XML,
local import workflows, fonts, and independent print proof structure; this is not
external desktop application certification.

## Matching original fonts

Fonts loaded before a PUB import are retained in the new publication. Exact family
names and the closest available weight/italic variant are selected. The importer
reports remaining substitutions by source family. Text-box Office imports also
select matching variants. A missing variant can still require synthetic styling;
matching a font alone does not reproduce every source layout rule.

## Native legacy QuarkXPress

Bundled libqxp 0.0.3 reads supported QuarkXPress 3.1–4.1 files in the browser.
Supported text/frames/vectors remain editable and original bytes are retained.
Source font variants use the imported matching family files when available.
Newer QXP files remain unsupported, including the private supplied sample; the
current publication is preserved when decoding fails. External linked pictures,
text paths, hyphenation, linked-story metadata and advanced effects need review.

Two real upstream text documents pass browser-only/offline opening, source-byte
retention and native-project save/reopen checks. A 5.x detection fixture fails
without changing the project. Two pinned-toolchain builds produced identical
WebAssembly and JavaScript hashes. This verifies the tested subset, not all legacy
QuarkXPress documents.

## v0.5.0 masters, source story IDs and bitmap metafiles

The browser decoder now emits reusable master definitions and page associations
instead of painting repeated static master objects into normal pages. Frames
sharing a source text ID join one story only when their decoded text and supported
formatting agree. Their frame order follows source page/object order and is
reported for review; source-program composition and more complicated link metadata
remain incomplete. Different content/formatting stays separate to avoid data loss.
A bounded reader decodes the bitmap-only WMF subset used by the PUB exporter;
other metafiles retain the existing conversion/failure reporting.

The historical private-source overflow reported above has not been revalidated
with matching reference fonts during this milestone. It remains an open accuracy
benchmark. Native PUB export is documented separately in the
[technical reference](layoutsplat.md#publisher-pub-export).

## v0.7.0 checks and remaining fidelity limits

Automatic local English hyphenation, alpha-contour picture wrapping and editable
linked-frame ordering improve composition control. These do not reproduce
Publisher's proprietary paragraph composer. The historical private reference
font/overflow comparison above remains unverified; those source files are not
present in this workspace. No new pixel-fidelity claim is made for that sample.

Two additional pinned LibreOffice malformed-file regressions exercise bounded
worker handling; they are robustness coverage, not proof of more Publisher versions.
Native `.pub` export still has independent libmspub/LibreOffice checks. Actual
Microsoft Publisher acceptance cannot be completed without the application.

Independent Scribus 1.6.3 opening/edit/save/PDF checks now cover both SLA and IDML
interchange. They exposed and fixed page scratch/center offsets, missing frame
paths and missing PostScript font identifiers. The linked story, two pages,
pictures and basic shapes remain editable. Adobe InDesign has not been tested.

Modern Pages IWA, QuarkXPress 5+ and native INDD remain unsupported. Current
conversion routes are EPUB/Word/PDF from Pages, IDML packages from current
QuarkXPress, and IDML from InDesign. See primary instructions from
[Apple](https://support.apple.com/en-ph/guide/pages/tance1161f26/mac),
[Quark](https://www.quark.com/documentation/quarkxpress/2025/english/A%20Guide%20to%20QuarkXPress%202025/_3_108159734956748E7_2.html), and
[Adobe](https://helpx.adobe.com/indesign/desktop/save-export-and-publish/save-and-export/save-documents.html).
Interchange research is documented; it does not justify claiming native decoding.
