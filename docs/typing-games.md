# DrawSplat typing games

`/games/typing-games/` is a menu with original generated hero and cover artwork. Each experience has its own URL and translated instructions:

- `/games/cipher-chase/` — Cipher Chase. Overhead spy driving with lane steering, civilian traffic, typed rival attacks, collision shields and rechargeable smoke. Beginner mode gives approximately nine seconds before a rival reaches the player. Missed words do not cost shields; collisions do.
- `/games/wordfall-reactor/` — Wordfall Reactor. A 15×15 educational letter-board duel against a computer. Seven-letter racks, connected placements, validated crossing words, DL/TL/DW/TW bonuses, legal previews, bank suggestions, hints, move history, definitions, and ten turns each. Curated practice racks refresh each turn with a playable word when possible; this is not a finite tile-bag simulation. Multiword terms are omitted from the tile bank. Single words up to 15 letters can play using existing board letters; at most seven new tiles per move. The computer searches legal moves and selects the highest scoring move from its practice rack. Matches may end early if no legal moves remain.
- `/games/story-sprint/` — Story Sprint. Grade-band passages, exact character feedback, active-time WPM and accuracy, deliberate next passage, and local TXT/CSV/JSON/XLSX import. Five characters count as one word. Correcting current text improves accuracy. Adapted stories are practice texts, not quoted book passages. Imports allow up to 200 passages of 10,000 characters each; file input allows up to 5 MB. Nothing is uploaded.
- `/games/paws-and-keys-adventure/` — Paws & Keys Adventure. Ages 4–9, kitten/puppy characters, 12 progressive trails across four illustrated worlds, QWERTY finger hints, virtual and physical keys, optional spoken English key hints, and 1–3 stars based on accuracy. Trails contain 8, 12 or 16 prompts depending on age group. No time limit or lost lives. Each age group has its own saved stars and unlocks. Finishing a trail unlocks the next; replaying cannot reduce earned stars.

All pages share the existing DrawSplat language preference and offer English, Spanish, Vietnamese, Arabic, Chinese and Hindi/Urdu interface options. Cipher Chase defaults to TEKS English vocabulary; its General typing words option follows the selected interface language. Wordfall Reactor practices TEKS English vocabulary. Paws & Keys explicitly practices English QWERTY; its instructions are localized. A language change restarts an arcade round and switches built-in passages; imported passages remain intact.

Shared assets, styles, locales and engine are in `games/typing-games/`. The pet game uses its own `paws.js`; Wordfall Reactor uses `reactor.js`. Generated raster assets are committed locally, use no third-party requests, and contain original art rather than copied game graphics. Transparent cars and pets use PNG; covers/worlds use WebP. Source generation used the Codex imagegen tool.

Verification: `npx playwright test tests/typing-arcade.spec.js`. Tests cover all pages at desktop/mobile sizes, all six interface languages, correct and incorrect attacks, controls, pause, exact completion, JSON/CSV/XLSX imports, all twelve pet trails, unlocks and reload persistence.

## Temporary legacy links

Old `/games/road-rally/`, `/games/block-zap/`, `/games/passage-coach/`, and `/games/paws-and-keys/` pages use `legacy-redirect.js` to replace the browser location with the title-matching URL. These are client-side redirects, not permanent HTTP redirects. They preserve query strings (including language) and fragments and expire automatically at **April 8, 2027, 00:00 America/Chicago** (`2027-04-08T05:00:00Z`). At and after that instant they show an expired-link notice instead of forwarding; no scheduled cleanup or future deployment is required. Without JavaScript, an explicit link remains available. Cache-Control is no-store and old pages are noindex. Registry IDs remain stable so existing favorites keep working.

## TEKS vocabulary and practice integrity

`vocabulary.js` contains 72 curated terms across science, math, and social studies/history in bands 3–5, 6–8, and 9–12. These are representative vocabulary sets, not complete grade-by-grade curriculum coverage or an official TEA glossary. Each entry has an original plain-language definition, subject, band, source PDF, and section range. Terms/concepts were checked against the current TEA chapter PDFs on October 8, 2026:

- Science: [19 TAC Chapter 112](https://tea.texas.gov/laws-and-rules/texas-administrative-code/19-tac-chapter-112), subchapters A–C (elementary/middle adopted 2021 and high-school biology adopted 2020; implemented 2024–25).
- Math: [19 TAC Chapter 111](https://tea.texas.gov/laws-and-rules/texas-administrative-code/19-tac-chapter-111), subchapters A–C.
- Social studies: [19 TAC Chapter 113](https://tea.texas.gov/laws-and-rules/texas-administrative-code/19-tac-chapter-113), subchapters A–C.

Cipher Chase offers subject and band selectors. Correct typed targets flash their definition for 4.5 seconds, then keep it visible until the next success/reset. Sound defaults on, unlocks on a user action, uses an audible triangle tone with gain ramping, supports WebKit AudioContext, catches playback failures, and includes a Test sound button with status. Browser/device mute remains outside the game's control.

Story Sprint blocks paste shortcuts, paste events, drag/drop insertion, and paste/drop/replacement beforeinput events only in the scored practice field. Ordinary typing and IME composition remain available. Teacher text/import controls still accept pasted passages. This prevents ordinary clipboard shortcuts; it is not a secure assessment system against developer tools or scripted input.
