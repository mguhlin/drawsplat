# Local MariaDB installation and operations

The development laptop runs MariaDB on 127.0.0.1:3306 and DrawSplat at http://localhost:8787. Open http://localhost:8787/admin/district-roster.html for district administration. The API is http://localhost:8787/api/drawsplat/mysql. Administrator login details are stored in the private `~/.config/drawsplat-local/login.txt`; they are not included in the repository.

The user service `drawsplat-local.service` starts on login and remains available after logout with user lingering enabled. Use `systemctl --user status drawsplat-local`, `systemctl --user restart drawsplat-local`, and `journalctl --user -u drawsplat-local` to operate it. Runtime credentials in `~/.config/drawsplat-local/api.env` have data-only permissions; a separate migrator updates the schema. The development integration database is separate from saved local boards.

`drawsplat-backup.timer` runs daily at 03:15. `systemctl --user start drawsplat-backup.service` creates a manual backup. Database exports and checksum files are in `~/.local/share/drawsplat/backups`. Each new backup includes a private `.config.env` snapshot with the matching password pepper; keep it with its SQL export for recovery. Google sign-in requires a district Web Client ID; CSV provisioning works independently.

For portable district deployment, use [the district installation guide](district-selfhost.md). Both MariaDB and MySQL use `/api/drawsplat/mysql`; the provider name remains `mysql` for frontend compatibility. JSON handling accepts MariaDB text JSON and MySQL native JSON. There are no MariaDB-specific frontend credentials.
