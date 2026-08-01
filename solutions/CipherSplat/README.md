# CipherSplat™ v1.0.1

CipherSplat™ v1.0.1 is a standalone, browser-only encryption dashboard for files, recursive folders, and text. It was designed as a modernized alternative to the core FileLock workflow: data is encrypted locally and is never uploaded.

## Run it

Serve this directory from localhost so the Web Crypto and clipboard APIs are available in a secure context:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in a current browser. There is no build step and no application dependency.

For a ready-to-download local edition, run `../../scripts/build-ciphersplat-offline.sh`. It creates `downloads/CipherSplat-offline.zip`. The packaged app can be opened directly from disk and shows an Internet Connection switch that defaults to OFF. That switch controls optional DrawSplat.org links only; cryptographic operations never use the network.

## Features

- AES-256-GCM authenticated encryption (confidentiality, integrity, and wrong-password detection)
- Argon2id v1.3 with 64 MiB, 3 passes, one lane, and a fresh random 128-bit salt for all newly encrypted password packages
- Read-only compatibility with legacy PBKDF2-SHA-256 packages
- Optional OpenPGP public-key encryption and private-key decryption through pinned, locally vendored OpenPGP.js 6.3.1
- Fresh random 96-bit GCM nonce for every package
- Chunked file, multi-file, text, and recursively discovered folder encryption
- Folder paths, filenames, MIME types, and contents are inside the encrypted payload
- Full folder restoration through the File System Access API where supported
- No analytics, accounts, cookies, backend, upload request, or stored key
- Responsive security dashboard with honest progress/status indicators
- Integrity-check mode that authenticates a CipherSplat package and discards restored plaintext; OpenPGP integrity checking does not claim sender identity or signature verification
- Automatic clearing of passwords, imported keys, source input, file references, and results

## Folder workflow

Use **Choose folder** or drag a directory into the drop zone. CipherSplat walks every nested directory, records relative paths and sizes, then encrypts each file in bounded chunks as one `.csplat` package. Empty directories are not retained because the container records files, not directory entries. Existing `.ciphersplat` packages remain readable; the filename extension is only a type hint, while authenticated container magic and metadata determine the actual format.

When decrypting a folder package, **Restore folder** asks for a destination directory and recreates the nested tree. This uses `showDirectoryPicker`, currently best supported by Chromium-family browsers. On browsers without that API, files are downloaded individually and `/` is replaced with `__` in fallback filenames.

## Container formats

The application release is v1.0.1. This is separate from the current CS4 encrypted-container format version.

New files and folders use the chunked CS4 binary package:

```text
8 bytes   magic: CSPCS4!!
4 bytes   big-endian JSON header length
N bytes   JSON header (version, algorithm, KDF, rounds, salt, nonce)
remaining length-prefixed AES-GCM records, each with its own 128-bit authentication tag
```

The first encrypted record contains names, relative paths, MIME types, sizes, and chunk counts. It is followed by independently authenticated data chunks. A unique IV is deterministically derived from a random 64-bit package prefix and a monotonically increasing 32-bit record counter. Every record authenticates the exact magic, encoded header length, serialized header—including all Argon2id parameters—and record counter as additional authenticated data. Header changes, record substitution, and record reordering therefore fail authentication. Legacy PBKDF2-based CS2/CS3 packages remain readable but all new encryption uses CS4 with Argon2id.

New text packages use the compact `PRISMVAULT3` container encoded as Base64. Its exact magic, header length, and serialized Argon2id header are authenticated as additional data. Legacy PBKDF2-based `PRISMVAULT1` and `PRISMVAULT2` packages remain readable.

## Size limits and large files

CipherSplat does not impose an arbitrary per-file or folder-size limit. A package may contain up to 100,000 files, and file data is processed in 4 MiB chunks on desktop and 1 MiB chunks on phones/tablets. This avoids placing an entire source file into one Web Crypto operation. Output is assembled as a `Blob`, allowing browsers to manage backing storage more efficiently than a single giant typed array.

There is still no honest claim of “unlimited” size in a browser. Real limits come from available RAM, free device storage, the browser's Blob implementation, download limits, and mobile operating-system tab eviction. For multi-gigabyte packages, keep the tab foregrounded and powered; splitting exceptionally large datasets remains prudent. Folder discovery metadata also grows with file count.

## Security notes

- A strong, unique password is essential. Encryption cannot recover a forgotten password.
- Always test decryption before deleting an original.
- AES-GCM authenticates each chunk before that chunk is retained for restoration; no download is offered unless every record and the complete package structure validate.
- The outer header intentionally exposes only cryptographic parameters. Names and folder paths are encrypted.
- Only the active file chunk and authentication overhead are held as typed arrays during the NV2 crypto loop. The browser may still back the growing output Blob in memory or temporary storage at its discretion.
- Browser extensions or a compromised device can still read page memory. Use a trusted browser profile and device.
- The security badges describe implemented properties; they are not claims of third-party certification or a formal audit.
- The application includes a restrictive in-document Content Security Policy and makes no third-party font or analytics requests. Production hosting should additionally send CSP (including `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and an appropriate `Permissions-Policy` as HTTP response headers.
- CS4 authenticates the complete serialized header and record counter, then validates package algorithms, version, Argon2id memory/pass/parallelism bounds, salt/nonce lengths, chunk sizes, metadata size, file count, record count, authenticated file sizes, and safe relative paths before restoration. Legacy CS2/CS3 decoding remains available for existing packages.
- Folder restoration warns before any existing destination file can be overwritten. Choose a new or empty destination directory for the safest restore.
- OpenPGP keys are imported for one operation only. CipherSplat does not generate, discover, upload, persist, or synchronize keys. Protect private keys with a passphrase and verify recipient fingerprints out of band.
- The application clears source input and credentials after a completed result and clears the workspace after 10 minutes without interaction. JavaScript garbage collection ultimately controls physical memory reclamation.
- The production route has a strict CSP with no `unsafe-inline`, no allowed network connections, and no remote script sources. Its narrowly scoped `wasm-unsafe-eval` permission enables the local Argon2id WebAssembly module. OpenPGP.js and hash-wasm are vendored with their licenses and version metadata.
- Argon2id normally runs in a short-lived Web Worker. Terminating the worker releases its WASM instance; a main-thread fallback supports environments that cannot start a local worker. Browser garbage collection ultimately controls physical memory reclamation.
- `integrity.json` publishes SHA-256 hashes for the source, worker, styles, assets, OpenPGP dependency, and Argon2id dependency. `../../scripts/build-ciphersplat-offline.sh` normalizes timestamps and ZIP metadata for reproducible offline archives.
- CipherSplat does not protect against malicious browser extensions, compromised browsers or operating systems, keyloggers, screen capture, device administrators, or modified application files.
- CipherSplat has not received an independent security audit and does not claim SOC 2 certification, a paid bug bounty, or formal cryptographic certification.

## Accessibility

CipherSplat includes a skip link, semantic tabs with arrow-key navigation, pressed-state operation controls, labeled progress and status regions, visible keyboard focus, 44px critical touch targets, responsive reflow, result focus management, and reduced-motion support. Automated checks should still be included in the deployment pipeline because conformance depends on the final hosting environment and browser/assistive-technology combination.

## Files

- `index.html` — accessible page structure and dashboard
- `styles.css` — responsive visual design
- `app.js` — Web Crypto, recursive directory detection, container encoding, and restore flow

## Mobile and browser compatibility

The interface is responsive down to phone widths, uses 16px form controls to avoid iPhone input zoom, and provides touch-sized actions. Encryption and decryption require the Web Crypto API and modern typed-array/File/Blob APIs.

- Android Chrome/Edge: file and folder selection, chunked crypto, and direct directory restoration are supported where the system picker exposes them.
- iPhone/iPad Safari: file encryption, decryption, text mode, and responsive UI are supported. Folder picking depends on what the iOS Files picker exposes to Safari. Safari does not currently provide `showDirectoryPicker`, so decrypted folders use the multi-download fallback and flatten `/` to `__` in filenames.
- Desktop Chrome/Edge: full workflow including recursive drag/drop and directory restoration.
- Desktop Firefox/Safari: crypto and folder selection work; restoration uses the download fallback when the File System Access API is unavailable.

Mobile browsers may suspend a background tab during a long operation. Keep CipherSplat visible until the progress monitor reaches 100%.

## Brand asset

`assets/ciphersplat-hero.png` is the unique blue-and-silver hero artwork generated for this project. It contains no text so it can crop responsively.

## License

CipherSplat is part of DrawSplat and is covered by the repository's AGPL-3.0-or-later license. DrawSplat branding remains subject to `NOTICE.md`.
