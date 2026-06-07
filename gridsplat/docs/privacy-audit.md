# Privacy and Tracker Audit

Last checked: 2026-06-07

GridSplat is built as a static Vite app. The production bundle contains no analytics packages, ad scripts, tracking pixels, or third-party network beacons.

Checked by:

- Reviewing `package.json` dependencies for analytics/ad/tracker packages.
- Running Playwright end-to-end tests against the app.
- Keeping all processing local except user-initiated file downloads/uploads and future user-initiated cloud save flows.

Known external navigation:

- Visible DrawSplat™ links point to `https://drawsplat.org`.
- Cloud provider buttons are scaffolds until app registration and OAuth client IDs are configured.
