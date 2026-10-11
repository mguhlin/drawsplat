# DrawSplat district installation

[View HTML](district-selfhost.html) · [Download Markdown](district-selfhost.md)

Install your district’s whiteboard, create its administrator account, and set up teacher and student classrooms. MariaDB and MySQL use the same saving API and whiteboard interface.

## Quick Start

Open **00-START-HERE.html** (or **START-HERE.html**) immediately after extracting the **complete DrawSplat + SplatWorks suite**. The same guided setup is available at the top of [the HTML guide](district-selfhost.html#quick-start-hub).

1. Review the component checkboxes. The whiteboard, all four SplatWorks apps, tools, widgets and games are **checked by default**. Uncheck anything your district does not want to serve.
2. Choose MariaDB or MySQL and optionally enter your district hostname.
3. Select **Save plan in extracted folder** in a supported browser and choose the extracted package folder. Alternatively, select **Download installation plan** and save `drawsplat-district-plan.json` in the extracted folder next to `START-HERE.html`.
4. Run `bash start-district.sh` or `start-district.bat`. The launcher applies your choices and opens the setup hub. If you skip the plan, every component is enabled.
5. Follow the hub’s checklist: database connection, district administrator credentials, optional Google sign-in, teachers and rosters, school settings, component verification, HTTPS and tested backups.

**Rerun whenever needed:** reopen START-HERE.html, load your previous plan or review the saved choices, download the updated plan into the installation folder, and rerun the launcher. Existing passwords, accounts, saved work and database volumes are preserved. Unchecked components are blocked at the district web gateway; their files are retained so you can enable them later. Changing database engines requires a separate migration rather than a rerun.

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

- A district server or computer where you can install Docker.
- **Linux:** Docker Engine with Compose. **Windows/macOS:** Docker Desktop. Windows must use Linux containers.
- Internet access for the first launch to download container images.
- An empty MariaDB or MySQL database if you plan to use an existing database server. Otherwise, the launcher creates a bundled database.
- A Google OAuth Web Client ID if you want teachers and students to use Google sign-in. You can configure it later.

**Hosting:** drawsplat.org provides the public frontend and source download. It does not host your district’s MariaDB service. Your district operates its own API, database, Google client, backups, and server.

## Install DrawSplat

### 1. Download and extract the source

[Download the complete DrawSplat + SplatWorks district suite ZIP](https://github.com/mguhlin/drawsplat/releases/download/district-suite-v1.0.0/drawsplat-district-suite-v1.0.0.zip). The [current source archive](https://github.com/mguhlin/drawsplat/archive/refs/heads/main.zip) also contains the complete suite.

Extract the archive and open the folder containing `start-district.sh` and `start-district.bat`. Install and start Docker before continuing.

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

Do not switch database engines over an existing data volume. Keep the setup key printed by the launcher—you need it in the next step.

### 3. Connect the database in the web installer

Open [http://localhost:8080/setup](http://localhost:8080/setup) on the server computer. Paste the setup key printed by the launcher.

| Database choice | What to enter |
| --- | --- |
| Bundled database | Leave the connection fields blank to use the generated server settings |
| Existing database | Enter the host, port, empty database name, username, and password |
| Remote database | Use verified TLS; provide the CA certificate if required |

The database account needs schema migration permissions, plus `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. Select **Test connection** before finishing setup.

### 4. Choose the district administrator credentials

The installer displays these starter credentials:

| Field | Starter value |
| --- | --- |
| Administrator email | `admin@localhost.test` |
| Password | A unique generated password shown in your setup screen |

Use these credentials or replace either field. A replacement password must have **at least 12 characters**. This account manages district rosters; it is not a teacher or student account.

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

## Configure Google sign-in

### During installation

1. Create a Google OAuth **Web application** client for your district.
2. Add the exact website origin to the client’s **authorized JavaScript origins**.
3. Enter the **Web Client ID** and **allowed school email domains** in the setup screen.
4. Import the teacher and student roster before those users sign in.

No Google client secret is needed for this browser ID-token flow. Verified Google emails match rostered accounts and retain their assigned roles. Public registration and invitation enrollment are disabled for district installations. The initial administrator can use the installation’s email/password login.

[Read Google’s client setup guidance](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

### Configure Google later

Edit these settings in the private `/data/config.json` inside the API container, then restart the API service:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_ALLOWED_DOMAINS`

Preserve the other settings, especially `DRAWSPLAT_PEPPER`. Keep the configuration file private.

## Use your district’s domain

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

For updates, keep the same installation directory, Compose project name, private `.env`, and Docker volumes. Update the source and rerun the launcher. Versioned migrations are applied once and can resume after interruptions. Test upgrades on a separate instance first.

To stop services, run this from the installation folder:

```bash
docker compose --env-file selfhost/district/.env -f selfhost/district/compose.yml down
```

Do not add `--volumes` unless you intend to delete all district data.

## Back up and recover

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

### Recover an installation

Recovery requires **both the SQL export and its matching configuration**. Read the included `selfhost/district/RESTORE.md` file, or [view the restore instructions online](https://github.com/mguhlin/drawsplat/blob/main/selfhost/district/RESTORE.md).

Keep encrypted off-server copies, restrict access to administrators, and test recovery on a separate installation. Backups contain student records and credentials.

## Before classroom rollout

Verify the installation on your district’s own server:

- District administrator sign-in and a roster import.
- Real Google sign-in with your client ID and authorized origin.
- Teacher assignment sharing, student turn-in, and teacher feedback.
- HTTPS access on the district’s domain.
- Backup restoration and your district’s retention procedures.

Windows BAT launchers also need acceptance testing on your district’s Windows host. Your district remains responsible for server administration, backups, and retention decisions.
