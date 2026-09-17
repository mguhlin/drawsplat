# DrawSplat MySQL saving service

The current static whiteboard connects to this host-independent API for private
account-owned **Save online / Open online board**. Deploy it on Railway,
DigitalOcean, or any Node.js/Docker host that can reach MySQL 8.

**Start here:** [portable hosting and connection guide](../../docs/setup-mysql.md).
Use `MYSQL_URL` / `DATABASE_URL` or separate database settings. Schema migrations
run automatically; managed databases support verified TLS and custom CA certificates.
The Docker image uses Node.js 22 and Railway deployment configuration is included.

The browser's backend is selected by its public API address, not a database hostname.
Database credentials and the password pepper stay on the server. API health checks
include the `private-boards-v1` capability required by the frontend wizard.

## Private whiteboard endpoints

All paths below follow `/api/drawsplat/mysql` (or `API_BASE_PATH`). Board endpoints
require a signed-in teacher/student/admin and always scope data to that account.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Database readiness and capabilities |
| POST | `/auth/register` | Teacher/parent account creation |
| POST | `/auth/login` | Email/password sign-in |
| POST | `/auth/logout` | Revoke the current token |
| GET | `/boards` | Your saved board list |
| GET | `/boards/:key` | Your board JSON and revision |
| PUT | `/boards/:key` | Save `{board, revision}`; 0 creates a board |
| DELETE | `/boards/:key` | Delete your saved board |

A stale revision returns 409 and preserves the existing online copy. Board keys
are scoped to accounts; knowing another account's key does not grant access.
The current copy is updated in place, avoiding unlimited snapshot growth.

`npm test` runs configuration checks. Set `MYSQL_TEST_URL` to a disposable database
to also exercise migrations, authentication, ownership, simultaneous saves, CORS,
and session revocation against real MySQL. Never use classroom data for these tests.

## Advanced service modules

These pre-existing modules remain available for separately configured district
installations. The frontend connection above does **not** enable classroom sharing,
SIS, realtime collaboration, or teacher turn-in review. Advanced integrations still
need production validation. Legacy room/template/turn-in/session endpoints now
require district/campus admin authentication until scoped classroom membership is
implemented.

## What's included

| File | Purpose |
|---|---|
| `schema.sql` | Original rooms / boards / templates / turnins / media / audit tables |
| `migrations/002_compliance.sql` | Users, sessions, parent_requests, time_usage, image_queue, compliance_config, rate_limits |
| `migrations/003_freeze_and_polish.sql` | Board freeze columns, parent_email index |
| `server.js` | Express app, wires every module below and adds compliance gates to board save/load |
| `compliance-routes.js` | Auth (email/pw), roster, parent flow, age-band lock, freeze, time limits, audit, data export/delete |
| `oauth-routes.js` | Google + Microsoft token verification → MySQL session |
| `rbac.js` | Five-role permission matrix + `requireRoles` / `requirePermission` middleware |
| `safety.js` | Shared text + link safety scan used by board save and turnin POST |
| `realtime.js` | SSE channel for session-lock and board.updated events |
| `sis-clever.js` | Clever district-token storage + roster sync endpoint |
| `cron-jobs.js` | Daily audit / board retention + minute-level time-limit enforcement |
| `privacy-packet.js` | Server-side District Privacy Packet ZIP generator |
| `static/parent-portal.html` + `parent-portal.js` | Family Access Portal at `/parent-portal/` |
| `migrate-from-apps-script.mjs` | CLI to import Apps Script Sheet exports into MySQL |
| `Dockerfile` + `docker-compose.yml` + `.env.example` | One-command deployment |

## API surface

All paths prefixed with `API_BASE_PATH` (default `/api/drawsplat/mysql`).

### Legacy / separately configured

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Liveness check |
| POST | `/auth/register` | Email + password account |
| POST | `/auth/login` | Email + password → bearer token |
| POST | `/auth/google` | Google ID token → bearer token |
| POST | `/auth/microsoft` | Microsoft Graph access token → bearer token |
| POST | `/parent/request` | Submit Family Access Tools ticket (with optional verification code) |
| GET  | `/parent/requests` | List a signed-in parent's own request history |
| POST | `/rooms` / `GET /rooms/:roomKey/board` / `PUT /rooms/:roomKey/board` | Legacy board CRUD (administrator-only) |
| GET / POST | `/templates` | Legacy template CRUD (administrator-only) |
| GET / POST | `/turnins` | Legacy turn-in CRUD (administrator-only) |
| POST | `/maintenance/delete-expired` | Manual expiry sweep |

### Authenticated (bearer)

| Method | Path | Min role | Purpose |
|---|---|---|---|
| POST | `/auth/logout` | any | Revoke current session |
| POST | `/time/heartbeat` | student / teacher | Record active time |
| GET  | `/time/status` | any | Today's usage + active time-limit config |
| GET  | `/events?boards=room1,room2` | any | SSE channel: `session-lock`, `board.updated` |

### Admin (bearer + role check)

| Method | Path | Allowed roles | Purpose |
|---|---|---|---|
| POST | `/admin/roster-import` | district_admin, campus_admin | Bulk-import students |
| GET  | `/admin/parent-requests` | district_admin, campus_admin, teacher | List parent tickets |
| GET / PUT | `/admin/compliance-config` | district_admin (PUT), district_admin/campus_admin (GET) | Read / write live config |
| GET  | `/admin/audit` | district_admin, campus_admin | Recent audit events |
| GET  | `/admin/privacy-packet` | district_admin, campus_admin | Download District Privacy Packet ZIP |
| PUT  | `/admin/users/:id/age-band` | district_admin, campus_admin, teacher | Change age band (with reason, audited) |
| POST | `/admin/users/:id/parent-code` | district_admin, campus_admin, teacher | Issue one-time verification code |
| POST | `/admin/users/:id/delete-data` | district_admin, campus_admin | Full student deletion |
| GET  | `/admin/users/:id/export-data` | district_admin, campus_admin, teacher | Export student work + row |
| POST | `/admin/boards/:roomKey/freeze` | district_admin, campus_admin, teacher | Freeze board (writes blocked) |
| POST | `/admin/boards/:roomKey/unfreeze` | district_admin, campus_admin, teacher | Lift the freeze |
| POST | `/sis/clever/connect` | district_admin | Store the Clever district token |
| POST | `/sis/clever/sync` | district_admin, campus_admin | Run a roster sync now |
| GET  | `/sis/clever/status` | district_admin | Returns whether a district token is connected |

## Family Access Portal

`http://localhost:8787/parent-portal/parent-portal.html` (override `DRAWSPLAT_API_BASE` on `window` if the API is on another origin). Parents sign in with the one-time verification code their teacher issued; the portal then renders the student's account snapshot and any existing requests, and lets the parent submit additional requests.

## Migrating from Apps Script

```
node migrate-from-apps-script.mjs --src ./apps-script-export --dry-run
node migrate-from-apps-script.mjs --src ./apps-script-export
```

Drop the Sheet tabs into a folder as `Users.csv`, `ParentRequests.csv`, `Audit.csv`, `TimeUsage.csv`, plus an optional `boards/` directory of per-board JSON files. The CLI upserts everything into MySQL using the same schema.

## Compliance feature parity vs Apps Script

| Capability | Apps Script | MySQL |
|---|---|---|
| Text keyword filter (client + server enforcement) | ✅ | ✅ (server uses `safety.js`) |
| Link allow/blocklist | ✅ | ✅ |
| Board freeze | ✅ | ✅ (rooms.frozen, write rejected with 423) |
| Age band schema + lock + audit | ✅ | ✅ |
| Activity Records (audit log) | ✅ Sheet | ✅ `audit_events` table |
| Parent Request Center | ✅ Apps Script | ✅ Endpoints + parent portal HTML |
| Parent verification code | ✅ | ✅ |
| Data export | ✅ ZIP | ✅ JSON (turnins + user row); ZIP via privacy-packet for districts |
| Data deletion | ✅ | ✅ |
| Time-limit controls (UX + server gate) | ✅ poll | ✅ poll + **SSE push** |
| District Privacy Packet | ✅ | ✅ |
| Retention cleanup | ✅ Apps Script trigger | ✅ in-process cron |
| Compliance Console config | ✅ Script properties | ✅ `compliance_config` table |
| OAuth (Google + Microsoft) | Community only | ✅ |
| Roster CSV import | ⚠️ clunky | ✅ |
| SSO / SIS sync | ❌ | ✅ Clever connector |
| RBAC tree (district / campus / teacher / student / parent) | ⚠️ ad-hoc | ✅ enforced via `rbac.js` |
| Parent portal (read-only data view) | ⚠️ form only | ✅ HTML + endpoints |
| Real-time session enforcement | ❌ | ✅ SSE |
| Cross-device board sync | ❌ | ✅ SSE `board.updated` |

## Production checklist

- Serve the API over HTTPS (terminate TLS at a reverse proxy or use a managed PaaS).
- Set `CORS_ORIGIN` to your frontend domain.
- Keep `ALLOW_ADMIN_SELF_REGISTRATION=false` except during first-admin bootstrap with `BOOTSTRAP_ADMIN_EMAILS`.
- Set `MAINTENANCE_TOKEN` for automated retention cleanup, or call maintenance routes with a district/campus admin bearer token.
- Rotate `DRAWSPLAT_PEPPER` only when you intend to invalidate every stored password.
- Run automated backups of the MySQL volume.
- Verify the Clever district token is stored as encrypted-at-rest (managed MySQL providers handle this; bare-metal installs need disk encryption).
- Hand the OAuth Google client ID to the frontend; the backend audience-checks it.
- For multi-instance deployments, set `DRAWSPLAT_CRON=0` on every instance except one, and front the SSE endpoint with a sticky-session load balancer (or swap `realtime.js` for Redis pub/sub).
