# LayoutSplat · Ebooks and EPUB

LayoutSplat v0.6.0 creates EPUB 3 ebooks and imports supported EPUB 2/3 books
locally. Open **File → Templates → Ebooks** for three original, editable starters:
**The Quiet Journey** (novel), **A Field Guide to New Ideas** (nonfiction), and
**Small Wonders** (illustrated story). Each has a cover, title page and two
chapter pages, with example text in the six publication languages.

## Write and organize

Edit stories with the existing visual rich-text editor and replace illustrations
with your own pictures. In the right panel's **Reading order**, select a text
item and choose an **Ebook heading** level (H1–H6), or Body text. Mark chapter
titles as H1 and subsections as H2/H3. The EPUB contents navigation uses these
headings; source page sections provide fallback navigation when headings are absent.
Earlier/Later changes reading order without moving the page artwork. Omit from
reading edition excludes an item from reflowable EPUB and reading HTML.

**File → Ebook tools** opens book title, author, language code, publisher,
description and rights. **Save book details** saves them into the native project
and supports undo. Use a language code such as `en`, `es`, `vi`, `ar`, `zh` or
`hi`; the publication's Hindi UI identifier is converted to `hi` automatically.
Save the `.layoutsplat` project to preserve these details and complete editing.

The ebook workspace combines a searchable contents outline with a reading
preview. Select a section or use Previous/Next, choose 16–28 pixel text, and
switch Paper/Sepia/Night themes. **Edit selected text** returns to the page and
opens its first editable reading story. Reading themes and size affect preview;
the exported ebook remains adjustable in the reader. The preview is isolated
and does not run book scripts or load external resources.

![Ebook metadata, outline and reading preview](../assets/layoutsplat-guide/v0.6.0/ebook-tools.png)

## Export

Choose **File → Export → EPUB ebook**. Set a page range, or leave it blank for
all pages, then choose the ebook layout and Download.

| Layout | Content | Best suited to |
| --- | --- | --- |
| Reflowable | Selectable rich text, packaged pictures and tables in reading order; heading navigation | Novels, guides and text-led books |
| Fixed layout | Each selected page becomes a PNG picture at the chosen resolution, with EPUB page dimensions | Illustrated books and exact page compositions |

Reflowable EPUB includes each linked story once and includes its complete text,
including text that overflows its page frames. Selecting a page containing a
continuation frame therefore includes that whole story. Decorative shapes and
master-page furniture are omitted. Pictures use their embedded source image;
page crops, masks, overlapping artwork and image effects are not reproduced in
the reading edition. Motion media use poster images. Fonts are not embedded.
Readers choose fonts, type size and page breaks. Review reading order and picture
descriptions in Ebook tools before publishing.

Fixed-layout EPUB retains page appearance as pictures. Its text is not selectable
or individually editable. An unchanged exported EPUB reimports as picture pages;
use the native `.layoutsplat` project for editable text and objects. Bleed, crop
marks and ICC profiles do not apply to either EPUB layout.

Both layouts contain EPUB package metadata, a manifest, spine, XHTML contents
navigation and an NCX fallback. Reflowable navigation includes nested heading
links. No native project or original Publisher source is embedded in an EPUB.
The package follows the [W3C EPUB 3.3 specification](https://www.w3.org/TR/epub-33/).
Check the book in the readers you intend to support; package validation does not
certify accessibility or bookstore acceptance.

## Import

Choose **File → Import → EPUB — ebook text and pictures**, or choose an EPUB
through Open LayoutSplat project. Unencrypted EPUB 2/3 content is read in spine
order. Supported text becomes native stories with linked continuation frames;
headings, basic bold/italic/underline, supported CSS text styles and external
HTTP(S)/email links remain editable. Packaged images become native image objects.
Text before and after an inline picture keeps its reading order. Table cell text
becomes paragraphs. Book metadata is retained.

Source text is repaginated into book pages, so original XHTML/CSS geometry,
complex selectors, fonts, internal links, annotations, footnotes, active media and
advanced EPUB features are not preserved as an EPUB source-editing project.
Single-picture fixed-layout pages retain their appearance. Other fixed-layout
text repaginates. Scripts and remote resources are skipped without fetching them.
Encrypted/DRM content is rejected; obfuscated font files are skipped. Missing
required chapters or invalid markup leave the current publication intact.

Import limits: 96 MB compressed file, 5,000 archive entries, 8 MB per XML/XHTML
component, 2 MB per stylesheet, two million total text characters, 100,000
characters per native story, 500 publication pages and 500 pictures. Very large
individual paragraphs or unusually elaborate styling can exceed native story
range limits; split those chapters in an EPUB editor first. Export allows up to
128 MB of embedded pictures and the app's existing page image limits.

## Related ebook workflows

The book metadata, heading navigation and visual editing workflow draws on useful
patterns from [Sigil](https://sigil-ebook.com/about/) and
[PageEdit](https://sigil-ebook.com/pageedit/). Reader controls draw on patterns in
[epub.js](https://github.com/futurepress/epub.js),
[Foliate.js](https://github.com/johnfactotum/foliate-js) and
[InkWeave](https://github.com/mengmopqje/inkweave). This implementation uses
LayoutSplat's existing editor and local ZIP/markup tooling; it does not bundle
those applications or copy their implementation. Open the exported EPUB in
Sigil/PageEdit for detailed XHTML/CSS editing and advanced ebook workflows.
