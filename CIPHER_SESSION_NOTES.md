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
