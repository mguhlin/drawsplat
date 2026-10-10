# DrawSplat district installation

The district administrator owns setup and roster imports. Teachers publish assignments and review their classes' turn-ins; students see enrolled classrooms and their own submissions. MariaDB and MySQL use the same saving API and whiteboard interface.

## Install

1. Download and extract [the current source ZIP](https://github.com/mguhlin/drawsplat/archive/refs/heads/main.zip). Install Docker Engine with Compose on Linux, or Docker Desktop on Windows/macOS. The first launch requires internet access to download container images.
2. Run `bash start-district.sh` on Linux/macOS, or double-click `start-district.bat` on Windows. MariaDB 11.8 is the default. To select MySQL 8.4 on the **first** launch, run `bash start-district.sh --mysql` or `start-district.bat --mysql`. Do not change database engines over an existing data volume.
3. Open `http://localhost:8080/setup`. Paste the setup key printed by the launcher. Leave database fields blank for the bundled database, or enter your existing empty MariaDB/MySQL database's host, username, password and database name. A remote database should use verified TLS. The database account needs schema migration permissions plus SELECT, INSERT, UPDATE and DELETE.
4. Test the connection and create the district administrator with a password of at least 12 characters. The service restarts automatically; `/setup` is then disabled. Settings are saved in the private configuration volume, not in browser storage.
5. Open `/admin/district-roster.html`, connect to the default API and sign in as the district administrator. Add a teacher and class, or preview and import a roster CSV. Required headers are `teacher_email,class_name`; optional headers are `teacher_name,student_email,student_name`. Repeat a teacher/class for each student. The sample CSV is linked on the page. Imports add memberships, preserve roles, and do not remove students absent from a new file. Conflicting existing roles roll back the entire import.
6. Teachers and students open `/app/whiteboard.html` and choose **File → Online classrooms**. Teachers publish the current board as an assignment; students open it, work on their copy, and turn it in. Teachers can open submissions and leave feedback. Account-based Save/Open remains available for private boards.

## Google sign-in

Create a Google OAuth **Web application** client for the district and add the exact site origin to its authorized JavaScript origins. Enter its client ID and allowed school email domains during setup. No Google client secret is needed for this browser ID-token flow. Teachers and students must first exist on the imported roster. Their verified Google email matches their assigned role; a client-supplied role cannot promote them. Public registration and invitation enrollment are disabled for district installations. The initial administrator can always use the installation's email/password login.

If Google is configured later, edit `GOOGLE_CLIENT_ID` and `GOOGLE_ALLOWED_DOMAINS` in the private `/data/config.json` inside the API container, then restart that service. Keep the file private and preserve every other setting, especially `DRAWSPLAT_PEPPER`. See [Google's client setup guidance](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Put the district installation on its own domain

Edit `selfhost/district/.env`: set `SITE_ADDRESS=whiteboard.your-district.org`, `SITE_ORIGIN=https://whiteboard.your-district.org` and `WEB_BIND=0.0.0.0`. Point that hostname at the server and allow ports 80 and 443. Run the launcher again. Caddy obtains and renews HTTPS certificates. Change Google authorized origins to match. Database and API ports are not published. The default installation listens on loopback only until the administrator chooses to expose it.

Keep `.env`, the setup key and configuration backups restricted to server administrators. On Windows, use a restricted folder and NTFS permissions; POSIX file modes do not replace Windows access controls. Never publish these files with the static site.

## Updates, backup and recovery

Keep the same installation directory, Compose project name, private `.env`, and Docker volumes when updating source. Rerun the launcher; versioned schema migrations are applied once and safely resume after interruptions. Test upgrades and recovery on a separate instance first. Use `docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml down` to stop services. Do not add `--volumes` unless intentionally deleting all district data.

Run `bash selfhost/district/backup-district.sh` (Windows: `selfhost\district\backup-district.bat`). This creates a dated private directory with a consistent SQL export and the configuration containing the password pepper. Store encrypted off-server copies and restrict administrator access. Backups contain student records and credentials. Restore requires **both** the SQL and matching configuration. Instructions are in `selfhost/district/RESTORE.md`.

The public drawsplat.org frontend does not host a district's MariaDB service. Each district owns its API, database, Google client, backups, retention decisions and server administration. This release establishes classroom workflows; real Google login and a district's own HTTPS/domain configuration must be checked in that deployment before classroom rollout.
