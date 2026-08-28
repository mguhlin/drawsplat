# QRSplat Studio

QRSplat creates standard QR codes entirely in the browser. No account, upload, analytics, or remote API is required. Designs saved with **Save design locally** use this browser's `localStorage` only. Wi-Fi passwords are deliberately excluded from saved designs.

## Editable QR service (optional)

Editable QR codes require a redirect service with a durable owner and maintenance plan. The included Google Apps Script example is optional and is not enabled by default.

1. Create a Google Sheet owned by the organization that will maintain the links.
2. Open **Extensions → Apps Script** and paste [`backend/Code.gs`](backend/Code.gs).
3. Run `setupQRSplat` once. Copy the generated `ADMIN_KEY` from the execution log into a password manager.
4. Deploy as a Web app. Execute as the owner. Choose the access policy appropriate for the intended QR audience; public QR codes require public redirect access.
5. In QRSplat, open **Configure editable QR service** and enter the `/exec` deployment URL as the endpoint.
6. For the public redirect base, use the same URL followed by `?code=`. A branded URL such as `https://drawsplat.org/go/abc123` requires an additional server/edge redirect route; GitHub Pages alone cannot provide dynamic path routing.
7. Enter the administrative key only on a trusted device. It is kept in memory for the current tab and is never stored by QRSplat.

The endpoint URL and public redirect base are stored locally in the browser. The administrative key is deliberately session-only. Never place the key in a QR code, URL, shared document, or public repository.

## Security and privacy

- Static QR creation has no network dependency.
- Editable creation/update sends only the destination, QR ID when updating, and administrative key to the administrator-configured Apps Script endpoint.
- Redirect visits are handled by Google Apps Script and are therefore subject to the administrator's Google configuration and Google's service behavior.
- Rotate the `ADMIN_KEY` in Apps Script properties if it is exposed.
- Spreadsheet editors can view and change destinations. Restrict Sheet access and review its sharing settings.
- Test long-lived printed QR codes periodically and establish ownership succession before staff changes.

## QR encoder license

The locally bundled QR encoder is Kazuhiko Arase's QR Code Generator for JavaScript, distributed under the MIT License. “QR Code” is a registered trademark of DENSO WAVE INCORPORATED.
