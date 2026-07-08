# DrawSplatTM v3.1.18 Release Notes

Released: 2026-07-08

## Summary

DrawSplatTM v3.1.18 refreshes the classroom-facing tools that changed after the v3.1.17 audit release: Typing Games, Passage Coach, Markdown Studio, Tools and Widgets cards, and the SplatWorksTM hub page.

## Highlights

- Added and polished the Typing Games area with Road Rally, Block Zap, and Passage Coach.
- Improved Passage Coach with CSV, XLSX, JSON, and paste import; localized passage sets; automatic next-passage loading; and continued performance tracking.
- Updated typing-game difficulty so intermediate and expert levels use longer words, and tightened Road Rally jump/obstacle behavior.
- Added HTML file import, pasted HTML conversion, HTML-to-Markdown conversion, and WordPress block-code export to Markdown Studio.
- Added visual card previews to Tools and Widgets, including screenshot thumbnails for tools that previously reused the same generic icon.
- Refreshed the SplatWorksTM hub with a new hero image, one-line headline, larger app icons, and launch buttons before the Apps section.
- Rebuilt all self-host packages and checksums under v3.1.18.

## Verification

- Playwright checks covered the SplatWorks hero order, image sizing, one-line headline behavior, and mobile overflow.
- Tools page checks covered 30 cards, 30 loaded images, 6 screenshot thumbnails, desktop/mobile no-overflow behavior, and no broken image responses.
- Markdown Studio and Typing Games changes were verified through focused browser and static checks during implementation.
- Self-host packages were rebuilt with `scripts/make-selfhost-bundle.sh v3.1.18`; checksums are published as `SHA256SUMS-v3.1.18.txt`.
