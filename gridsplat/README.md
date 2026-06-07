# GridSplat™

**GridSplat™ by [DrawSplat™](https://drawsplat.org)** is a kid-friendly spreadsheet for sorting, graphing, and making sense of data.

GridSplat™ is a browser-based spreadsheet, charting, and graphing tool for grades 3-8.

The app is built with React, TypeScript, and Vite as a static web application so it can be hosted with GitHub Pages.

## Project Status

Modules 1-10 are implemented: foundation, UI shell, grid, formulas, import/export, charts, picture graphs, save scaffolds, and built-in activities.

Remaining plan modules: presentation mode, help/onboarding/privacy, and PWA/offline support.

The modular build plan lives in [docs/plan.md](docs/plan.md).

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
