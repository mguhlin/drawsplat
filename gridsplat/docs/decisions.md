# Architecture Decisions

## 0001. Static React Application

- Status: Accepted
- Date: 2026-06-07

GridSplat™ is a static React, TypeScript, and Vite application. The browser handles application state and computation. There is no backend service for student work.

This keeps hosting simple, supports GitHub Pages, and avoids collecting student data by default.

## 0002. Custom Virtualized DOM Grid

- Status: Accepted
- Date: 2026-06-07

GridSplat™ uses a custom React DOM grid for the spreadsheet surface. The default sheet is 20x20 with large cells, and the component computes visible rows and columns from scroll position so the same approach can scale to larger classroom sheets without rendering every cell.

This keeps the grid child-centered and avoids adapting an adult-oriented commercial spreadsheet grid.

## 0003. HyperFormula License Mismatch

- Status: Needs product-owner review
- Date: 2026-06-07

The build plan identifies HyperFormula as MIT, but the current `hyperformula@3.3.0` package publishes as `GPL-3.0-only`. GridSplat™ uses HyperFormula because the plan explicitly requires it and because re-implementing formula parsing is out of scope.

Before a public release, decide whether GPL licensing is acceptable for GridSplat™, whether to buy a commercial HyperFormula license, or whether to replace the formula engine. The first integration also raises the production JavaScript bundle above Vite's default 500 kB warning threshold, so later modules should consider code-splitting the formula engine if startup size becomes a problem.

## 0004. Defer Excel Support

- Status: Accepted
- Date: 2026-06-07

The build plan originally required SheetJS (`xlsx`) for Excel import/export. The current npm package `xlsx@0.18.5` reports high-severity advisories for prototype pollution and ReDoS, with no npm fix available.

GridSplat™ will skip Excel support for now and ship native JSON, CSV, and Markdown import/export first. Before adding Excel support, choose a maintained parser or a supported SheetJS distribution with fixes.
