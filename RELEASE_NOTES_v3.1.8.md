# DrawSplatTM v3.1.8 Release Notes

DrawSplatTM v3.1.8 refreshes the self-host bundle with the latest classroom tools, Concept Map Studio upgrades, and Quiz & Flashcard Studio science sample sets.

## Highlights

- SplatImage Studio is now included as a standalone browser-only image editor with resize and crop handles for quick classroom image cleanup.
- Concept Map Studio adds Markdown import, text controls, dropdown menus, improved import collision layout, and cleaner selected-node editing.
- Quiz & Flashcard Studio now ships with selectable science sample data sets for Grade 3 Science TEKS, Grade 5 Science TEKS, and Grade 10 Biology TEKS.
- Blog RSS content is refreshed so the self-hosted site carries the latest bundled blog snapshot.

## Self-Host Bundle

The self-host zip is labeled `drawsplat-selfhost-v3.1.8.zip`.

Build locally with:

```bash
./scripts/make-selfhost-bundle.sh v3.1.8
```

The bundle includes the static site, Apps Script backend, MySQL backend, documentation, legal/compliance pages, and standalone classroom tools. It excludes `.git`, `node_modules`, `.env`, logs, and build artifacts.
