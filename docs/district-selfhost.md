# SplatWorks ecosystem district installation

**Current documentation:** [SplatWorks Wiki](https://drawsplat.org/wiki/) — setup, installation, licensing, pricing, OAuth, and district privacy review.


[View HTML](district-selfhost.html) · [Download Markdown](district-selfhost.md)

Install the complete SplatWorks ecosystem: the whiteboard, standalone tools and widgets, games, and SplatWorks. Choose the components your district needs, create its administrator account, and set up teacher and student classrooms. MariaDB/MySQL powers whiteboard accounts, saved boards, and classroom workflows; other components keep their own storage and optional integrations. [Explore component features by category](../wiki/tools-widgets-features.html).

## Quick Start

Open **start-here.html** immediately after extracting the **complete DrawSplat + SplatWorks suite**. The same guided setup is available at the top of [the HTML guide](district-selfhost.html#quick-start-hub).

1. Choose **Docker (preferred)** or **Without Docker** at the top of the checklist. Docker manages the services together; native installation uses software installed directly on your server.
2. Review the component checkboxes. The whiteboard, all four SplatWorks apps, tools, widgets and games are **checked by default**. Uncheck anything your district does not want to serve.
3. Choose MariaDB or MySQL and optionally enter your district hostname.
4. Select **Save plan in extracted folder** in a supported browser and choose the extracted package folder or its inner `drawsplat` folder. The page saves into the application folder automatically. Alternatively, select **Download installation plan** and save `drawsplat-district-plan.json` inside the `drawsplat` folder next to `start-district.sh`.
5. Open the inner `drawsplat` folder. **Docker:** run `bash start-district.sh` or `start-district.bat`. **Without Docker:** follow [native setup](#install-without-docker), run `bash start-native.sh` or `start-native.bat`. If you skip the plan, every component is enabled.
6. Follow the hub’s checklist: database connection, district administrator credentials, optional Google sign-in, teachers and rosters, school settings, component verification, HTTPS and tested backups.

**Rerun whenever needed:** reopen start-here.html, load your previous plan or review the saved choices, download the updated plan into the installation folder, and rerun the preparation/startup steps for your chosen path. Existing passwords, accounts, saved work and database volumes are preserved. Unchecked components are blocked at the district web gateway; their files are retained so you can enable them later. Changing database engines or moving between Docker and native hosting requires a planned migration; changing this selector does not transfer existing data.

Component selection applies to standalone app entry routes. Supporting assets and whiteboard-embedded features remain available. The district MariaDB/MySQL service powers whiteboard accounts, classrooms and turn-ins. Other tools retain their existing storage and integration behavior; selecting them does not convert their storage to MariaDB. Test each selected tool and its permissions before classroom rollout.

## Before you start

### Who uses each account?

| Account | What it does | Where to sign in |
| --- | --- | --- |
| District administrator | Installs DrawSplat and manages teachers, rosters, and classrooms | `/admin/district-roster.html` |
| Teacher | Shares assignments and reviews classroom turn-ins | `/app/whiteboard.html` |
| Student | Opens enrolled classrooms and submits their own work | `/app/whiteboard.html` |

The **district administrator login** is separate from the **Teacher Admin unlock password**. Teachers and students cannot manage district rosters.

### What you need

- A district server or computer with administrator access.
- **Docker path:** Docker Engine with the `docker compose` plugin on Linux, or Docker Desktop using Linux containers on Windows/macOS.
- **Native path:** Node.js 22 or newer, MariaDB 11.8 or MySQL 8.4, and Caddy 2 installed directly on the server.
- Internet access to install software and dependencies. Some apps also need optional online services or initial model downloads.
- **Docker:** a bundled database is created for you unless you connect an external database. **Native:** create an empty database and its application user before web setup.
- A Google OAuth Web Client ID if you want teachers and students to use Google sign-in. You can configure it later.

**Hosting:** drawsplat.org provides the public frontend and source download. It does not host your district’s MariaDB service. Your district operates its own API, database, Google client, backups, and server.

### Server readiness and private storage

#### Software checks

- **Docker:** start Docker and confirm the `docker compose` plugin and Linux containers work. The launcher supplies the Node runtime, database and gateway.
- **Without Docker:** install Node.js 22 or newer, MariaDB 11.8 or MySQL 8.4, and Caddy 2. Confirm each command is available before continuing.
- Use a current browser for setup and classroom testing.

#### Capacity planning

- Allow space for the extracted suite, growing database storage and several backups.
- **Docker:** also allow space for downloaded container images and volumes.
- Test the number of simultaneous classrooms you expect; validated production CPU/RAM and concurrent-user minimums are not yet available.
- Test media tools on student devices: editing performance depends on the browser and device as well as the server.

#### File permissions and private storage

- Allow only server administrators to change application code and gateway configuration.
- Keep secrets, database files and backups private. Never put backups in a publicly served folder.
- **Docker:** application files are mounted read-only; database and API configuration are stored in private volumes. Keep `.env` restricted and never make the Docker socket world-writable.
- **Without Docker:** restrict `selfhost/district/native-private/` to the account running the API. It holds settings and credentials. Allow the gateway account to read application files and `native-web/`, without write access to them or access to `native-private/`.
- Use the supplied gateway configuration. If you configure another web server, apply equivalent private-path blocks and app-specific browser headers.
- On Windows, apply NTFS permissions; POSIX file modes alone do not enforce access control.

#### Existing or native database access

- Create an empty database using `utf8mb4` encoding.
- Create a dedicated application user restricted to that database; do not enter the database root account in the web installer.
- Grant record access and the permissions needed for schema migrations.
- Test the connection from the actual API host. With Docker, that means the API container; without Docker, it means the native server account.
- For remote database connections, use verified TLS and the server's trusted CA certificate when required.

## Install Docker

Use this section for the **Docker (preferred)** path. If Docker is already installed, skip to [Verify Docker is ready](#verify-docker-is-ready).

### Windows

1. Check your computer against the [Docker Desktop Windows requirements and installer](https://docs.docker.com/desktop/setup/install/windows-install/). Enable hardware virtualization in BIOS/UEFI if needed.
2. For the WSL 2 backend, open an administrator terminal. If WSL is not installed, run `wsl --install` and restart when prompted. Update an existing installation with `wsl --update`.
3. Download Docker Desktop for your processor, run its installer, and choose the WSL 2 backend. Complete any requested restart.
4. Open **Docker Desktop** from Start and complete its first-run prompts. Wait for the engine to finish starting.
5. Use **Linux containers**. If the Docker tray menu offers “Switch to Linux containers,” select it.
6. Open a new terminal and run the readiness checks below. Keep Docker Desktop running while DrawSplat is in use; configure startup according to your district's workstation policy.

Docker Desktop does not support Windows Server. For that host, use a supported Linux VM running Docker Engine or the native installation path.

### macOS

1. Open the [Docker Desktop Mac installer](https://docs.docker.com/desktop/setup/install/mac-install/) and choose **Apple silicon** or **Intel** for your Mac.
2. Open the downloaded `.dmg` and drag Docker into **Applications**.
3. Open **Docker** from Applications and finish the first-run prompts. Wait for its engine to start.
4. Open a new Terminal window and run the readiness checks below. Keep Docker Desktop running during use and configure its startup settings for your host.

### Linux

1. Choose your distribution in the [Docker Engine installation guide](https://docs.docker.com/engine/install/). Install from Docker's supported repository, including the **Compose plugin**.
2. For Ubuntu, the repository setup and installation commands below follow the [Ubuntu installation guide](https://docs.docker.com/engine/install/ubuntu/). Use your distribution's instructions instead for Debian, Fedora or another system. Resolve any existing conflicting container packages as directed there before installation.

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

3. Give only the authorized installation administrator access to Docker. If your district uses the `docker` group, add that administrator, then sign out and back in:

```bash
sudo usermod -aG docker "$USER"
```

The Docker group grants administrative control of the host. Never solve a permission error by making the Docker socket world-writable. If your district requires using `sudo` instead, run the DrawSplat Bash launcher with `sudo bash start-district.sh` and manage the resulting administrator-owned installation consistently.

### Verify Docker is ready

Run these in a fresh terminal under the account that will launch DrawSplat:

```bash
docker version
docker compose version
docker info --format '{{.OSType}}'
docker run --rm hello-world
```

- `docker version` should report both the client and server. A server connection error usually means Docker is stopped or your account lacks access.
- `docker compose version` should report Compose **v2**.
- The OS type should be **linux**.
- `hello-world` should download and run successfully. If it cannot download, check your district's proxy, DNS and container-registry access.

Once all four checks pass, return to Quick Start, save your installation plan and run the DrawSplat launcher. Docker already supplies Node, Caddy and the bundled database for this path.

## Install DrawSplat

**Docker path (preferred).** For the alternative, go to [Install without Docker](#install-without-docker). The account, roster and classroom steps are shared by both paths.

### 1. Download and extract the source

[Download the complete DrawSplat + SplatWorks district suite ZIP](https://github.com/mguhlin/drawsplat/releases/download/district-suite-v1.2.4/drawsplat-district-suite-v1.2.4.zip). The [current source archive](https://github.com/mguhlin/drawsplat/archive/refs/heads/main.zip) also contains the complete suite.

The district suite contains just `start-here.html` and a `drawsplat` folder at its top level. Open the HTML page first; it includes the complete guide and Quick Start. Keep it beside that folder so its artwork and interactive checkboxes load. The source archive has a developer-oriented layout instead.

For commands and installation plans, open the inner `drawsplat` folder containing `start-district.sh` and `start-district.bat`. For this path, install and start Docker before continuing.

### Verify the download

Download the matching `.zip.sha256` file from the district release. Verify the ZIP before extraction:

```bash
sha256sum -c drawsplat-district-suite-v1.2.4.zip.sha256
```

On macOS, use `shasum -a 256` on the ZIP and compare with the checksum file. In Windows PowerShell, run `Get-FileHash .\drawsplat-district-suite-v1.2.4.zip -Algorithm SHA256` and compare the result with that file. Extract the entire archive, rather than only the HTML page.

### Debian: one staged Docker preparation

On a fresh Debian 12/13 computer, open a terminal in the inner `drawsplat/` folder and run:

```bash
sudo bash scripts/install-docker-debian.sh
```

The helper groups preparation into three chapters: inspect the host, install from Docker’s official repository when needed, and verify the daemon, Linux containers, Compose launcher options and `hello-world`. It reuses an existing Docker installation and stops for review if conflicting packages or an existing repository are present. It does not remove packages, reset Docker, or touch your DrawSplat database or volumes. Read the helper before running it; [Docker’s Debian instructions](https://docs.docker.com/engine/install/debian/) explain its repository steps.

After it succeeds, return to Quick Start and run `sudo bash start-district.sh` from the same folder, or use your authorized Docker-enabled account. Keep the same account and folder for reruns. A working `docker compose` command with `up --wait --wait-timeout` support is required; its displayed major version need not be 2.

### Apply a downloaded installation plan

The browser’s Download button creates a file; it does not apply the plan. If the file remains in Downloads, pass it directly to the launcher from the inner `drawsplat/` folder:

```bash
bash start-district.sh --plan "$HOME/Downloads/drawsplat-district-plan.json"
```

```bat
start-district.bat --plan "%USERPROFILE%\Downloads\drawsplat-district-plan.json"
```

The launcher validates and copies the selected plan beside itself. It reports **Applied plan**, hosting path, database engine, component count and address. If no saved plan exists, it explicitly reports the defaults. A plan that selects another database engine is refused for an existing installation. You can still use the folder picker or move the plan beside the launcher manually.

### 2. Run the launcher

**Linux or macOS** — open a terminal in the extracted folder:

```bash
bash start-district.sh
```

**Windows** — double-click `start-district.bat`, or run this from a command prompt in the extracted folder:

```bat
start-district.bat
```

The default database is **MariaDB 11.8**. To choose **MySQL 8.4**, use one of these commands on the **first launch**:

```bash
bash start-district.sh --mysql
```

```bat
start-district.bat --mysql
```

Do not switch database engines over an existing data volume. Keep the setup key printed by the launcher privately—you need it in the next step. Before copying a terminal screenshot or starting a recording, hide the key.

### 3. Connect the database in the web installer

Open [http://localhost:8080/setup](http://localhost:8080/setup) on the server computer. Paste the setup key printed by the launcher privately.

**Bundled Docker database:** keep **Bundled database** selected. Its generated connection stays on the server; database fields are hidden and ignored even if a password manager tries to fill them. Test the connection, then choose your administrator credentials. You do not need to know the database login.

**Your own database or native installation:** select **My own database** and enter the provisioned connection settings. These credentials are separate from the district administrator login. Native setup selects this mode automatically.

Connection errors include safe recovery instructions and a diagnostic code, without showing passwords. A healthy database container does not prove API authentication works. Never reset an existing volume to fix an authentication error.

| Database choice | What to enter |
| --- | --- |
| Bundled database | Keep Bundled database selected; connection fields are hidden and ignored |
| Existing database | Enter the host, port, empty database name, username, and password |
| Remote database | Use verified TLS; provide the CA certificate if required |

The database account needs schema migration permissions, plus `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. Select **Test connection** before finishing setup.

### 4. Choose the district administrator credentials

The installer displays these starter credentials:

| Field | Starter value |
| --- | --- |
| Administrator email | `admin@localhost.test` |
| Password | A unique generated password, masked until you choose Show administrator password |

The password is hidden by default. Reveal or copy it only privately, with recording paused. Use these credentials or replace either field. A replacement password must have **at least 12 characters**. This account manages district rosters; it is not a teacher or student account.

Select **Finish setup**. On the completion screen, select **Copy login details** and save them with your server installation records.

The service restarts automatically. The `/setup` screen is then disabled, and settings are saved in the private configuration volume. Existing installations continue to use their current credentials.

### 5. Add teachers and import classroom rosters

Open [http://localhost:8080/admin/district-roster.html](http://localhost:8080/admin/district-roster.html), or the same path on your district’s domain.

Select **Connect and sign in**. Use the district administrator email and password from step 4. If someone else installed the server, ask that person for the administrator login.

You can add a teacher and classroom manually, or import a CSV roster. [Download the sample roster CSV](../assets/examples/district-roster.csv).

| CSV column | Required? | Example |
| --- | --- | --- |
| `teacher_email` | Yes | `teacher@school.example` |
| `class_name` | Yes | `Science 6` |
| `teacher_name` | No | `Ms. Rivera` |
| `student_email` | No | `student@school.example` |
| `student_name` | No | `Sam Lee` |

Repeat the teacher and class for each student row. Each import accepts up to **2,000 rows** in a file up to **1 MB**.

1. Choose the CSV file.
2. Select **Preview import** and review the teacher, classroom, and student counts. Nothing is written yet.
3. Select **Import roster** to create accounts, classrooms, and enrollments.

Reimporting the same rows adds no duplicates. Imports preserve existing roles and add memberships; they do **not** remove students who are absent from a newer file. A conflicting existing account role rolls back the entire import.

### 6. Share assignments and collect turn-ins

Teachers and students open `/app/whiteboard.html` and select **File → Online classrooms**.

- **Teachers:** publish the current board as an assignment, open student submissions, and leave feedback.
- **Students:** open an enrolled class, work on their own copy of an assignment, and turn in the current board.
- **Private boards:** account-based Save/Open remains available alongside classroom assignments.

## Install without Docker

Use this path when your district manages the database, Node service and web gateway directly. Run commands from the inner `drawsplat` application folder. Keep Docker and native installations in separate folders; switching paths does not migrate an existing database or administrator account.

### Native software and database

1. Install [Node.js](https://nodejs.org/en/download) **22 or newer** with npm.
2. Install **MariaDB 11.8** using its [server installation guide](https://mariadb.com/docs/server/mariadb-quickstart-guides/installing-mariadb-server-guide), or **MySQL 8.4**. Start the database service. Configure `max_allowed_packet` to at least **32 MB** for whiteboard saves.
3. Install **Caddy 2** using the [installation instructions](https://caddyserver.com/docs/install). An existing district reverse proxy can replace it only if you reproduce the supplied route restrictions, component choices, app headers and API routing.
4. Check the installed commands:

```bash
node --version
npm --version
caddy version
```

Connect to the database as its administrator (`sudo mariadb` on a typical Linux MariaDB installation, or `mariadb -u root -p` / `mysql -u root -p` as appropriate). Replace the sample password below with a unique password you keep privately. These SQL statements create a **new** installation; do not run them to replace existing district data:

```sql
CREATE DATABASE drawsplat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'drawsplat_app'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_A_UNIQUE_DATABASE_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON drawsplat.* TO 'drawsplat_app'@'127.0.0.1';
```

This example uses TCP on `127.0.0.1:3306`. If you use a remote database, have its administrator provision an equivalent database-specific user for your API host and provide verified TLS settings. The database password is separate from the district administrator's login password.

**Optional manual database import:** [Download the starter SQL](../downloads/drawsplat-starter.sql) to preload all tables and basic settings into a new empty database with phpMyAdmin or the database command line. [Follow the import instructions](../wiki/setup-mysql.html#optional-manual-installation-import-the-starter-sql), then continue with the launcher and /setup to create your administrator. Automatic setup already creates these tables; importing is optional.

### Native prepare and start

After installing Node.js, MariaDB/MySQL and Caddy and provisioning the database:

1. Select **Without Docker** in Quick Start, choose the same database engine, and save the plan inside `drawsplat/`. Keep the hostname blank for a local trial.
2. Open a terminal in the inner `drawsplat/` folder and run one launcher:

```bash
bash start-native.sh
```

```bat
start-native.bat
```

The launcher installs the Node API dependencies, prepares settings, validates the gateway and starts both the API and Caddy. It opens the local setup hub after the service responds. Keep this one terminal open during the local trial; **Ctrl+C stops both services**. The database remains its own OS service. An occupied port produces an error instead of stopping another application.

The default ports are API **8787** and web **8080**. If another app uses them, choose alternatives on the first launch:

```bash
bash start-native.sh --api-port 8788 --web-port 8081
```

Use the address printed by the launcher. Without a plan it enables all components and assumes MariaDB; add `--mysql` on the first launch to select MySQL. Reruns preserve the setup key and private configuration, refuse a database-engine change, and do not create, delete or modify your database.

3. Open `/setup` at the printed address and paste the private setup key. Native setup selects **My own database**. Enter your provisioned database details:

| Field | Local database example |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `3306` |
| Database | `drawsplat` |
| Username | `drawsplat_app` |
| Password | The unique database password you created |
| Verified database TLS | Enable for a remote database and supply its CA when required |

4. Test the connection, choose and privately save the administrator credentials, and finish setup. The API restarts automatically. Complete the shared administrator, roster, classroom and Google sign-in steps. Ready services alone do not verify installation.

Native setup creates `selfhost/district/native-private/settings.json` and `config.json`. Keep both private and preserve them when upgrading; the configuration includes the database login and password pepper. Generated gateway rules are in `native-web/`.

For managed services or troubleshooting, the separate commands remain available:

```bash
npm ci --omit=dev --prefix server/mysql-backend
node selfhost/district/prepare-native.js
node selfhost/district/run-native.js
```

Start the gateway separately in another terminal when using those commands:

```bash
caddy run --config selfhost/district/native-web/Caddyfile --adapter caddyfile
```

Do not run the combined launcher beside those same managed services. For unattended operation, configure the OS services below.

### Native services and HTTPS

**Linux:** run the API under a dedicated service account with access to its private configuration. A systemd service can use this template; replace the username, application location and Node path with your installation's values:

```ini
[Unit]
Description=DrawSplat district API
After=network.target

[Service]
Type=simple
User=drawsplat
WorkingDirectory=/opt/drawsplat
ExecStart=/usr/bin/node /opt/drawsplat/selfhost/district/run-native.js
Restart=always
RestartSec=3
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Save it as `/etc/systemd/system/drawsplat-district-api.service`, then enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now drawsplat-district-api
```

Use [Caddy's service instructions](https://caddyserver.com/docs/running) for the gateway. Point its service configuration at the generated `native-web/Caddyfile`, give its account read access to application files and gateway rules, and keep its certificate storage private. Caddy's service needs permission to bind ports 80/443 for a district HTTPS domain. The API remains bound to localhost.

**Windows:** run the API and Caddy using your district's Windows service manager or startup tasks configured to run even when no administrator is signed in. Use the two native startup commands above, set the application folder as the working directory, use an account with the required NTFS permissions, and configure restart after failure. See [Caddy's Windows service instructions](https://caddyserver.com/docs/running). Configure MariaDB/MySQL to start automatically too.

**macOS:** use launchd or your managed-service tooling for Node, Caddy and the database. Set the application folder as the working directory and restart failed services.

For HTTPS, save a native plan with your district hostname and rerun preparation. Point DNS at the server, allow ports 80/443, validate the generated gateway configuration, and restart/reload the native services:

```bash
caddy validate --config selfhost/district/native-web/Caddyfile --adapter caddyfile
```

Update Google's authorized origin to the exact HTTPS origin. Test sign-in, Save/Open, classrooms and media permissions through the gateway. For an already installed native service, rerun preparation after any plan change and restart the API and gateway so both use the updated settings. Keep the current database engine and private configuration.

### Native backups, recovery and updates

- Choose a private backup folder outside the application webroot, and restrict it to server administrators.
- Export the database with `mariadb-dump` or `mysqldump`. Use `--password` to prompt rather than putting the password in the command. `--result-file` also avoids Windows shell text-encoding changes:

```bash
mariadb-dump --host=127.0.0.1 --user=drawsplat_app --password --single-transaction --quick --skip-lock-tables --no-tablespaces --hex-blob --result-file=/PRIVATE_BACKUP_FOLDER/database.sql drawsplat
```

- Replace the output path with your private backup location; on Windows, use a restricted Windows path. Use `mysqldump` for MySQL and your actual host, user and database for an external server.
- Copy the matching `native-private/config.json` and `settings.json` into that same private backup. Keep encrypted off-server copies. Schedule and monitor backups with your OS tools; the Docker backup scripts do not back up a native installation.
- To test recovery, stop the API, provision a new empty database with appropriate access, and import the SQL using the database client. From Linux/macOS or Windows Command Prompt:

```bash
mariadb --host=127.0.0.1 --user=drawsplat_app --password drawsplat_restore < database.sql
```

- Restore the matching private configuration. Update its host/database credentials if the recovery location differs, while preserving the password pepper. Do not run first-time web setup over restored accounts. Start the API and gateway, and verify existing logins, boards, rosters and turn-ins before allowing users back in.
- Before updating, take a tested backup. Stop the API, update application files while preserving `native-private/`, the plan and database, rerun `npm ci --omit=dev --prefix server/mysql-backend`, prepare the native configuration again, then restart both services. Test updates separately before production rollout.

## Configure Google sign-in

### During installation

1. Create a Google OAuth **Web application** client for your district.
2. Add the exact website origin to the client’s **authorized JavaScript origins**.
3. Enter the **Web Client ID** and **allowed school email domains** in the setup screen.
4. Import the teacher and student roster before those users sign in.

No Google client secret is needed for this browser ID-token flow. Verified Google emails match rostered accounts and retain their assigned roles. Public registration and invitation enrollment are disabled for district installations. The initial administrator can use the installation’s email/password login.

[Read Google’s client setup guidance](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

### Configure Google later

Edit these settings in the private configuration, then restart the API service. **Docker:** `/data/config.json` inside the API container. **Native:** `selfhost/district/native-private/config.json`.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_ALLOWED_DOMAINS`

Preserve the other settings, especially `DRAWSPLAT_PEPPER`. Keep the configuration file private.

## Use your district’s domain

**Docker:** follow the steps below. **Without Docker:** use [Native services and HTTPS](#native-services-and-https).

Edit `selfhost/district/.env` with your domain:

```dotenv
SITE_ADDRESS=whiteboard.your-district.org
SITE_ORIGIN=https://whiteboard.your-district.org
WEB_BIND=0.0.0.0
```

1. Point the hostname at your server.
2. Allow incoming traffic on ports **80** and **443**.
3. Run the launcher again. Caddy obtains and renews HTTPS certificates.
4. Update Google’s authorized JavaScript origins to match the HTTPS origin.

Database and API ports are not published. By default, the installation listens on loopback until the administrator chooses to expose it.

Restrict `.env`, the setup key, and configuration backups to server administrators. On Windows, use a restricted folder and NTFS permissions; POSIX file modes do not replace Windows access controls. Do not publish these files with the static site.

## Update or stop the installation

These commands apply to **Docker**. For native service management and updates, use [Native backups, recovery and updates](#native-backups-recovery-and-updates).

For updates, keep the same installation directory, Compose project name, private `.env`, and Docker volumes. Update the source and rerun the launcher. Versioned migrations are applied once and can resume after interruptions. Test upgrades on a separate instance first.

To stop services, run this from the installation folder:

```bash
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml down
```

Do not add `--volumes` unless you intend to delete all district data.

## Back up and recover

The scripts below apply to **Docker**. Without Docker, follow [Native backups, recovery and updates](#native-backups-recovery-and-updates).

### Create a backup

**Linux or macOS:**

```bash
bash selfhost/district/backup-district.sh
```

**Windows:**

```bat
selfhost\district\backup-district.bat
```

The launcher saves a dated private directory containing:

- A consistent SQL export of the **bundled database**.
- The matching configuration file, including the password pepper.

**External databases:** use the external database host’s backup tools instead. The bundled database export does not contain external records. Preserve the matching private `/data/config.json` too.

### Schedule and monitor backups

Backups are **not automatically scheduled by the district launcher**. Assign an administrator to schedule the backup script with Linux cron/systemd or Windows Task Scheduler, using the application folder as its working directory. Choose a frequency and retention period appropriate to your district; record failed-job alerts and periodically test restoration. Keep encrypted copies outside this server and outside the served application directory.

The API runs its own retention/time-limit tasks while the service is running; these do not replace backups. Review which records those tasks cover. Classroom assignments and turn-ins need a district lifecycle policy rather than assuming every record is purged automatically.

### Recover an installation

Recovery requires **both the SQL export and its matching configuration**. Read the included `selfhost/district/RESTORE.md` file, or [view the restore instructions online](https://github.com/mguhlin/drawsplat/blob/main/selfhost/district/RESTORE.md).

Keep encrypted off-server copies, restrict access to administrators, and test recovery on a separate installation. Backups contain student records and credentials.

## Troubleshooting and ongoing administration

**Docker:** run these commands from the inner `drawsplat` application folder:

```bash
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml ps
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml logs --tail 100 api db web
```

**Native:** check the API runner and Caddy logs, or the corresponding OS service logs. On Linux, use `journalctl -u drawsplat-district-api -n 100` and your Caddy service log. Confirm the database service is running and validate the generated Caddyfile.

Review logs privately and redact credentials or student data before sharing them. Check `/api/drawsplat/mysql/health` on your installation for saving-service status. A running frontend alone does not prove the database is connected.

| Symptom | What to check |
| --- | --- |
| Docker unavailable | Start Docker; check Compose is installed and Windows is using Linux containers |
| Gateway fails to start | Check whether another application occupies ports 8080, 80 or 443; inspect the web service logs |
| Setup key rejected | Use the key from this installation's preparation command or launcher, not a different server; rerunning prints the key without replacing accounts |
| Setup disabled after installation | This is expected; use district administrator sign-in rather than reinstalling |
| Database test fails | Verify host/port, database-specific privileges, TLS and connectivity from the API host |
| Google sign-in fails | Check the exact origin, Web Client ID, allowed email domains and imported roster |
| Lost administrator credentials | Use the installation credentials saved after setup; preserve data and seek server-level recovery rather than deleting volumes |

**Email and recovery:** the administrator email is a login identifier. This installer does not configure SMTP, send welcome messages, or provide an email password-reset workflow. Plan how your district distributes login instructions and handles account recovery; Google account recovery remains with your identity provider.

**Updates:** take and verify a backup before upgrading, test a copy first, and retain matching code/configuration for rollback. Keep this application's folder and private configuration. For Docker, also preserve the Compose project identity and volumes; for native hosting, preserve the database and OS service configuration. Do not copy an old database volume into a different database engine. Maintain operating-system and Docker updates, monitor service health, and document who can administer the server.

## Before classroom rollout

Verify the installation on your district’s own server:

- District administrator sign-in and a roster import.
- Real Google sign-in with your client ID and authorized origin.
- Teacher assignment sharing, student turn-in, and teacher feedback.
- HTTPS access on the district’s domain.
- Backup restoration and your district’s retention procedures.

Windows BAT launchers also need acceptance testing on your district’s Windows host. Your district remains responsible for server administration, backups, and retention decisions.

## Retry an unfinished installation safely

A health response with `setupRequired: true` means first-time installation is still unfinished; it does not mean the database needs resetting. Keep the existing application folder, private `.env`/configuration and database volumes intact.

The default Docker project name is `drawsplat-district`. Extracting another copy into a new folder does **not** isolate its Docker services or volumes. Test a revised installer in a disposable VM or separate test host. Do not start a second default stack beside the unfinished one, remove its volumes, or replace its generated credentials. An administrator repairing the existing installation should preserve its settings and project identity, back up private configuration, update the application/API files in that installation, and rebuild/restart the API using its existing Compose configuration.

Before a tutorial session, verify the recorder with a short non-sensitive test: start, pause, resume, stop, locate the file and play it back. If any of these cannot be verified, continue with a written installation record and explicitly mark video unverified. Pause before setup keys or revealed passwords appear. Completing installation requires administrator login, database Save/Open, authenticated classroom tests, a backup and a restart/rerun check; healthy containers alone are insufficient.
