# DrawSplatTM MySQL Backend

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
