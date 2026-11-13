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

## Descriptions and reading

Edit **Read-aloud description** after changing the equation. **Read description** reads that supplied text using an available local browser voice; it does not automatically interpret the math. Voice availability and pronunciation depend on the browser and operating system. If no local voice is ready, the app keeps the description available on screen. **Stop reading**, switching workspaces, or leaving the page stops current speech.

The SVG includes the graph title and description. **Accessible MathML preview** exposes structured mathematical notation; **Copy MathML** preserves that structure for compatible destinations. A PNG alone does not provide the same mathematical structure. Supply a reviewed description wherever the exported image is used. Screen-reader and destination support still need human review.

Core equation controls use the existing interface-language picker. User-authored notation and descriptions remain unchanged when switching the interface language. Explanatory help and example content may remain in English.

## Related tools and limits

The feature was informed by the typed equation, symbol, source-notation and graphics workflows in [TCEA's Equatio alternatives article](https://blog.tcea.org/free-equatio-alternatives-top-editors-for-math-teachers/). GraphSplat's independent implementation uses [MathJax](../solutions/graphsplat/MATHJAX-NOTICE.md).

Handwriting recognition, speech-to-math, predictive chemistry entry, automatic solutions, and Google Docs/Forms/Slides extensions are not included. MathML and image exports can be moved into compatible tools manually.
