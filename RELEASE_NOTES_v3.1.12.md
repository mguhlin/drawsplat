# DrawSplatTM v3.1.12 Release Notes

DrawSplatTM v3.1.12 separates self-host download artifacts for DrawSplatTM and SplatWorksTM GridSplatTM while keeping them listed together on the same public download page.

## Highlights

- **Separate DrawSplatTM package.** `drawsplat-selfhost-v3.1.12.zip` contains the whiteboard, tools, widgets, games, Apps Script backend, MySQL backend, Hub demo, legal/compliance pages, and docs.
- **Separate SplatWorksTM GridSplatTM package.** `splatworks-gridsplat-selfhost-v3.1.12.zip` contains the GPL-3.0-only GridSplatTM spreadsheet app, built static assets, source, tests, docs, package metadata, and GPL license files.
- **Cleaner release workflow.** GridSplatTM updates can now ship without forcing a full DrawSplatTM package refresh.
- **Download page refresh.** `pages/download.html` now lists both packages with version, size, SHA-256 hash, license boundary notes, and deployment guidance.
- **Bundle script refresh.** `scripts/make-selfhost-bundle.sh` now builds both zip files in one run and excludes local development artifacts from each package.

## Bundle Files

- `drawsplat-selfhost-v3.1.12.zip` — 203 MB  
  SHA-256: `86cbc4d2eb9271ad526667acdd3f7b58c665059b2d940fee10644507305b57e7`
- `splatworks-gridsplat-selfhost-v3.1.12.zip` — 7.2 MB  
  SHA-256: `ac264b947a0459f0dd98b78b44eeb36126a52010ba340ad4ae431faa4352016e`

## Licensing

The DrawSplatTM package remains AGPL-3.0-or-later unless a file or subdirectory says otherwise. The GridSplatTM / SplatWorksTM spreadsheet package remains GPL-3.0-only.
