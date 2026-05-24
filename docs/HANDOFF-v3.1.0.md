# Handoff after v3.1.0 — 2026-05-24

> If you're an AI assistant (Codex, Claude Code, Copilot, Cursor, etc.) picking up this repo, **read this file first**. It explains what's freshly shipped, what's intentionally deferred, and where the canonical references live.

DrawSplatTM is at the **v3.1.0** GitHub release. `main` is clean and pushed. `pages/download.html` "Latest stable" CTA points at the published zip (`drawsplat-selfhost-v3.1.0.zip`, ~86 MB, sha256 `cb9311fcec…34d1d`).

## What shipped in this milestone

### 1. Phase 4 MySQL backend, end-to-end

New / rewritten files under `server/mysql-backend/`:

| File | Purpose |
|---|---|
| `oauth-routes.js` | Verifies Google ID tokens via `tokeninfo` and Microsoft via Graph `/me`; mints the same HMAC bearer session as `/auth/login`. |
| `rbac.js` | Five-role tree (district / campus / teacher / student / parent) with a `PERMISSIONS` matrix and `requireRoles` / `requirePermission` middleware. `buildAuth(pool)` is the entry point. |
| `safety.js` | Extracts strings from a board JSON tree, applies text-keyword + link-allowlist rules from `compliance_config`. Returns `{ok, hits, reason}`. Used by `server.js` to gate `PUT /rooms/:roomKey/board` and `POST /turnins` (HTTP 422 on block). |
| `realtime.js` | SSE `/events?boards=k1,k2` with `user:<id>` and `board:<roomKey>` channels. `publishUser` / `publishBoard` are the publisher API. |
| `sis-clever.js` | Stores the district token in `compliance_config` (key `sis:clever`), pulls teachers + students with grade-derived age band. Endpoints `/sis/clever/connect|sync|status`. |
| `cron-jobs.js` | Per-minute time-limit enforcement (publishes `session-lock`) and daily retention prune for `audit_events`, `parent_requests`, `sessions`, `rate_limits` plus board archive/delete. Disable via `DRAWSPLAT_CRON=0`. |
| `privacy-packet.js` | District Privacy Packet ZIP via a hand-rolled store-only encoder (no `archiver` dependency). |
| `compliance-routes.js` (extended) | Adds age-band lock (`PUT /admin/users/:id/age-band`), parent-code issuance (`POST /admin/users/:id/parent-code`), freeze/unfreeze (`POST /admin/boards/:roomKey/freeze|unfreeze`), full data delete (`POST /admin/users/:id/delete-data`), data export (`GET /admin/users/:id/export-data`), parent's own request list (`GET /parent/requests?email=`). Returns `{auth, logEvent, checkBoardSafety}` so `server.js` can wire downstream modules with the same helpers. |
| `static/parent-portal.{html,js}` | Family Access Portal at `/parent-portal/` — signs in by verification code, lists requests, submits new ones. |
| `migrate-from-apps-script.mjs` | CLI: reads Sheet-tab CSV exports (Users/ParentRequests/Audit/TimeUsage) + folder of board JSONs and upserts them into MySQL. |
| `migrations/003_freeze_and_polish.sql` | Adds `rooms.frozen*` columns and a `parent_requests` email index. |
| `server.js` (rewritten) | Wires every module above, gates the room/board endpoints, publishes `board.updated` on save, starts cron. |
| `docker-compose.yml` (updated) | Mounts migration 003 and exports `GOOGLE_CLIENT_ID` + `DRAWSPLAT_CRON` env vars. |

### 2. Self-host bundle + download page

- `scripts/make-selfhost-bundle.sh [label]` builds `dist/drawsplat-selfhost-<label>.zip` excluding `.git`, `node_modules`, `.env`, logs.
- `pages/download.html` lists the three deployment paths (browser-only, Apps Script, MySQL) and links the GitHub release. Hero shows the v3.1.0 badge + SHA-256.
- "Download for Self-Hosting" link is now in the Support dropdown across **24 top-nav pages** (index, pages/*, legal/*, guides/*).

### 3. Hero imagery added

| Page | Image asset |
|---|---|
| `legal/texas-compliance.html` | `assets/brand/DrawSplat_Texas_Privacy.png` |
| `pages/pricing.html` | `assets/brand/DrawSplat_Pricing.png` |
| `parents/index.html` | `assets/brand/DrawSplat_Family_Access.png` (in `landing-hero-art.image-hero` right column) |
| `legal/district-addendum.html` | `assets/brand/DrawSplat_Banner.png` (top banner above hero) |
| `pages/contact.html` | `assets/brand/DrawSplat_Contact.png` (in `landing-hero-art.image-hero` right column) |

### 4. CSS fix — tool popover icons

`assets/css/app.css` line 344–345 was painting any active `.icon-btn` inside `#toolButtons` dark slate `#374151`. The same selector matched buttons inside an open `.tool-popover-panel`, hiding colorful Pen / Eraser PNGs behind a near-black circle. Added a higher-specificity override that swaps the dark fill for the same amber ring `.tool-popover-group.active>summary` uses (`#fff7e6` bg, `#f59e0b` border, `0 0 0 3px #faa63433` glow). Bumped `.eraser-size-controls` to `padding:10px 12px`, columns `auto + 3×1fr`, 38px buttons, dots 10/17/25 px so the smallest is visible.

### 5. README + roadmap caught up

- `README.md` current-build line is **v3.1.0**.
- Recent improvements rewritten — Phase 4, self-host bundle, Texas compliance, Compliance Console guide, contact form, free pricing.
- Included-files list refreshed with all 11 of the new MySQL backend modules, the migration CLI, scripts/, compliance.config.json, COMPLIANCE-ROADMAP.md, and the new pages.
- Compliance section flipped — Phase 4 is no longer "parked"; it lists OAuth, RBAC, SSE, Clever, cron, server-side privacy packet, parent portal.
- `COMPLIANCE-ROADMAP.md` Phase 4 boxes are all `[x]` (4.6 is Clever-only, ClassLink integration not done).

## Known gaps / pending work

- **MySQL backend has not been exercised against a live database.** Every module passes `node --check`, but no integration tests exist. A district deploying v3.1.0 should expect bugs — flag this clearly. `server/mysql-backend/README.md` says so explicitly.
- **Multi-instance deployments need work.** `realtime.js` is in-process; for more than one node instance, swap the subscriber map for Redis pub/sub. Set `DRAWSPLAT_CRON=0` on every instance except one.
- **Phase 1.3 / 1.4 (image upload approval queue) intentionally deferred.** The whiteboard embeds images inside board JSON; no separate upload endpoint exists. Don't accidentally "fix" this — it's a deliberate architecture choice. Text-filter + link-allowlist + board freeze + manual moderation cover the same threat surface.
- **`guides/mysql-setup.html` describes the older surface.** It still works as a basic setup walkthrough; the canonical Phase 4 reference is `server/mysql-backend/README.md`. Rewriting the guide to reflect Phase 4 is optional polish.
- **`pages/pricing.html` does not link to `pages/download.html`.** Could be a small follow-up.
- **ClassLink (Phase 4.6) is not done.** Only Clever has a connector. ClassLink uses a similar OAuth + roster API but different endpoints. Stub in `sis-clever.js` is generic enough to fork.

## Canonical references

- **Compliance map:** [`COMPLIANCE-ROADMAP.md`](../COMPLIANCE-ROADMAP.md) — every day-module with status + commit references.
- **Compliance operator guide:** [`docs/COMPLIANCE.md`](COMPLIANCE.md) and [`guides/compliance-guide.html`](../guides/compliance-guide.html).
- **MySQL backend:** [`server/mysql-backend/README.md`](../server/mysql-backend/README.md) — full endpoint surface, feature parity vs Apps Script, production checklist.
- **Setup paths:**
  - [`docs/setup-browser.md`](setup-browser.md) — browser-only
  - [`docs/setup-google-apps-script.md`](setup-google-apps-script.md) — Apps Script (production-supported)
  - [`docs/setup-mysql.md`](setup-mysql.md) — MySQL backend
- **Compliance config single source of truth:** Apps Script Script Property `COMPLIANCE_CONFIG` (production); `compliance_config.config_key='main'` row in MySQL (Phase 4); `compliance.config.json` is the documented client baseline.

## Useful commands

```bash
# rebuild the self-host bundle
./scripts/make-selfhost-bundle.sh v3.1.1   # or any label

# parse-check every backend module
cd server/mysql-backend && for f in *.js; do node --check "$f"; done

# create the next release after tagging
gh release create vX.Y.Z --draft --target main \
  --title "DrawSplat™ vX.Y.Z — <summary>" \
  --notes-file dist/RELEASE_NOTES_vX.Y.Z.md \
  dist/drawsplat-selfhost-vX.Y.Z.zip

# publish a draft release
gh release edit vX.Y.Z --draft=false
```

## House style notes for whichever assistant picks this up

- Default to writing no comments. Only add one when the *why* is non-obvious.
- Don't add features, refactor, or introduce abstractions beyond what the task requires.
- For HTML pages: the hero pattern is a two-column grid (`.landing-hero` = `landing-hero-copy` + `landing-hero-art.image-hero`). When asked to "add an image to the right" of a hero, drop the image into that structure rather than positioning it below the section. The 880px breakpoint collapses both columns to single-column.
- One logical commit per cohesive change. Long, descriptive commit bodies that explain *why* are welcome.
- Ask before pushing to remote, force-pushing, deleting branches, or making any change visible outside the local working copy.
