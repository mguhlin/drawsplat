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

## 0003. Formula Engine License Review

- Status: Accepted
- Date: 2026-06-07

The build plan identifies HyperFormula as MIT, but the current `hyperformula@3.3.0` package publishes as `GPL-3.0-only`. GridSplat™ uses HyperFormula because the plan explicitly requires it and because re-implementing formula parsing is out of scope.

The no-paid-license direction means GridSplat should not depend on buying a commercial HyperFormula license. GridSplat / SplatStudio is therefore released under `GPL-3.0-only`, while DrawSplat whiteboard/tools/widgets remain under the repository-level AGPL-3.0-or-later license. The first integration also raises the production JavaScript bundle above Vite's default 500 kB warning threshold, so later modules should consider code-splitting or replacing the formula engine if startup size becomes a problem.

GNU GPLv3 and GNU AGPLv3 are compatible for combined works under each license's section 13. If GridSplat is combined with AGPL-covered DrawSplat components into one deployed work, keep the GPL part under GPLv3 and the AGPL part under AGPLv3, and expose corresponding source for the network-interactive AGPL combination.

## 0004. Excel Support Uses ExcelJS

- Status: Accepted
- Date: 2026-06-07

The build plan originally required SheetJS (`xlsx`) for Excel import/export. The current npm package `xlsx@0.18.5` reports high-severity advisories for prototype pollution and ReDoS, with no npm fix available.

GridSplat™ uses `exceljs` instead, with a package override for `uuid@11.1.1` so `npm audit --omit=dev` remains clean. Excel import/export stays behind `src/io/excel.ts` and is dynamically imported from the grid so the large workbook parser does not inflate the main application chunk.

## 0005. Browser-Only Cloud Save

- Status: Accepted
- Date: 2026-06-13

GridSplat™ implements Google Drive, Dropbox, and OneDrive adapters with OAuth 2.0 PKCE in the browser. There is still no GridSplat™ backend and no client secret in the repository. Each provider requires a public app registration and redirect URL setup before end-to-end saves can be verified with real accounts.

Provider saves use GridSplat's native JSON format. Google Drive uses the `drive.file` scope and multipart upload, Dropbox writes `/GridSplat/gridsplat.gridsplat.json`, and OneDrive writes `/GridSplat/gridsplat.gridsplat.json` through Microsoft Graph.

## 0006. Unified DrawSplat OAuth Posture

- Status: Accepted
- Date: 2026-06-13

DrawSplat Community, the whiteboard, and GridSplat use related but distinct auth/storage flows. Community sign-in verifies identity, the whiteboard's Google path uses a teacher-configured Apps Script storage backend, and GridSplat direct cloud save uses browser OAuth 2.0 PKCE to provider file APIs.

The same Google Cloud or Microsoft Entra app family may be reused only when the consent screen, redirect/origin settings, and scopes cover GridSplat. End users should not configure OAuth; deployment owners configure app IDs and district admins may approve access. See `docs/cloud-auth-strategy.md`.

## 0007. Picture Graph SVG Assets

- Status: Accepted
- Date: 2026-06-13

The picture graph now uses bundled SVG data-url icons authored for GridSplat™ instead of placeholder text shapes. Keeping the first icon set project-owned avoids unclear classroom asset licensing while preserving the plan's requirement that picture graph symbols be bundled and documented.
