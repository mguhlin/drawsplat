# GraphSplat

**Current documentation:** [SplatWorks Wiki](https://drawsplat.org/wiki/) — setup, installation, licensing, free apps, OAuth, and district privacy review.


GraphSplat consolidates DrawSplat's Graph Maker and Picture Graph Maker into one privacy-first browser application.

## Workspaces

- Quick charts: bar, horizontal bar, line, area, pie, donut, and XY scatter; drag values or right-click a mark to set its value and color
- Picture graphs: emoji or uploaded pictures, configurable key, partial symbols, and direct horizontal or vertical value dragging
- Coordinate plane: click-to-plot points, labels, connected points, and linear equations
- Expression calculator: multiple functions, parameters/sliders, draggable curve offsets, pan/zoom, roots, intersections, and a value table
- Geometry: draggable points, segments, polygons, circles, labels, snapping, lengths, and polygon areas
- Local table-to-LaTeX conversion: spreadsheet paste, three classroom examples, booktabs documents, numeric matrix insertion, and project retention
- Equation exchange: validated .tex import, complete LaTeX, Markdown and self-contained HTML exports
- Equation Studio: local LaTeX, math templates, eight classroom examples, MathML/LaTeX copying, PNG/SVG/JPEG export, and reading of supplied descriptions
- Specialty charts: bubble, radar, polar, stacked bar, stacked area, and pyramid

The built-in **GraphSplat Examples** library provides colorful illustrated, ready-to-edit starting points organized by the six graph workspaces plus Equation Studio. It also links to integrated Science and Mathematics lesson plans for grades 3–5, 6–8, and 9–12, with TEKS correlations, instructional sequences, assessments, differentiation, and extensions. The teaching collection includes a visual and text-accessible graph-analysis checklist plus six Artful Analytics classroom starters.

Graphs export as PNG, JPEG, SVG, printable PDF, or CSV. Projects can be saved locally or moved between devices as JSON. No graph data or uploaded picture is sent to a server.

## Design references

The interaction model was informed by the capabilities described by [NCES Create a Graph](https://nces.ed.gov/nceskids/createagraph/), [Desmos Graphing Calculator](https://www.desmos.com/calculator), [Desmos Geometry](https://www.desmos.com/geometry), the [Desmos function reference](https://www.desmos.com/calculator/rlr1sstwye), the [Desmos example gallery](https://www.desmos.com/gallery/1b48bb5c-1f75-4891-aa51-126bbd7b528f), and the graphing tools summarized in [TCEA's Five Simple Graphing Tools](https://blog.tcea.org/five-simple-graphing-tools/). GraphSplat contains an independent implementation and does not copy their code, visual interface, assets, or branding.

## Legacy links

- `/solutions/graph-maker/` opens GraphSplat's Coordinate Plane workspace.
- `/solutions/picture-graph/` opens GraphSplat's Picture Graph workspace.

## Equation Studio

Choose Equation Studio or open `?mode=equation`. Type LaTeX or insert a template; use the fraction, algebra, geometry, statistics, calculus, aligned-step and matrix examples as editable starters. Project JSON retains the source and description. Read aloud reads the supplied description using available local browser voices; review it after editing. Voice availability depends on the browser and operating system. This does not provide handwriting recognition, speech-to-math, automatic solving, chemistry prediction, or office extensions.

[Workflow and examples](../../docs/graphsplat-equations.md) · [Engine provenance and local build](MATHJAX-NOTICE.md).
