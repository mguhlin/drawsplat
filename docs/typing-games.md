# DrawSplat typing games

`/games/typing-games/` is a menu with original generated hero and cover artwork. Each experience has its own URL and translated instructions:

- `/games/cipher-chase/` — Cipher Chase. Overhead spy driving with lane steering, civilian traffic, typed rival attacks, collision shields and rechargeable smoke. Beginner mode gives approximately nine seconds before a rival reaches the player. Missed words do not cost shields; collisions do.
- `/games/wordfall-reactor/` — Wordfall Reactor. Seven-piece bag, rotation with horizontal wall kicks, ghost, hold, soft/hard drops, row clears and typed removal of active or settled pieces. C and X remain typing characters. Arrow keys control pieces; Shift holds. Space inserts spaces when typing a multiword target, otherwise it drops.
- `/games/story-sprint/` — Story Sprint. Grade-band passages, exact character feedback, active-time WPM and accuracy, deliberate next passage, and local TXT/CSV/JSON/XLSX import. Five characters count as one word. Correcting current text improves accuracy. Adapted stories are practice texts, not quoted book passages. Imports allow up to 200 passages of 10,000 characters each; file input allows up to 5 MB. Nothing is uploaded.
- `/games/paws-and-keys-adventure/` — Paws & Keys Adventure. Ages 4–9, kitten/puppy characters, 12 progressive trails across four illustrated worlds, QWERTY finger hints, virtual and physical keys, optional spoken English key hints, and 1–3 stars based on accuracy. Trails contain 8, 12 or 16 prompts depending on age group. No time limit or lost lives. Each age group has its own saved stars and unlocks. Finishing a trail unlocks the next; replaying cannot reduce earned stars.

All pages share the existing DrawSplat language preference and offer English, Spanish, Vietnamese, Arabic, Chinese and Hindi/Urdu interface options. Arcade target words follow the selected language. Paws & Keys explicitly practices English QWERTY; its instructions are localized. A language change restarts an arcade round and switches built-in passages; imported passages remain intact.

Shared assets, styles, locales and engine are in `games/typing-games/`. The pet game uses its own `paws.js`. Generated raster assets are committed locally, use no third-party requests, and contain original art rather than copied game graphics. Transparent cars and pets use PNG; covers/worlds use WebP. Source generation used the Codex imagegen tool.

Verification: `npx playwright test tests/typing-arcade.spec.js`. Tests cover all pages at desktop/mobile sizes, all six interface languages, correct and incorrect attacks, controls, pause, exact completion, JSON/CSV/XLSX imports, all twelve pet trails, unlocks and reload persistence.

## Temporary legacy links

Old `/games/road-rally/`, `/games/block-zap/`, `/games/passage-coach/`, and `/games/paws-and-keys/` pages use `legacy-redirect.js` to replace the browser location with the title-matching URL. These are client-side redirects, not permanent HTTP redirects. They preserve query strings (including language) and fragments and expire automatically at **April 8, 2027, 00:00 America/Chicago** (`2027-04-08T05:00:00Z`). At and after that instant they show an expired-link notice instead of forwarding; no scheduled cleanup or future deployment is required. Without JavaScript, an explicit link remains available. Cache-Control is no-store and old pages are noindex. Registry IDs remain stable so existing favorites keep working.
