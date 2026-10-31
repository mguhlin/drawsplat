# v3.1.49 · OCR safety and tested maintenance

Released October 31, 2026.

- Prominent OCR warning and persistent visual-cover warning: underlying text/images remain recoverable; this is not secure redaction. Linked approved redaction workflow for sensitive records.
- Fixed component-inventory generation in temporary worktrees so ancestor folder names cannot silently suppress runtime-script evidence; refreshed the inventory after app builds.
- Lower-memory option (5 pages / 500 lines / 2 MP), Spanish language metadata, confidence descriptions, useful progress announcements and reliable Stop/retry focus. OCR spelling, accents, layout and reading order remain approximate.
- Independently tested editor history/commands, VideoSplat test-library and GridSplat lint-plugin patches; rebuilt WriteSplat production assets. Sensitive/major upgrades remain held. [Full triage](../dependency-triage-2026-10-31.md).
- Published accessibility gaps now have issues #61–66 with acceptance criteria. Physical Chromebook/ChromeVox, other screen-reader and low-memory validation remains pending; automated emulation does not certify hardware.
- Consolidated wiki, README, download and blog guidance; homepage last-updated date and version. Reviewed main privacy policy and refreshed its visible date to October 31, 2026; clarified local OCR, sensitive-record limitations and accessibility boundaries without changing signed-agreement commitments.

Full, Tools, PDFSplat, district, WriteSplat and SplatWorks suite ZIPs refreshed. Other app packages retain their displayed versions. Keep the complete folder structure; OCR needs HTTPS or the included local HTTP launcher. Verify the six archives against `SHA256SUMS-v3.1.49.txt`.

Validation: 267 Chromium/Firefox PDF checks passed (7 platform skips); 52 mobile WebKit checks passed (3 skips) after correcting a raw-pointer test to bring its drawing target into view. Wiki/privacy browser suite: 53 passed. The inventory portability regression passed. Actual Orca speech capture and a real 1 GiB / zero-swap / one-CPU OCR run are recorded in [validation evidence](../../data/pdfsplat-ocr-validation-2026-10-31.json). Physical Chromebook/ChromeVox and other assistive-technology combinations remain pending.
