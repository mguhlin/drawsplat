CipherSplat Offline Edition
===========================

1. Keep this entire CipherSplat folder together.
2. Open index.html in a current Chrome, Edge, Firefox, or Safari browser.
3. The Internet Connection switch starts OFF every time the app opens.

Encryption, decryption, password generation, and file handling are local in
both switch positions. The switch only enables or disables optional links to
DrawSplat.org; CipherSplat contains no upload, analytics, or tracking code.

Password vaults use Argon2id with 64 MiB of memory and three passes before
AES-256-GCM encryption. Optional OpenPGP public/private-key operations also
work offline. Imported keys and key passphrases are held for one operation and
are not saved. Verify recipient fingerprints through a separate trusted channel.

The included integrity.json contains SHA-256 hashes for the shipped source,
styles, images, worker, and pinned OpenPGP.js and hash-wasm dependencies.

Browsers cannot enforce HTML Subresource Integrity for file:// scripts because
local files have an opaque origin. The online edition uses SRI; this downloaded
edition omits that one HTML attribute and supplies matching SHA-256 hashes in
integrity.json instead.

If a browser blocks Web Crypto for pages opened directly from disk, start a
local static server in the folder instead. For example:

  python3 -m http.server 8080

Then open http://localhost:8080/ in that browser. No internet connection is
needed for a localhost server.

Always test decryption before deleting the original data. CipherSplat cannot
recover a forgotten password.
