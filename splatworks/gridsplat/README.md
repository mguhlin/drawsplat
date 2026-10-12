# GridSplat™

**Current documentation:** [DrawSplat Wiki](https://drawsplat.org/wiki/) — setup, installation, licensing, pricing, OAuth, and district privacy review.


Get current packages from [Downloads](https://drawsplat.org/pages/download) and read [release notes](https://drawsplat.org/pages/release-notes). App versions remain independent of the suite release.

**GridSplat™ by [DrawSplat™](https://drawsplat.org)** is a kid-friendly spreadsheet for sorting, graphing, and making sense of data.

GridSplat™ is a browser-based spreadsheet, charting, and graphing tool for grades 3-8.

The app is built with React, TypeScript, and Vite as a static web application so it can be hosted with GitHub Pages.

## License

GridSplat™ / SplatStudio is released under GPL-3.0-only. See [LICENSE.md](LICENSE.md) and [COPYING](COPYING).

The broader DrawSplat™ whiteboard, tools, widgets, and backends remain under the repository-level DrawSplat™ AGPL-3.0-or-later license unless a file or subdirectory says otherwise.

## Project Status

Local implementation modules are addressed: foundation, UI shell, grid, formulas, CSV/JSON/Markdown/XLSX/ODS import/export, charts, picture graphs, save scaffolds, activities, presentation, help/privacy, and PWA support.

Remaining release validation: provider credential checks with real Google/Dropbox/Microsoft app registrations, low-end Chromebook profiling, and production deployment validation.

The modular build plan lives in [docs/plan.md](docs/plan.md). The cloud/OAuth rollout strategy lives in [docs/cloud-auth-strategy.md](docs/cloud-auth-strategy.md).

## Run Locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm test
npm run build
```

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` type-checks and builds the static app.
- `npm run preview` previews the production build.
- `npm run lint` runs ESLint.
- `npm run format` checks formatting with Prettier.
- `npm test` runs Vitest unit tests.
- `npm run test:e2e` runs Playwright browser tests.

## Opening files from another SplatWorks app

Recognized project and Office files open in the matching app in a new tab. The matching app must be installed at the same website; allow popups if prompted. Files transfer through temporary browser storage without an upload. The imported tab uses a separate session draft: save a project file before closing it. Existing saved projects stay in place. See the [SplatWorks FAQ](https://drawsplat.org/wiki/faq#splatworks).

## Spreadsheet tools

Click a row or column header to select it; Shift-click another header to extend the selection. Apply bold, italic, alignment, colors and number formats to the selected cells. The reference box accepts cells and ranges such as `A1:D10`, `A:C`, and `2:5`. Insert/delete rows or columns, fill formulas or number series, and replace text in selected cells. Undo is available. Unmerge cells before structural changes or filling.

Office exchange reads the first worksheet with common values, formulas, basic formatting and merges. Imports are limited to 20 MB, 2,000 rows, 200 columns and 100,000 cells. Keep original workbooks for advanced charts, macros and unsupported features.
