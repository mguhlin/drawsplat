# LayoutSplat import accuracy — v0.3

Private user-provided samples were opened and compared locally. Source publications,
reference PDFs, and screenshots are not distributed with the repository.

The two-page Publisher sample produced 37 editable text stories, 9 picture placements
and 6 unique image assets. Fixes preserve bitmap fills, native JPEG/PNG bytes,
OfficeArt crop fractions, arbitrary picture masks, paragraph leading/alignment,
source horizontal scaling, and mixed paragraph font struts. The latest sample
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
