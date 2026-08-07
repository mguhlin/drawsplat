# CipherSplat web security checklist assessment

**Date:** 2026-08-01

**Release:** CipherSplat™ v1.0.1

**Scope:** CipherSplat source, generated offline package, and the production route at `https://drawsplat.org/solutions/CipherSplat/`

This is an automated source and configuration assessment, not an independent penetration test, certification, or legal-compliance opinion. It maps CipherSplat against:

- OWASP Developer Guide, *Protect Data Everywhere*
- OWASP Secure Coding Practices Quick Reference Guide
- HackerOne, *Ultimate 9-Point Website Security Checklist*

## Architecture and applicability

CipherSplat is a public static application. It has no accounts, authentication, authorization, sessions, cookies, database, server-side file upload, API, application logging, or stored server secrets. Controls devoted to those features are not applicable. Files, passwords, private keys, and plaintext are processed locally in the browser and are never submitted to DrawSplat.

The browser is intentionally the trusted execution boundary for local encryption. This cannot meet checklist statements that require secret-protecting cryptography or input validation to execute on a server. Moving plaintext and passwords to a server merely to satisfy those controls would contradict CipherSplat's local-only threat model and materially increase exposure.

## Control mapping

| Area | Assessment | Evidence or disposition |
|---|---|---|
| Cryptographic primitives | Meets for the stated threat model | Native Web Crypto AES-256-GCM, 96-bit nonces, 128-bit tags, Argon2id v1.3, secure random salts/prefixes, authenticated versioned headers, non-extractable AES keys. No custom AES/GCM implementation. |
| Cryptographic agility | Meets | Current text v3 and CS4 formats are explicitly versioned; strict legacy PBKDF2 decoding remains isolated from new encryption. |
| Fail-secure behavior | Meets | Authentication failure, malformed lengths, unsafe parameters, trailing data, or invalid metadata prevent output. |
| Input validation | Meets after v1.0.1 remediation | Header, KDF, length, record count, metadata count, path components, type length, integer range, total size, and final offset are bounded and validated. Legacy non-chunked metadata now receives centralized validation too. DOM output uses `textContent`, not HTML injection sinks. |
| Data minimization/storage | Meets | No cookies or browser persistence APIs; no upload path; sensitive workspace material is cleared after results and after ten idle minutes. Physical erasure remains subject to JavaScript/browser garbage collection. |
| Password handling | Meets with inherent limitation | Passwords are not authentication credentials and are never stored or transmitted. New packages use Argon2id. Offline guessing of weak passwords remains inherent; the generator supplies high-entropy alternatives. Sensitive fields request no autocomplete. |
| Transport security | Meets after v1.0.1 remediation | HTTPS is enforced by redirect; HSTS is sent; CSP upgrades insecure requests. TLS 1.1 was rejected, TLS 1.2 succeeded, and the production certificate matched `drawsplat.org` and was valid at assessment time. The application itself permits no network connections. |
| Browser hardening | Meets | Restrictive CSP, SRI on executable scripts, `nosniff`, deny framing, no-referrer, restrictive Permissions Policy, same-origin opener/resource policies, and no inline or remote executable code. The narrow `wasm-unsafe-eval` allowance is required by the pinned local Argon2 WebAssembly implementation. |
| Sensitive-page caching | Meets after v1.0.1 remediation | CipherSplat responses send `Cache-Control: no-store`. The downloadable offline ZIP remains an intentional user-requested artifact. |
| Dependency hygiene | Meets operational baseline | OpenPGP.js and hash-wasm are pinned and vendored with license/version metadata and published hashes; `npm audit --omit=dev` reported zero known vulnerabilities at assessment time. |
| Server/database/account controls | Not applicable | No application server logic, database, sessions, cookies, user accounts, authentication endpoints, or server-side uploaded data exists. Production rejected TRACE and POST with HTTP 405. Cloudflare platform hardening and DoS controls remain hosting-provider responsibilities. |
| Error disclosure | Meets baseline | Password/tamper failures are deliberately indistinguishable. No stack traces are rendered. Errors are placed with `textContent`; no server or account details exist to disclose. |
| Change control and disclosure | Meets baseline | Source changes are tracked in Git; `security.txt`, a disclosure policy, reproducible offline build, integrity manifest, and cross-browser regression suite are published. |

## Remediated findings

### WEB-01 — Sensitive application responses were cacheable

**Severity:** Medium

**Resolution:** The CipherSplat route now sends `Cache-Control: no-store`. Although user plaintext is never part of an HTTP response, this reduces persistence of the executable security boundary and aligns the route with OWASP sensitive-page guidance.

### WEB-02 — HSTS was absent

**Severity:** Medium

**Resolution:** The CipherSplat route now sends `Strict-Transport-Security: max-age=31536000`; HTTP already redirects permanently to HTTPS. `upgrade-insecure-requests` was added to CSP as defense in depth.

### WEB-03 — Legacy non-chunked metadata validation was incomplete

**Severity:** Medium

**Resolution:** Decrypted metadata is now centrally validated for allowed kind, bounded name and metadata size, safe relative paths, file count, safe integer sizes, bounded MIME type, cumulative size, and exact payload-size agreement before restoration. Regression tests cover traversal, inconsistent size, and invalid type rejection.

### WEB-04 — Sensitive inputs allowed password-manager autocomplete hints

**Severity:** Low

**Resolution:** Vault-password and private-key-passphrase fields now request `autocomplete="off"`, disable spellcheck, and disable automatic capitalization. Browsers may treat autocomplete as advisory.

## Outstanding limitations and assurance work

1. **Independent trust anchor:** `integrity.json` and SRI improve detection and reproducibility but are delivered with the application. Signed releases and hashes published through an independent channel remain recommended.
2. **Independent testing:** The project has automated multi-browser tests and source reviews but no independent penetration test or accredited cryptographic assessment.
3. **Endpoint compromise:** CSP cannot protect plaintext from a malicious extension, compromised browser/OS, keylogger, screen capture, or an already-modified trusted application copy.
4. **Memory erasure:** Typed key buffers are overwritten where practical and workers are terminated, but JavaScript strings, immutable values, library internals, and browser-managed copies cannot be guaranteed physically erased.
5. **FIPS:** The browser Web Crypto and vendored Argon2/OpenPGP modules are not claimed to be FIPS 140 validated. Deployments requiring that certification need a separately reviewed architecture.
6. **Availability controls:** CDN, WAF, rate limiting, TLS configuration, certificate renewal, and traffic monitoring are controlled by Cloudflare and the domain operator, not the static CipherSplat code. Their operational configuration should be reviewed periodically.
7. **Parser assurance:** Coverage should be extended with continuous fuzzing, dependency scanning, and an independent review. No bounded review can prove the absence of all defects.

These limitations should remain visible; they cannot be honestly “removed” through client-side code alone.

## Addendum — CipherSplat™ v1.0.2 hardening (2026-08-07)

These changes tighten the browser execution boundary further. They are defense-in-depth; the v1.0.1 controls above already met the stated threat model.

### WEB-05 — Unused `data:`/`blob:` sources removed from CSP

**Severity:** Low

The application never assigns a `data:` or `blob:` URL to an image, and no code path (application or vendored OpenPGP.js/hash-wasm) creates a `Blob`-backed worker. `img-src` and `worker-src` are now pinned to `'self'` in both the in-document meta CSP and the production response header, removing allowances that widened the sink surface without being used.

### WEB-06 — Trusted Types enforced on the document

**Severity:** Low

The document now sends `require-trusted-types-for 'script'; trusted-types default`. A single `default` policy permits only the literal `argon2-worker.js` script URL and throws on every `createHTML`/`createScript` sink, converting any future DOM-injection or dynamic-script mistake into a hard failure instead of a code-execution path. The directive is applied via the meta CSP so it governs the document only; the Argon2id worker response is intentionally left unaffected so its same-origin `importScripts` continues to function. Browsers without Trusted Types support ignore the directive with no functional change.

### WEB-07 — Additional response-header hardening

**Severity:** Low

The production route now also sends `Cross-Origin-Embedder-Policy: require-corp` (enabling cross-origin isolation for an application whose every subresource is same-origin), `X-Permitted-Cross-Domain-Policies: none`, and a broadened `Permissions-Policy` denying accelerometer, autoplay, bluetooth, camera, display-capture, encrypted-media, geolocation, gyroscope, hid, idle-detection, local-fonts, magnetometer, microphone, midi, payment, publickey-credentials-get, screen-wake-lock, serial, usb, and xr-spatial-tracking. Clipboard-write is intentionally left at its default so the copy-result control keeps working.
