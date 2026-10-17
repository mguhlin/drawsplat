# LayoutSplat · Verification and remaining limits

LayoutSplat v0.7.0, October 16, 2026. The full Chromium suite passed 90 workflows; ten focused Firefox checks, 15 LayoutSplat model checks, 51 WriteSplat unit checks and ten printer-preflight checks also passed. Tests use generated publications, bundled fonts and pinned upstream regression fixtures. Private user publications and account details are not distributed.

## Evidence

| Area | Checked result | Scope |
| --- | --- | --- |
| Ebook source editing | XHTML/CSS edits, visual edits, mode/resource changes, invalid XML rejection, native save/reopen, safe preview, link targets, fonts, footnotes and nonlinear chapters | Separate source and page editions; supported markup/CSS subset |
| EPUB validation | Reflowable, illustrated, fixed-layout and source exports; edited Sigil/PageEdit books | Upstream EPUBCheck 5.4.0 reports no errors/warnings for the tested files |
| Sigil 2.4.2 | Opened a source EPUB, edited chapter text, saved and reopened in LayoutSplat | Title, author, picture, font, footnote/backlink and EPUB 3 navigation retained; link check clean |
| PageEdit 2.4.0 | Opened packaged OPF, visually edited a chapter, saved, repackaged and reopened | Same source resources and note/link checks retained |
| Calibre 9.16.0 | Independent EPUB rendering/PDF output and EPUB 3 conversion returned to LayoutSplat with title/author, image, font and notes intact | Calibre conversion introduced a missing stylesheet and empty landmarks list; LayoutSplat removes those invalid remnants. Re-export from LayoutSplat passed EPUBCheck. Calibre output alone is not represented as validator-clean |
| Scribus 1.6.3 | Opened SLA and IDML packages, edited native story text, saved SLA, rendered PDF and reopened the edited files in LayoutSplat | Two Letter pages, one linked story/two frames, two picture placements, shapes and editable text; measured frame coordinates 54 × 72 pt, 500 × 18 pt |
| Office exports | PPTX/ODP independent XML/object checks, LibreOffice original/edited PDF rendering and cross-format round trips | Native rich text, tables, vectors, pictures and linked fragments; documented fallback effects |
| Hyphenation/wrapping | Narrow-column English hyphens conserve source text and mark offsets; alpha contours respect opaque bands with rotation/crop/master pictures | American-English patterns local; other dictionaries browser-dependent; conservative outer-edge bands, six-point gap |
| Suite exchange | Real WriteSplat opening/reload and return import, font files, custom tabs, hard breaks, nested numbered/bullet lists | Supported native text subset; page objects and advanced app features remain separate |
| Complex document | 120 pages, 480 picture placements, 12 generated 1024-pixel images, 12 linked stories and 20-object master, simulated 4× CPU slowdown | Initial layout about 1.46 s; cached layout 3.2 ms; one-story edit 103 ms; all source characters conserved. About 12.4 MB JS heap measured; image/browser/GPU allocations are not included. Host measurements are not a low-end-device guarantee |
| Print conservation | Two-page multilingual proof and 100-page linked-story/body-copy proof | Letter geometry, selectable Arabic, embedded font programs, 100 distinct linked fragments and 800 body paragraphs |
| Press preparation | Ghostscript conversion with FOGRA39 coated and FOGRA47 uncoated CMYK profiles; independent pypdf structural inspection and Poppler rendering | Correct output-profile bytes/hash, page boxes, embedded fonts, characterized/CMYK colors and flattened transparency for the tested files; no claim of exhaustive ISO certification |
| Publisher robustness | Existing real upstream sample, generated Publisher 2000 export and two additional pinned malformed-file regressions | Original bytes retained; unsupported malformed inputs return bounded worker errors. This does not establish support for additional Publisher versions |
| Real Google Drive | User saved to Drive, downloaded and reopened the supplied native project successfully | Confirmed observed workflow; school-account policies vary |

The desktop checks caught real export defects: missing SLA text-frame paths, wrong scratch/page-center offsets and absent IDML PostScript font identifiers. Those are corrected in this release. Bundled browser font substitutes are exported under their actual desktop names and accompany the package with notices. Scribus's default Arial preference can still be substituted on a machine without Arial; the proof's actual text uses its packaged Liberation Serif.

The test copy of Scribus was relocated locally by changing resource/library lookup paths only. Its import/render implementation was unchanged. Sigil and PageEdit ran in isolated X displays and separate preference directories. They did not touch the user's editor settings.

## Reproduce checks

Run from the repository root:

```bash
node --test splatworks/layoutsplat/engine.test.mjs splatworks/layoutsplat/publishing.test.mjs splatworks/layoutsplat/presentation.test.mjs
npx playwright test --config=playwright.layoutsplat.config.js
python3 scripts/check-layoutsplat-epub.py
python3 scripts/check-layoutsplat-pdf.py
python3 scripts/check-layoutsplat-large-pdf.py
python3 scripts/check-layoutsplat-exports.py
python3 scripts/check-layoutsplat-editable.py --office-dir test-results/office
python3 tests/layoutsplat-preflight.test.py
```

The browser suite requires Playwright Chromium; `LAYOUTSPLAT_CHROME` can point to a system Chrome executable. EPUBCheck uses a pinned upstream download, Java and a verified archive hash. Python checks require pypdf and Pillow; actual office rendering also requires LibreOffice. For press preparation, use the included `splatworks/layoutsplat/printer/pdfx.py` with the printer's own CMYK ICC profile, then inspect the report and rendered proof.

## External acceptance still open

- **Microsoft Publisher:** no application access is available. Native `.pub` export is implemented and independently decoded/rendered, but opening/editing in Microsoft Publisher remains unverified.
- **Adobe InDesign:** IDML has independent Scribus acceptance; Adobe InDesign opening/editing remains unverified.
- **Commercial printing:** a real printer must approve its own profile, stock, trapping, trim/bleed and physical proof. No print job has been ordered and no certification is claimed.
- **Private reference typography:** the earlier private sample/reference fonts are absent from this workspace. Its historical overflow and line-break differences have not been remeasured. Hyphenation/contours/manual flow controls improve editing; they do not establish Publisher paragraph-composition parity.
- **New proprietary decoders:** modern Pages IWA, QuarkXPress 5+ and native INDD are unsupported. Use the documented EPUB/Word/IDML/PDF conversion routes. Adding those native decoders requires a separate verified implementation and fixture corpus.
- **Advanced ebooks:** annotations as an app database, synchronized narration/media-overlay editing and certified accessibility remain outside the implemented source subset. Supported existing XHTML note markup is retained.

Primary references: [W3C EPUB](https://www.w3.org/TR/epub-33/), [Sigil/PageEdit workflow](https://sigil-ebook.com/pageedit/running-pageedit/), and [upstream Publisher fixtures](https://github.com/LibreOffice/core/tree/master/writerperfect/qa/unit/data/draw/libmspub/pass).
