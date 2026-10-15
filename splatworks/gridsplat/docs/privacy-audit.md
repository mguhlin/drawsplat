# Privacy and Tracker Audit

Last checked: 2026-06-13

GridSplat™ is built as a static Vite app. The production bundle contains no analytics packages, ad scripts, tracking pixels, or third-party network beacons.

Checked by:

- Reviewing `package.json` dependencies for analytics/ad/tracker packages.
- Running Playwright end-to-end tests against the app.
- Keeping all processing local except user-initiated file downloads/uploads and user-initiated cloud save/open flows.

Known external navigation:

- Visible DrawSplat™ links point to `https://drawsplat.org`.
- Cloud provider buttons are disabled until app registration and OAuth client IDs are configured.
- Configured Google Drive, Dropbox, and OneDrive saves use browser-side OAuth and provider APIs only after the user chooses a cloud action. Google Drive now uses the shared GIS token flow: tokens stay in tab memory, Google sign-in loads only after a Drive action, and no sharing is enabled. Legacy persisted Google tokens are removed on upgrade; last-file references and projects remain. Dropbox and OneDrive retain their configured OAuth adapters.
- A future DrawSplat Apps Script storage adapter, if enabled, should be documented as a school/teacher-controlled Google backend and covered by the same DrawSplat Google OAuth disclosure.
