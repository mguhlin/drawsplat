# DrawSplatTM MySQL Backend (Phase 4 scaffold)

> ⚠️ **Status:** scaffolded but **not yet exercised against a live database**. The Apps Script backend in `apps-script/Code.gs` is the supported production path today. This MySQL backend is here so a self-hosted district deployment can swap in without re-implementing every endpoint from scratch — but expect bugs until someone runs it end-to-end against MySQL.

## One-command deployment

```
cp .env.example .env
# edit .env — at minimum change MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD,
# and DRAWSPLAT_PEPPER to long random values.
docker compose up -d
```

That brings up MySQL 8.4 with `schema.sql` and `migrations/002_compliance.sql` applied on first boot, plus the Node API on port 8787 (override with `API_HOST_PORT`).

## What's included

- **schema.sql** — base room / board / template / turn-in tables.
- **migrations/002_compliance.sql** — Phase 4 compliance tables: `users`, `sessions`, `parent_requests`, `time_usage`, `image_queue`, `compliance_config`, `rate_limits`, plus columns added to `audit_events`.
- **server.js** — existing room/board endpoints; loads `compliance-routes.js` on boot.
- **compliance-routes.js** — Phase 4 compliance endpoints (auth, roster import, parent requests, time limits, compliance config, audit read).
- **Dockerfile + docker-compose.yml + .env.example** — one-command deployment.

## API surface (Phase 4 compliance endpoints)

All paths are prefixed with `API_BASE_PATH` (default `/api/drawsplat/mysql`).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | none | Create an email / password account |
| POST | `/auth/login` | none | Returns bearer token + profile |
| POST | `/auth/logout` | bearer | Revoke the current session |
| POST | `/admin/roster-import` | district_admin / campus_admin | Bulk-import student rows |
| POST | `/parent/request` | none | Submit a Family Access Tools request (optional verification code) |
| GET  | `/admin/parent-requests` | district_admin / campus_admin / teacher | List parent tickets |
| POST | `/time/heartbeat` | bearer | Record active time delta (capped 90s/beat) |
| GET  | `/time/status` | bearer | Today's usage + active time-limit config |
| GET  | `/admin/compliance-config` | district_admin / campus_admin | Read live config blob |
| PUT  | `/admin/compliance-config` | district_admin | Replace live config blob |
| GET  | `/admin/audit` | district_admin / campus_admin | Read recent audit events |

## Known gaps before this can replace the Apps Script backend

Pull requests welcome. These are intentionally not yet implemented:

- **Google / Microsoft OAuth.** Only email/password is wired; port the Community-side verification (calls Google `tokeninfo` and Microsoft Graph `/me`) into a node module.
- **Per-board / per-room save endpoints with compliance gates.** The legacy room/board endpoints below don't yet enforce age-band, freeze, time-limits, or text filter the way Apps Script's `saveBoard_` does.
- **Scheduled retention cleanup.** Schema has the columns; the cron equivalent of `dailyRetentionCleanup` isn't wired.
- **District Privacy Packet generator.** Replicate `privacyPacketResponse_` server-side and return a ZIP.
- **SSE / WebSocket for real-time session enforcement.** The Apps Script path only polls. Doing this properly is the main reason the MySQL path exists.
- **Integration tests.** Docker-compose harness with mysql + supertest before relying on this in production.

## Original room/board surface

This is a starter backend for a self-hosted DrawSplatTM deployment. It lets DrawSplatTM keep Google Apps Script as one storage option while adding a MySQL-backed provider for schools or districts that want local database storage.

The browser never connects directly to MySQL. The flow is:

```text
DrawSplatTM browser app -> HTTPS backend API -> MySQL
```

## What This Backend Provides

- `GET /api/drawsplat/mysql/health`
- `POST /api/drawsplat/mysql/rooms`
- `GET /api/drawsplat/mysql/rooms/:roomKey/board`
- `PUT /api/drawsplat/mysql/rooms/:roomKey/board`
- `GET /api/drawsplat/mysql/templates`
- `POST /api/drawsplat/mysql/templates`
- `GET /api/drawsplat/mysql/turnins`
- `POST /api/drawsplat/mysql/turnins`
- `DELETE /api/drawsplat/mysql/sessions/:roomKey`
- `POST /api/drawsplat/mysql/maintenance/delete-expired`

This starter stores board JSON in MySQL. For large image/audio uploads, production deployments should add filesystem or object storage and store only metadata/pointers in MySQL.

## Setup

1. Create a MySQL database.

```sql
CREATE DATABASE drawsplat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'drawsplat_app'@'%' IDENTIFIED BY 'CHANGE_ME';
GRANT SELECT, INSERT, UPDATE, DELETE ON drawsplat.* TO 'drawsplat_app'@'%';
FLUSH PRIVILEGES;
```

2. Run the schema.

```bash
mysql -u drawsplat_app -p drawsplat < schema.sql
```

3. Install backend dependencies.

```bash
npm install
```

4. Create `.env`.

```bash
cp .env.example .env
```

Edit `.env` with the real host, database, user, password, TLS setting, and allowed DrawSplatTM origin.

5. Start the backend.

```bash
npm start
```

6. Test the backend.

```bash
curl http://localhost:8787/api/drawsplat/mysql/health
```

Expected response:

```json
{"ok":true,"provider":"mysql","time":"2026-05-16T00:00:00.000Z"}
```

## Connect the Static App

Open `mysql-setup.html`, enter the public backend endpoint, and test it:

```text
http://localhost:8787/api/drawsplat/mysql
```

The wizard saves the endpoint in this browser and switches storage mode to `mysql`. The current static app does not yet sync boards through the MySQL API automatically; the endpoint and backend are the foundation for that next integration step.

## Production Notes

- Serve the backend over HTTPS.
- Keep `.env` out of Git.
- Do not expose MySQL directly to browsers.
- Add authentication before public use.
- Add role checks for teacher, student, and admin actions.
- Add request size limits appropriate for your deployment.
- Put media files in object storage or a protected filesystem path.
- Run `POST /maintenance/delete-expired` from a scheduled job, or convert that cleanup into a server-side cron task.
- Log administrative deletes and exports in `audit_events`.
