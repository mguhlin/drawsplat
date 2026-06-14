# GridSplat™

**GridSplat™ by [DrawSplat™](https://drawsplat.org)** is a kid-friendly spreadsheet for sorting, graphing, and making sense of data.

GridSplat™ is a browser-based spreadsheet, charting, and graphing tool for grades 3-8.

The app is built with React, TypeScript, and Vite as a static web application so it can be hosted with GitHub Pages.

## License

GridSplat™ / SplatStudio is released under GPL-3.0-only. See [LICENSE.md](LICENSE.md) and [COPYING](COPYING).

The broader DrawSplat™ whiteboard, tools, widgets, and backends remain under the repository-level DrawSplat™ AGPL-3.0-or-later license unless a file or subdirectory says otherwise.

## Project Status

Local implementation modules are addressed: foundation, UI shell, grid, formulas, CSV/JSON/Markdown/Excel import/export, charts, picture graphs, save scaffolds, activities, presentation, help/privacy, and PWA support.

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
