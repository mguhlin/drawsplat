# CipherSplat™ 1.1.0

CipherSplat protects files, folders and text locally in the DrawSplat/SplatWorks ecosystem. The streamlined workspace incorporates the CipherEnc browser workflow while keeping the CipherSplat name, `.csplat` outputs and existing container compatibility. `port-source.json` records the reference revision and adapted source hashes.

Enter a password, then add files/folders or type text. Encrypted content is detected automatically. Selecting files after entering credentials starts processing and saving; selecting content first leaves the action button available. Text can also be processed with Ctrl/Cmd+Enter. Help and privacy explanations live on a separate page.

Files are ZIP-compressed in memory, encrypted with Argon2id and AES-256-GCM, independently decrypted and compared before saving. The authenticated ZIP media marker remains compatible with CipherEnc. Original ZIP files are restored as ZIP files; only authenticated archive wrappers are unpacked. New compressed operations accept at most 256 MiB and 10,000 files. Browser memory, storage and background-tab limits also apply. Empty source directories are not discovered by the file picker; empty directories present in an imported archive are retained during full restoration.

Restoration authenticates the entire package before output, validates ZIP metadata, paths, entry types, duplicate/case collisions, expanded sizes and CRCs. Directory-capable browsers restore into a fresh folder. Other browsers offer individual original files or an explicit ZIP download preserving folders. Desktop builds use native destination dialogs and private staging; they do not overwrite original files automatically.

The separate OpenPGP workspace accepts armored or binary exported keys up to 4 MiB, displays local fingerprints, and checks expiration/revocation before use. Verify recipient fingerprints through another trusted channel. Public keys encrypt; matching private keys and their passphrases decrypt. Outputs retain `.asc` for armored text and `.pgp` for files. CipherSplat does not fetch, generate or store keys. XChaCha20 packages must be opened with their creating application.

The current binary format is CS4 (`CSPCS4!!`), with 64 MiB Argon2id v1.3, three passes, one lane, random salt/prefix, and independently authenticated chunks. Text uses `PRISMVAULT3`. Legacy NV1, CS2/CS3 and PRISMVAULT1/2 packages remain readable. This application version is independent of the container version.

Passwords, keys and source inputs are released after successful processing. Results remain available for another save/copy until Clear or ten minutes of inactivity. No automatic recovery copies are created. JavaScript garbage collection controls physical memory reclamation. Save cancellation retains input before processing or the completed result after processing, as appropriate. A forgotten password cannot be recovered. Always verify restoration before deleting originals.

Serve the repository root with Python's HTTP server and open `/solutions/CipherSplat/`, or build the self-contained edition with `scripts/build-ciphersplat-offline.sh` from the repository root. `integrity.json` lists shipped SHA-256 hashes. Vendored OpenPGP.js, hash-wasm and JSZip include their licenses. The offline edition includes all workspace/help pages and local launchers; its connection switch controls optional website links.

The hosted ecosystem supplies privacy and language controls. File contents, passwords and keys are processed locally; see Help for the distinction between application processing and hosting/preferences. Keyboard focus, labeled progress, touch controls and phone reflow are covered by automated browser checks; assistive-technology and physical-device qualification remain separate.

Run `npx playwright test --config solutions/CipherSplat/playwright.config.js` from the repository root for Chromium, Firefox and WebKit compatibility, malformed-input, cancellation, workflow and independent-fixture checks. PDFSplat can unlock both raw PDF CS4 packages and compressed wrappers containing exactly one PDF.

CipherSplat is covered by the repository's AGPL-3.0-or-later license. DrawSplat branding remains subject to `NOTICE.md`. These checks are not an independent cryptographic audit.
