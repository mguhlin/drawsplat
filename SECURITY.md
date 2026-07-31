# DrawSplat Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately through the [DrawSplat contact form](https://drawsplat.org/pages/contact.html) or by email to `drawsplat@gmail.com`. Include the affected URL or component, reproduction steps, impact, and any proof-of-concept material needed to confirm the issue.

Please do not include real student data, disrupt production services, access another person's data, or publish an unpatched vulnerability. DrawSplat aims to acknowledge actionable reports promptly, coordinate remediation and disclosure with the reporter, and credit responsible disclosure when requested.

The canonical machine-readable contact is [`/.well-known/security.txt`](https://drawsplat.org/.well-known/security.txt). DrawSplat does not currently publish a PGP reporting key, operate a paid bug-bounty program, hold SOC 2 certification, or claim an independent security audit. CipherSplat separately supports user-supplied OpenPGP keys for local file and text operations.

## CipherSplat scope

CipherSplat is a static, local-only browser application. Reports about its package parser, cryptographic construction, path validation, password handling, offline bundle, Content Security Policy, or misleading security claims are in scope.

CipherSplat uses no backend, account, remote storage mode, telemetry, analytics, advertising, or upload API. Its security model does not extend to a compromised operating system, browser, extension, device administrator, keylogger, screen recorder, or malicious replacement of files in a downloaded offline copy.

## Supported version

Security fixes are applied to the current `main` branch and the current production deployment at `drawsplat.org`. Self-hosters and users of downloaded copies are responsible for updating to a fixed release.
