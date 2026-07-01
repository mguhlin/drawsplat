# DrawSplatTM v3.1.7 Release Notes

DrawSplatTM v3.1.7 keeps the version label in place while refreshing the self-host bundle with the latest Concept Map Studio work.

## Highlights

- Self-host security hardening for the MySQL backend: security headers, rate limits, safer CORS defaults, admin bootstrap guardrails, protected maintenance cleanup, room-key validation, JSON payload caps, sanitized client-visible errors, and tighter SSE subscriptions.
- Markdown Studio preview hardening: link and image URLs are scheme-checked, and generated preview attributes are escaped.
- Concept Map Studio now uses a full-width workspace layout. Template shortcuts sit above the canvas, while editing, grouping, save/load JSON, download, copy, embed, and Fit View controls sit below the canvas.
- Concept Map Studio adds a localized T-Chart template across all supported Studio languages: English, Spanish, Vietnamese, Arabic, Chinese, and Urdu/Hindi.

## Self-Host Bundle

The self-host zip remains labeled `drawsplat-selfhost-v3.1.7.zip`.

Build locally with:

```bash
./scripts/make-selfhost-bundle.sh v3.1.7
```

The bundle includes the static site, Apps Script backend, MySQL backend, documentation, legal/compliance pages, and standalone classroom tools. It excludes `.git`, `node_modules`, `.env`, logs, and build artifacts.
