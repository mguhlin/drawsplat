# DrawSplatTM v3.1.17 Release Notes

Released: 2026-07-01

## Summary

DrawSplatTM v3.1.17 is a whole-universe cleanup release focused on whiteboard polish, Concept Map Studio usability, public/mobile page reliability, Hub/admin sign-in behavior, and refreshed self-host packages.

## Highlights

- Refined the DrawSplatTM whiteboard shell with CSP/version stamp fixes, responsive layout improvements, better onboarding sequencing, refreshed offline cache behavior, and a repaired Concept Map launch path.
- Improved Concept Map Studio with click-to-edit bubble labels, draggable bubble width handles, internal canvas scrollbars, a start-from-template dialog, a quick top toolbar, and selected-bubble contextual controls.
- Cleaned SplatWorksTM, games, public site pages, language whiteboards, the community board, Hub/admin pages, and static development-template fallbacks after desktop/mobile audits.
- Rebuilt all self-host packages and checksums under v3.1.17.

## Verification

- Concept Map Studio Playwright checks covered the chooser, inline label editing, bubble resizing, quick toolbar/popover behavior, and mobile internal scrolling.
- Public pages audit covered 51 routes at desktop and mobile sizes with no unresolved overflow or console/network errors.
- Admin and Hub audit covered 12 routes at desktop and mobile sizes.
- Cross-cutting static audit covered 130 HTML entry points at desktop and mobile sizes after page settle.
