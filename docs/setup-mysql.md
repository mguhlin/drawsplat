# DrawSplat&trade; — MySQL Backend Setup

Use this when you want **a self-hosted, district-scale deployment** with a real database instead of Google Apps Script. Trades the zero-infrastructure simplicity of the Apps Script path for higher throughput, true RBAC, and an installation that lives entirely on your own servers.

> ⚠️ **Status: scaffolded but not yet exercised against a live database.** The schema and Express server exist; nobody has run them in production yet. Expect bugs the first time you bring it up. The Apps Script path is the supported production option until this has been hardened against a real deployment.

## What you get

- MySQL 8.x stores boards, rooms, audit events, users, sessions, parent requests, time-usage counters, image-upload queue.
- Node + Express HTTP API on port 8787.
- bearer-token auth with scrypt-pepper passwords.
- Role-based access control (district_admin / campus_admin / teacher / student / parent).
- Conservative API hardening: security headers, request-size caps, rate limits, validated room keys, and admin bootstrap controls.
- Same compliance surface as the Apps Script path (parent requests, age band, time limits, audit, config push).

## What's still TODO before this can replace Apps Script

These are listed in [`server/mysql-backend/README.md`](../server/mysql-backend/README.md). Short version:

- OAuth (Google / Microsoft) sign-in — only email/password is wired.
- Per-board compliance gates (age band, freeze, time limits) on the legacy room/board endpoints.
- Scheduled retention cron (the Apps Script trigger equivalent).
- District Privacy Packet generator (server-side ZIP).
- SSE / WebSocket for real-time session enforcement.
- Integration tests against a real MySQL instance.

## Prerequisites

- A Linux server with Docker + Docker Compose installed (or your own MySQL + Node hosting if you'd rather skip Docker).
- A domain name you control, with TLS in front of it (a reverse proxy — Caddy, Traefik, Nginx, Cloudflare Tunnel — terminates HTTPS).
- 15–30 minutes for first-time setup.

## Quick start (Docker, recommended)

```bash
cd server/mysql-backend
cp .env.example .env

# Edit .env. At minimum change:
#   MYSQL_ROOT_PASSWORD
#   MYSQL_PASSWORD
#   DRAWSPLAT_PEPPER          (long random string — peppers password hashes)
#   CORS_ORIGIN               (your exact DrawSplat frontend origin)

docker compose up -d
docker compose logs -f api
```

The compose file applies `schema.sql` and `migrations/002_compliance.sql` on first boot of the MySQL container. The API starts on `http://localhost:8787` (or whatever you set as `API_HOST_PORT`).

## Quick start (manual, no Docker)

If you'd rather run MySQL elsewhere:

```bash
# In MySQL:
CREATE DATABASE drawsplat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'drawsplat_app'@'%' IDENTIFIED BY 'change-me-app';
GRANT ALL PRIVILEGES ON drawsplat.* TO 'drawsplat_app'@'%';
FLUSH PRIVILEGES;

mysql -u drawsplat_app -p drawsplat < server/mysql-backend/schema.sql
mysql -u drawsplat_app -p drawsplat < server/mysql-backend/migrations/002_compliance.sql
```

Then in `server/mysql-backend/`:

```bash
cp .env.example .env
# Edit .env — point MYSQL_HOST / MYSQL_USER / MYSQL_PASSWORD at the database above.
npm install --omit=dev
node server.js
```

## Reverse-proxy / TLS

The Node API has no HTTPS of its own. Put it behind something that does:

### Caddy (simplest)

```
yourdomain.org {
  reverse_proxy /api/* localhost:8787
  root * /var/www/drawsplat
  file_server
}
```

That serves the static DrawSplat site from `/var/www/drawsplat` and proxies `/api/*` to the Node API.

### Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.org;
  ssl_certificate /etc/letsencrypt/live/yourdomain.org/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.org/privkey.pem;

  root /var/www/drawsplat;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8787/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## Point the frontend at the MySQL backend

The DrawSplat frontend currently supports the Apps Script backend natively. Pointing it at MySQL requires a small swap.

Until the MySQL frontend path is finished, you have two interim options:

1. **Hybrid (recommended)** — keep using Apps Script for the whiteboard; use MySQL only for any new Phase 4-specific work (district SSO, real-time enforcement). The two backends share no state.
2. **All-in MySQL (advanced)** — modify `assets/js/admin.js` and `assets/js/app.js` to call the MySQL endpoints documented in [`server/mysql-backend/README.md`](../server/mysql-backend/README.md) instead of the Apps Script `/exec` URL. This is a fork-and-PR scope of work right now.

The Apps Script path remains fully functional throughout. There is no requirement to migrate.

## Operational checklist

- [ ] `.env` populated with rotation-safe secrets (especially `DRAWSPLAT_PEPPER`).
- [ ] First admin user created by temporarily setting `ALLOW_ADMIN_SELF_REGISTRATION=true` and `BOOTSTRAP_ADMIN_EMAILS=admin@example.org`, then calling `POST /api/drawsplat/mysql/auth/register` with that email and `role: "district_admin"`. Turn admin self-registration off immediately after bootstrap.
- [ ] CORS origin set to your actual frontend hostname.
- [ ] Reverse proxy in front of the API. The API does not terminate TLS.
- [ ] Automated database backups configured. Apps Script's "your data is in your Google Drive" property is the convenience the MySQL path gives up.
- [ ] Cron job or in-process scheduler to call retention cleanup (until the cron is built into the Node app).

## Required follow-on work for production

Pull requests welcome on any of these. They are noted as gaps so a district doesn't deploy this assuming it's feature-complete.

1. **OAuth providers.** Port the Community Apps Script verifier (Google `tokeninfo`, Microsoft Graph `/me`) into a `compliance-routes` mini-module.
2. **Frontend backend switch.** A `BACKEND=mysql|apps-script` setting on the admin page, with parallel code paths in `app.js` and `admin.js`.
3. **Per-board compliance gates.** Wrap the existing `POST /rooms/.../save` endpoints in the same scan-and-gate logic the Apps Script `saveBoard_` does (text filter, age band, freeze, time limit).
4. **Cron retention.** A `node-cron` or system-cron job that nightly executes the equivalent of `runRetentionCleanup_` (archive, delete, prune audit).
5. **SSE channel.** A `GET /api/drawsplat/mysql/events?token=...` endpoint that pushes session-lock and freeze events to active student clients.
6. **Integration tests.** A docker-compose-driven test harness that spins MySQL, runs the migrations, and exercises every endpoint with supertest.

## Cost expectations

A small VPS ($5–20/month) is enough for a campus deployment. District-scale (thousands of students) wants 2–4 GB RAM and tuned MySQL — the Express server itself stays small.

If you can't run your own servers, the Apps Script path is free and runs on Google's infrastructure.
