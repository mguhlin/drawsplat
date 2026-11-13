# GraphSplat Equation Studio

Create equations for worksheets, explanations, slides, and quizzes in [GraphSplat](../solutions/graphsplat/?mode=equation). Choose **Equation Studio** from the workspace menu or open one of its eight examples in **GraphSplat Examples**. Rendering uses a bundled MathJax engine on your device, with no equation upload, account, or external font service.

## Write and preview an equation

Type LaTeX in **LaTeX equation**, or select text and choose a template to wrap it in a fraction, root, power, or subscript. Symbol buttons insert multiplication, division, inequalities, angles, sums, integrals, matrices, and aligned steps. Templates are editable starting points. Dollar delimiters are optional.

| Write | Meaning |
| --- | --- |
| `\frac{1}{2}+\frac{1}{4}=\frac{3}{4}` | Fraction addition |
| `x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}` | Quadratic formula |
| `a^2+b^2=c^2` | Pythagorean theorem |
| `m=\frac{y_2-y_1}{x_2-x_1}` | Slope between two points |
| `\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i` | Mean of a data set |
| `\int_0^1 x^2\,dx=\frac{1}{3}` | A definite integral |

The library also provides **Aligned equation steps** and **Matrix and vector**. These are authored examples, not automatically generated solutions. Change the numbers or symbols to fit your lesson and verify the mathematics yourself.

Use **Expression calculator** for graphing functions, sliders, roots, intersections, and value tables. Equation Studio formats mathematical notation; it does not solve equations or interpret general LaTeX as a graphing expression.

## Share and continue editing

- **PNG**, **JPEG**, **SVG**, and **Copy PNG** produce equation artwork with the title, colors and description. Insert the image into a document, presentation, quiz, or learning management system. **Print / PDF** uses the browser's print dialog.
- **Copy LaTeX** and **LaTeX file** preserve the source notation for compatible editors. **Copy MathML** provides structured math for applications that accept it. Compatibility varies; test the destination.
- **Project JSON** saves the workspace, source, reviewed read-aloud description, and styles. Open it in GraphSplat to keep editing. An exported image is finished artwork and does not restore the editing controls.

Invalid notation disables equation artwork/source exports until corrected. The project download remains available so unfinished work can still be kept. Equations are limited to 2,000 source characters. Document commands, links, remote packages, custom macro definitions, and styling commands are excluded.

## Import, convert and share

Open **Import and share LaTeX** for three additional exports:

- **Complete LaTeX document** wraps the current validated equation, title and reviewed description in an article with `amsmath` and `amssymb`. Compile it in a compatible TeX editor. GraphSplat previews equation notation; it does not run a full TeX compiler.
- **Markdown file** keeps the equation in a `$$` display-math block for a math-aware Markdown editor. Ordinary Markdown viewers may show the source instead.
- **HTML page** includes SVG artwork, structured MathML and expandable source. The downloaded page works without scripts, external fonts or network access.

**Import .tex equation** accepts a math snippet or a complete document containing exactly one display equation (`\[...\]`, `$$...$$`, `equation` or `align`, with starred variants). Imports are validated before replacing the current equation. Documents with several equations require copying one equation at a time. Preambles, custom macros, images and general document layout are not imported. Importing clears the old read-aloud description so an explanation cannot silently describe different math. Add a new reviewed description.

## Convert spreadsheet cells to LaTeX

Open **Table to LaTeX**, paste comma-separated data or tab-separated cells, and choose the delimiter if automatic detection is unsuitable. Quote CSV cells containing commas, quotation marks or line breaks; doubled quotation marks represent a literal quotation mark. Rows must have matching column counts. The limits are 20,000 input characters, 100 rows and 12 columns.

The HTML preview preserves literal cell text, empty cells and quoted line breaks. Check the first-row header setting and review every value. **Copy table LaTeX** produces a `tabular` fragment; **Table LaTeX document** includes the required `booktabs` package. For an existing document, load `booktabs` in its preamble. The preview checks cell layout; it is not a full TeX compilation. Cell formulas and LaTeX commands are treated as literal text, with special characters escaped. Merged cells and `.xlsx` files are not imported; paste the cells from your spreadsheet instead.

Three editable **Table examples** demonstrate the workflow:

| Example | Classroom use |
| --- | --- |
| Science measurements | Present trial, distance and time in a lab report; change the measurements and export a table. |
| Coin-toss probability | Compare observed counts and probabilities, using tab-separated spreadsheet cells. |
| Numeric matrix | Insert a two-by-two matrix into Equation Studio, then edit and export the notation. |

**Use as numeric matrix** replaces the current equation with all table cells as matrix entries. It accepts numeric cells only, so remove header rows first. It preserves scientific notation as entered; it does not solve matrix operations. Inserting a matrix or importing an equation clears the old read-aloud description. Keep a project copy before replacing work. **Project JSON** also retains table input, delimiter and header choices; previews are regenerated when reopened.

These independent features were informed by [StyleLaTeX's table conversion](https://stylelatex.com/tools/table-to-latex) and [format-sharing workflows](https://stylelatex.com/). They run locally without an account. Image/PDF/handwriting recognition, AI repair, whole-document Word conversion and full TeX compilation are outside this implementation.

## Descriptions and reading

Edit **Read-aloud description** after changing the equation. **Read description** reads that supplied text using an available local browser voice; it does not automatically interpret the math. Voice availability and pronunciation depend on the browser and operating system. If no local voice is ready, the app keeps the description available on screen. **Stop reading**, switching workspaces, or leaving the page stops current speech.

The SVG includes the graph title and description. **Accessible MathML preview** exposes structured mathematical notation; **Copy MathML** preserves that structure for compatible destinations. A PNG alone does not provide the same mathematical structure. Supply a reviewed description wherever the exported image is used. Screen-reader and destination support still need human review.

Core equation controls use the existing interface-language picker. User-authored notation and descriptions remain unchanged when switching the interface language. Explanatory help and example content may remain in English.

## Related tools and limits

The feature was informed by the typed equation, symbol, source-notation and graphics workflows in [TCEA's Equatio alternatives article](https://blog.tcea.org/free-equatio-alternatives-top-editors-for-math-teachers/). GraphSplat's independent implementation uses [MathJax](../solutions/graphsplat/MATHJAX-NOTICE.md).

Handwriting recognition, speech-to-math, predictive chemistry entry, automatic solutions, and Google Docs/Forms/Slides extensions are not included. MathML and image exports can be moved into compatible tools manually.
