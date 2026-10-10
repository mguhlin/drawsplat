# Restore a district backup

The provided backup launchers export the **bundled** database and installed configuration. When the web wizard points to an external database, use that database host's backup/restore tools instead; the bundled database export does not contain external records. Save the matching `/data/config.json` privately in either case.

Test recovery on a separate server before relying on backups. Stop teachers and students from writing while recovering. Do not restore into an unrelated or populated database. Use the same database engine and version initially. SQL imports can replace data: the administrator should review the chosen backup first.

1. Install the same DrawSplat source and Docker stack on the recovery server, preserving a copy of the original private `.env`. Start the database and configuration initializer, without running the web setup wizard.
2. Copy `database.sql` into the database container with Compose `cp`. Import it with `mariadb` (or `mysql`) into the `drawsplat` database using the database administrator account. Keep passwords in the container's environment, not command arguments or shell history.
3. Copy the matching backup's `config.json` to `/data/config.json` in the API container. Ensure owner 1000:1000, mode 600. Its database host/user/password must match the recovered server; preserve `DRAWSPLAT_PEPPER` so existing account passwords continue working.
4. Start/restart the API and web services. Confirm `/api/drawsplat/mysql/health`, district admin sign-in, roster counts, a saved board, assignment, student submission and feedback. Confirm the backup timestamp meets the district's recovery requirement.

Keep backups encrypted off-server and restrict access to district administrators. Never commit backups. A SQL dump alone cannot recover password authentication without its matching private configuration.
