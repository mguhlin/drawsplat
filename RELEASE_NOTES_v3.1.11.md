# DrawSplatTM v3.1.11 Release Notes

DrawSplatTM v3.1.11 brings GridSplatTM into the DrawSplat Studio family, refreshes Studio navigation around SplatWorksTM, and rebuilds the self-host bundle with the integrated spreadsheet app.

## Highlights

- **GridSplatTM integration.** Added the GridSplatTM spreadsheet as part of DrawSplatTM instead of a separate project, including built assets under `gridsplat/` so it runs from static hosts at `/gridsplat/`.
- **Dedicated GridSplatTM page.** Added a public GridSplatTM landing page that introduces it as the SplatWorksTM spreadsheet for classroom tables, charts, and data work.
- **SplatWorksTM naming.** Standardized the Studio suite language around SplatWorksTM, WriteSplatTM, ListSplatTM, and GridSplatTM in the public site and documentation.
- **Studio dropdown rework.** Consolidated the top navigation into a Studio menu with SplatWorksTM, Tools, Widgets, and Games groups, while preserving quick dropdown access.
- **SplatWorksTM tool grouping.** Moved Big Link, Concept Map, Markdown Studio, Rubric Builder, SplatImage Studio, and Word Search Maker under SplatWorksTM below GridSplatTM.
- **Games and Tools pages.** Added dedicated pages so Games and Tools can each be browsed as full collections instead of only through dropdown links.
- **Cloudflare Pages fix.** Published GridSplatTM's production Vite bundle so `drawsplat.org/gridsplat/` loads without relying on source-only development files.
- **Self-host refresh.** Updated README, HTML release notes, Download for Self-Hosting page, and self-host ZIP for the current Studio build.

## Self-Host Bundle

The self-host ZIP is labeled `drawsplat-selfhost-v3.1.11.zip`. It includes the static site, Apps Script backend, MySQL backend, documentation, legal/compliance pages, DrawSplat Games, standalone classroom tools, the integrated GridSplatTM app, SplatImage Studio, SketchSpace VR, and the generic DrawSplat Hub dashboard with the `hubcampus` demo instance.

Real Hub campus folders are intentionally excluded from self-host bundles.
