# MySQL online saving: Railway, DigitalOcean, or your own server

DrawSplat's static whiteboard can stay at drawsplat.org. A separate Node.js API
stores account-owned boards in MySQL. Moving between hosts changes the server's
database settings and the public API address; it does not require frontend code
changes. The browser receives a short-lived account token, never database credentials.

## What works

- **File → Save online:** saves the current board, including its pages and media.
- **File → Open online board:** lists and opens boards belonging to the signed-in account.
- **File → Online account:** signs in or signs out. Sign-in is stored in the current tab's session storage.
- Revision checks reject competing saves from another device rather than silently replacing work.
- Device autosave and **File → Save File** remain available when the service is offline.
- Schema migrations run automatically and preserve existing data.

This connection provides private Save/Open, not automatic cross-device collaboration.
Google room sync, turn-in, moderation, and Google template galleries are separate
features and are not routed to MySQL. Older backend room/template/turn-in endpoints
now require a district/campus administrator; do not expose them as classroom-sharing
APIs without adding explicit membership checks.

MySQL 8.0 or 8.4 is the supported database family. Other compatible servers must
support the bundled JSON, schema, and locking features and should be tested first.

## Railway: least server administration

1. Create a Railway project and add its **MySQL** database service.
2. Add a service from the DrawSplat GitHub repository. Set its **Root Directory** to
   `server/mysql-backend`. The bundled Dockerfile and `railway.toml` configure deployment.
3. In the API service's Variables tab, set:

   ```text
   MYSQL_URL=${{MySQL.MYSQL_URL}}
   CORS_ORIGIN=https://drawsplat.org
   DRAWSPLAT_PEPPER=<a unique long random secret>
   NODE_ENV=production
   TRUST_PROXY=true
   ```

   Adjust `MySQL` if you gave the database service another name. Use its private
   address for connections within the same project. Do not copy database URLs into
   the DrawSplat frontend. Use at least 32 characters (for example, generate it with `openssl rand -hex 32`) and keep the pepper stable across redeploys.
4. Generate a public HTTPS domain for the API service. Railway supplies `PORT`.
5. Wait for the health check, then connect using the wizard below. Keep the default API path, or update the host health-check path to match any custom `API_BASE_PATH`.
6. Configure database backups and monitor Railway resource usage before classroom use.

References: [Railway MySQL](https://docs.railway.com/databases/mysql),
[repository root directories](https://docs.railway.com/deployments/monorepo),
[health checks](https://docs.railway.com/deployments/healthchecks).

## DigitalOcean Droplet: API and database on one server

On a server with Docker Compose installed:

```bash
git clone https://github.com/mguhlin/drawsplat.git
cd drawsplat/server/mysql-backend
cp .env.example .env
```

Edit `.env`: replace both database passwords and `DRAWSPLAT_PEPPER` with unique
secrets, set `CORS_ORIGIN` to your whiteboard origin, and add
`API_DOMAIN=api.your-school.example`. Point that hostname's DNS to the server and
allow inbound ports 80/443. Keep `PORT=8787` for the bundled reverse proxy.

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```

Caddy provides HTTPS. MySQL has no published host port; the API's direct host port
binds only to loopback. Database and certificate volumes survive container recreation.
Never run `docker compose down -v` unless you intend to delete those volumes.

Keep the server patched and arrange off-server backups. For example, from this
folder, make a restricted local SQL backup before copying it to secure storage:

```bash
umask 077
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysqldump -u "$MYSQL_USER" --single-transaction --no-tablespaces "$MYSQL_DATABASE"' > drawsplat-backup.sql
```

Test restoring backups in a separate database. A backup on the same Droplet alone
will not protect against loss of that server.

## DigitalOcean App Platform or an existing MySQL server

Deploy the repository’s `server/mysql-backend` directory as a Docker service (set the platform’s source/root directory to this folder), or run it with Node.js 22 or newer:

```bash
npm ci --omit=dev
npm start
```

Provide either `MYSQL_URL` / `DATABASE_URL` (a `mysql://` URL) or the separate
`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` settings.
Passwords in a URL must be percent-encoded. Railway's `MYSQLHOST`, `MYSQLPORT`,
`MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD` aliases are also accepted.

For a remote managed database, enable `MYSQL_SSL=true`; certificates are verified.
Provide its CA using `MYSQL_SSL_CA` (PEM text) or `MYSQL_SSL_CA_FILE` (a server-side
file path) when required. DigitalOcean's managed MySQL connection settings include
its port and downloadable CA certificate. Add the API service to the database's
trusted sources. Never disable certificate verification to work around a CA error.

Create the empty database beforehand and grant its application user permission
for tables, indexes, and schema migrations. Set `CORS_ORIGIN`, `DRAWSPLAT_PEPPER`,
`NODE_ENV=production`, and `TRUST_PROXY=true` behind a trusted HTTPS proxy. Host
platforms can supply `PORT`; the service binds to all interfaces inside its container.

For API-only Docker deployment, put those settings in `.env` and use:

```bash
docker compose -f docker-compose.external.yml up -d --build
```

Add `-f docker-compose.https.yml` if you need the bundled HTTPS proxy. An external
CA file must be mounted into the API container, or supplied as the `MYSQL_SSL_CA`
environment variable. Deploy one API instance for the bundled in-process scheduled
jobs, or set `DRAWSPLAT_CRON=0` on extra instances.

References: [App Platform Docker deployments](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/nodejs/),
[managed MySQL connection settings](https://docs.digitalocean.com/products/databases/mysql/how-to/connect/).

## Connect the whiteboard

1. Open **Teacher Admin → Advanced settings → Open MySQL Wizard**.
2. Enter the public API address, including `/api/drawsplat/mysql`, such as
   `https://your-api.example/api/drawsplat/mysql`.
3. Click **Test & Enable Online Saving**. An older incompatible backend or failed
   connection leaves the previous storage choice intact.
4. Create a teacher saving account in the wizard, or use one provisioned by your school.
   This is separate from the Teacher Admin password. Student accounts should be
   school-provisioned; public registration is for teachers/parents.
5. Open the whiteboard and use **File → Save online**. Sign in when prompted.
6. Reload and use **File → Open online board** to verify the saved work.
7. Sign out using **File → Online account** when leaving a shared device.

Each browser needs its connection configured. A school may share a launch URL with
`?storage=mysql&api=<URL-encoded public API address>`; it must contain no database
credentials or bearer tokens. The whiteboard’s **Create Student Link** button also
copies a MySQL saving connection link; it does not share the teacher’s private board. The sign-in dialog identifies the saving service's host.

If another device saved a newer copy, download your current board using **Save File**,
then open the online copy before continuing. Changing providers does not automatically
move data: restore your MySQL backup at the new host and keep the same pepper to
preserve password hashes. If starting with an empty database, create new accounts and
upload saved board files instead.

## Storage limits and operational checks

The default API limit is 20 MB per board and a five-connection pool. Configure
`MAX_BOARD_JSON_BYTES` and `MYSQL_CONNECTION_LIMIT` on the server for your deployment.
Recordings currently travel inside board JSON, so many video notes increase storage
and network use. Dedicated object storage is a future improvement, not part of this
connection. Private boards retain their current copy until deleted; there is no
automatic expiry applied to this new table.

API connections use UTC for session expiration and timestamps, regardless of the database host’s default timezone.

The health endpoint tests the database connection and advertises `private-boards-v1`.
Use that path for host health checks. For restricted runtime database users, run
`npm run migrate` with a schema-capable user first, then deploy with `AUTO_MIGRATE=false`.
Back up before migrations. Real-database integration checks can be run against a
**disposable test database**:

```bash
MYSQL_TEST_URL=mysql://user:password@localhost:3306/disposable_test npm test
```

Do not run integration checks against a classroom database; they create test accounts
and boards. Advanced OAuth, SIS, district policy, and realtime integrations need their
own operational validation before schoolwide adoption.
