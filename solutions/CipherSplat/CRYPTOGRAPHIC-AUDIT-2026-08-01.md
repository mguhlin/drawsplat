# CipherSplat cryptographic source audit

**Date:** 2026-08-01
**Auditor:** OpenAI Codex (automated source review; not an accredited laboratory or independent human assessor)
**Repository commit:** `d81a593fdafc0839bd045de151441a3255e4eca8`
**Application source SHA-256:** `d54ae41052eaebd98fc311b379cb00fa0e06ed4f981179abe57b4ffa438ea6be`
**Offline ZIP SHA-256:** `85d279386958ee48d0348062f9e6e3a59f9ad27f2181aa41ad50244ee5efb932`

**Post-audit Argon2id application SHA-256:** `d49b8494017e7269b033ef41afca5364dfc976223e451c65e4279ea9556788c8`
**Argon2id worker SHA-256:** `e8e1a5499c2548bf32f8e1c76b0a8b8d3bf100e83316376b4c68e18d35dc7466`
**Pinned hash-wasm Argon2 module SHA-256:** `dcec617a2e1b700fa132d1583a186cb70611113395e869f2dd6cc82b415d3094`
**Post-audit Argon2id offline ZIP SHA-256:** `fada3c8d52626963eb9e9a35454c0033e6d03bd3e86a01eeecd37b96c54e6914`

## Opinion

CipherSplat's password-vault mode uses established primitives correctly at the API level: AES-256-GCM through Web Crypto, 96-bit IVs, full 128-bit tags, fresh 128-bit PBKDF2 salts, and bounded per-record encryption. No critical or high-severity defect was found in the reviewed construction.

The reviewed version was **conditionally acceptable for ordinary local file protection after remediation of CS-AUD-01**. The header-authentication remediation and a subsequent migration of all new password packages to Argon2id have now been implemented and covered by regression tests. CipherSplat should still not be represented as formally certified, independently audited, FIPS validated, or suitable for high-assurance/regulatory use. Password security always remains limited by password entropy; Argon2id raises the cost of each offline guess but cannot make weak passwords safe.

OpenPGP mode delegates cryptography to locally vendored OpenPGP.js 6.3.1. This review checked CipherSplat's integration but did not re-audit the library's cryptographic internals.

## Scope and method

Reviewed files include `app.js`, `index.html`, the documentation, integrity manifest and build scripts, the vendored OpenPGP version metadata, and the generated offline ZIP. The review covered:

- primitive selection and Web Crypto parameters;
- key derivation, salt generation, IV construction, tag length, and AAD;
- NV1 and CS2 parsing, record ordering, truncation, mutation, and bounds;
- password and key lifetime claims visible in source;
- OpenPGP integration and verification semantics;
- source/package integrity and reproducibility claims.

Dynamic browser checks exercised NV1 round-trip encryption/decryption and mutations of the header, ciphertext, and tag. Static reasoning covered CS2 record construction and validation. The existing integrity manifest was regenerated without differences; the ZIP passed `unzip -t`; and the packaged `app.js` hash matched the reviewed source.

This was not a side-channel assessment, browser-engine audit, penetration test of production hosting, cryptanalysis of AES/OpenPGP, exhaustive fuzzing campaign, or assessment of the user's endpoint.

## Findings

### CS-AUD-01 — Cleartext container header is not authenticated

**Severity:** Medium
**Status:** Remediated after audit in text format v2 and chunked format v3; legacy formats remain read-only compatible
**Affected:** NV1 and CS2

The serialized header is neither encrypted nor supplied as AES-GCM additional authenticated data. CS2 authenticates only `NV2:<counter>` as AAD. Several header parameters are indirectly checked because changing the salt, IV prefix, iteration count, or chunk size normally causes key derivation, tag verification, or metadata validation to fail. That is not equivalent to authenticating the serialized header.

In NV1, mutation of the `brand` field was accepted and plaintext was released. The `v` field is not validated in either format and can likewise be altered without detection. This does not permit an attacker to forge encrypted content, but it contradicts whole-package tamper detection and creates a format-confusion/downgrade risk for future versions.

**Resolution:** New text packages authenticate `magic || header_length || header` and require version 2. New chunked packages authenticate `magic || header_length || header || uint32(record_number)` on every record and require version 3. Existing NV1 and CS2 packages remain decryptable under strict legacy-version checks, but are never newly produced.

### CS-AUD-02 — Password protection is computationally hardened but not memory-hard

**Severity:** Low / design limitation
**Status:** Substantially mitigated after audit with Argon2id v1.3; inherent offline guessing remains

PBKDF2-HMAC-SHA-256 with 600,000 iterations and a random 128-bit salt is a standards-based construction. It cannot compensate for a weak or reused password, and PBKDF2 is comparatively efficient on GPUs and specialized cracking hardware. The package contains everything needed for unlimited offline guesses.

**Resolution:** New text v3 and chunked v4 packages use Argon2id v1.3 with 64 MiB, three passes, one lane, a fresh 128-bit salt, and a 256-bit output imported as a non-extractable AES-GCM key. Parameters are authenticated and bounded before allocation. The pinned hash-wasm 4.12.0 implementation runs in a short-lived worker where supported. PBKDF2 is retained only for legacy decryption. Generated high-entropy passphrases remain necessary.

### CS-AUD-03 — “Verify” in OpenPGP mode proves integrity/decryptability, not sender identity

**Severity:** Informational
**Status:** Mitigated through UI and result wording

CipherSplat's OpenPGP verify-only operation decrypts with a private key and discards the plaintext. It supplies no verification key and does not require a signature. Successful processing therefore shows that the message is structurally valid and passes OpenPGP integrity protection; it does not authenticate who sent it.

**Resolution:** The action is labeled “Check integrity,” and its result explicitly states that successful OpenPGP processing does not verify sender identity or a signature.

### CS-AUD-04 — Published hashes are not an independent trust anchor

**Severity:** Informational
**Status:** Partially mitigated; independent release signing remains recommended

The generated `integrity.json` correctly matches the reviewed files, the vendored OpenPGP script has SRI in the online HTML, and the offline archive is internally consistent. Because the application, HTML, and hash manifest are delivered from the same origin/package, an attacker able to replace the application can normally replace the manifest too. These hashes support reproducibility and comparison against a trusted out-of-band digest; alone they do not establish authenticity.

**Resolution:** SRI now covers `app.js`, the vendored OpenPGP script, and the vendored Argon2id script. Publish release hashes and signatures through an independent, authenticated channel and sign release artifacts with a protected release key to complete this recommendation.

## Construction assessment

| Property | Result | Basis |
|---|---|---|
| AES implementation | Pass | Browser Web Crypto; no custom AES/GHASH |
| AES key size | Pass | 256-bit derived, non-extractable key |
| GCM IV length | Pass | 96 bits in NV1 and CS2 |
| GCM tag length | Pass | Explicit 128-bit tag on encrypt/decrypt |
| NV1 IV strategy | Pass | Fresh random 96-bit IV and fresh 128-bit salt per encryption |
| CS2 IV strategy | Pass | 64-bit random package prefix plus unique 32-bit record counter |
| Counter reuse in a package | Pass | Monotonic counter and preflight record bound |
| KDF | Pass after mitigation | New packages: Argon2id v1.3, 64 MiB, 3 passes, 1 lane, 128-bit salt; legacy PBKDF2 is decode-only |
| Record order/substitution | Pass | Record counter is AAD; authenticated metadata fixes sizes/chunk counts |
| Ciphertext/tag mutation | Pass | Browser tests rejected both |
| Truncation/trailing records | Pass | Expected lengths, metadata, final offset, and restored sizes checked |
| Header authenticity | Pass after remediation | Text v3 and chunked v4 bind the exact Argon2id header as AAD; legacy formats are decode-only |
| Path traversal on restoration | Pass in reviewed logic | Authenticated paths plus component validation before write |
| Library maintenance strategy | Partial | Native Web Crypto and pinned OpenPGP.js; update/vulnerability policy not evidenced |

## Standards basis

- NIST SP 800-38D, *Galois/Counter Mode (GCM and GMAC)*: IV uniqueness is required per key, 96-bit IVs are recommended, and plaintext plus AAD are authenticated.
- W3C Web Cryptography Level 2, AES-GCM: defines `iv`, `additionalData`, and supported authentication-tag lengths, including 128 bits.
- NIST SP 800-132, *Password-Based Key Derivation*: basis for PBKDF2 use with salt and an iteration count for stored-data protection. NIST has announced that this publication will be revised to include a memory-hard option and further PBKDF2 guidance.
- RFC 9106, *Argon2 Memory-Hard Function*: specifies Argon2id v1.3 and recommends a 64 MiB, three-pass profile as its memory-constrained option.

## Required remediation and retest

The primary remediation and initial regression suite are complete. Remaining assurance work before a high-assurance claim includes:

1. extend the new regression suite with fixed known-answer vectors, explicit wrong-password, record reorder/duplicate, counter-boundary, malformed-metadata, and unsafe-path cases;
2. fuzz all legacy and current parsers with strict time and allocation limits;
3. have an independent cryptography/security reviewer validate the revised design and implementation;
4. publish signed release hashes through an independent channel;
5. periodically benchmark the Argon2id profile on supported desktop and mobile browsers and raise its cost in a new format version when practical.

Post-remediation automated testing completed across Chromium, Firefox, and WebKit, including the fixed Argon2id vector, current text/chunked round trips, exact-header and ciphertext mutations, truncation, appended data, hostile KDF parameters, and legacy NV1/text-v2/chunked-v3 PBKDF2 compatibility. Preserve the exact source, build procedure, results, dependency inventory, and signed artifact digests for releases.
