# CipherSplat development handoff

CipherSplat 1.1.0 adapts the streamlined CipherEnc browser workspace from
`bb98f93c7af2` (full revision and source hashes in `solutions/CipherSplat/port-source.json`).
The CipherSplat name and `.csplat`, `.asc`, `.pgp` output conventions are preserved.

Password and OpenPGP workspaces now use three visible steps, automatic content
detection, local key-file import/fingerprints, automatic verified file saves,
copyable text results, and separate Help. Files are compressed in authenticated
CS4 ZIP wrappers. Existing raw CS4 and legacy formats remain readable. The ZIP
media marker remains compatible with CipherEnc. Safe restoration bounds expanded
sizes and rejects unsafe paths, collisions, links and special files.

PDFSplat recognizes compressed packages containing one PDF and verifies its own
protected PDF before offering output. The rebuilt bundle and boot cache token
include this change. The offline CipherSplat ZIP includes both workspaces, Help,
all local engines and license notices. `scripts/pin-ciphersplat-assets.py` refreshes
local SRI; shared ecosystem controls intentionally evolve independently.

Validation: 57 checks passed across Chromium, Firefox and WebKit, including legacy
and independent CipherEnc fixtures, PDF interoperability, invalid archives,
cancellation, OpenPGP key handling, phone reflow and exact Unicode. Direct-file
offline encryption/decryption passed Chromium and Firefox. The CipherSplat Spanish
switcher check passed. The broader solution-entry audit still reports unrelated
missing language-switcher integration in FontSplat and MemeSplat. Privacy control
and inventory generation/coverage checks passed.

Desktop integration is maintained in the sibling `splatworks-desktop` repository.
It imports a committed upstream snapshot and supplies native dialogs, staged
writes, empty directory restoration, lifecycle warnings and Help without replacing
open work. Stable publisher signing and physical-device qualification remain
separate from automated release-candidate checks.

The browser deployment passed 18 live desktop/phone workflow checks. Automated
WCAG A/AA scans reported no violations on the password, OpenPGP and Help pages.
The offline package normalizes permissions and timezone as well as timestamps;
CI rebuilt it byte-for-byte. Its published ZIP and all 78 integrity entries were
verified. Packaged navigation keeps local Help available and optional website
links off until enabled. The reference CipherEnc checkout remains unchanged.

GitHub Pages and Cloudflare Pages deployment checks succeeded. A separate
Cloudflare Workers build check fails; the verified live static application uses
the Pages deployment. FontSplat/MemeSplat localization audit findings above remain
outside this CipherSplat change.

The published desktop suite is `v1.0.0-rc.11` and the standalone tools are
`tools-v1.0.0-rc.5`, built from `ef4bf55`. All 98 published files matched official
metadata and adjacent checksums. The downloaded Linux suite and standalone
CipherSplat each passed eight Chromium/WebKit workflow checks. The website now
uses `data/desktop-apps.json` for its simple desktop download catalogue.

## School and district resource entry point

`/schools/` provides one printable overview of privacy, DPA/NDPA paperwork,
FERPA/COPPA, GDPR/UK GDPR, security, providers, accessibility, downloads, and
school setup. The main navigation and Help home expose it directly. Existing
policy URLs, agreement templates, execution status, and legacy fragments remain.
The canonical policy opens the enclosing disclosure for a linked section.

Validation passed 152 wiki/navigation/privacy/Drive checks, 27 school-page checks
across Chromium/Firefox/WebKit, all resource links and fragments, and two automated
WCAG A/AA scans with no reported violations. Wiki/navigation/privacy generation
is repeatable. Native office integration remains in progress in the sibling
SplatWorks Desktop checkout; the published combined suite remains rc.11 until its
expanded candidate passes the release gates.

The school resource is live and passed all 27 Chromium/Firefox/WebKit checks
against the public deployment. The desktop download now explicitly separates
its current PDFsplat/CipherSplat contents from the six planned core apps. That
copy also passed a live browser check. PlanSplat's offline cache now includes
the shared workspace adapter; all 25 browser workflows passed, including an
offline reload preserving drafts and account separation.

## Expanded desktop download published

SplatWorks Desktop `v1.0.0-rc.14` now combines ListSplat, GridSplat, WriteSplat,
ShowSplat, LayoutSplat, PlanSplat, PDFsplat and CipherSplat. Native build source is
`4d6e709`, with the browser snapshot from `ccaad8a`. The release workflow
`45242637093` passed all three platform builds, 58 native checks per platform,
installer/archive checks, and 134 Chromium/WebKit checks. The downloaded public
Linux runtime passed 64 additional workflow checks.

All 14 distribution files matched the public release's sizes and SHA-256 digests.
Public checksum files, the WebView2 manifest, and the Linux archive were fetched
directly; Windows/Mac package bytes came from the successful workflow and matched
the published digests. The desktop catalogue now points to this release, lists
all eight included apps, and keeps a visible next-steps section for compatibility,
offline/usability work and a signed stable release. The six smaller standalone
apps remain at `tools-v1.0.0-rc.5`. Publisher signing and physical-device
qualification remain open. Local website verification passed 153 checks.


## Fourteen-app desktop and Home chooser

The primary desktop download is `v1.0.0-rc.15`, native source `a8f75bd`, with
[successful release workflow](https://github.com/mguhlin/splatworks-desktop/actions/runs/45268392420).
GIFsplat, QRSplat, ImageSplat, AudioSplat, VideoSplat and MediaSplat join the eight
existing apps. Home opens with the SplatWorks logo centered among all fourteen
choices; returning Home retains open workspaces. ImageSplat includes its Fast
background-removal model. MediaSplat uses awaited native saves and preserves
outputs after cancellation or failure; saving an older output preserves newer edits.

The exact candidate passed 150 Chromium/WebKit checks and 157 native checks on
each platform, plus installer and package checks. A downloaded Linux runtime
passed another 80 interface checks through its production loopback server.
All fourteen distribution files match public release sizes, digests and SHA-256
sidecars. Publisher signing and physical-device qualification remain open.

The download catalogue and `docs/desktop-apps.md` now explain all fourteen apps,
the Home chooser, media saving and optional speech-model downloads. Both the
primary description and roadmap use user-facing language, with more desktop
apps planned as their local features become ready. The six smaller standalone
packages remain at `tools-v1.0.0-rc.5`. Keep the Schools & Districts privacy/DPA
hub and all legal resources intact. Native engineering details and receipts
remain in the sibling repository's `SESSION_NOTES.md` and ignored `output/` tree.
