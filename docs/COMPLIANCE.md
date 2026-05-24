# DrawSplat&trade; Compliance &mdash; Operations Guide

Operator-facing notes for the compliance features rolled out per [COMPLIANCE-ROADMAP.md](../COMPLIANCE-ROADMAP.md). This file is the place to look when you need to know **how** something works in practice, not **whether** it is planned.

## Configuration source of truth

A single JSON file holds the defaults: [`compliance.config.json`](../compliance.config.json) at the repo root.

- The static page loader (`assets/js/app.js`) fetches it on boot and exposes the parsed object on `window.complianceConfig`. Listen for the `compliance-config-ready` event.
- The Apps Script backend keeps a parallel snapshot under the `COMPLIANCE_CONFIG` Script Property. The Day 3.2 Privacy Settings panel writes to it; the District Privacy Packet generator (Day 3.6) reads from it.
- If the Apps Script property is missing, the generator falls back to a placeholder note.

When you change defaults in `compliance.config.json`, commit and push so future deployments pick the new defaults up. Existing deployments keep using their Script-Property snapshot until an admin re-saves it.

## Apps Script setup additions

After updating `apps-script/Code.gs`, in the Apps Script editor:

1. **Save** the file.
2. Run **setup()** once. It creates two new sheet tabs in addition to the existing ones:
   - `Audit` &mdash; the Activity Records log.
   - `ParentRequests` &mdash; tickets from the Family Access Tools form.
3. Open **Project Settings &gt; Script Properties** and confirm `ADMIN_PASSCODE` is set (you already need this for any moderator action).
4. Optionally set `COMPLIANCE_ADMIN_EMAIL` &mdash; new parent requests trigger a notification email to this address.
5. **Deploy &gt; Manage deployments &gt; Edit &gt; New version &gt; Deploy** to publish the new endpoints.

## What endpoints are now available

The whiteboard Apps Script Web App handles all of these in addition to the existing board / room / template / turn-in actions.

| Action | Method | Auth | Purpose |
|---|---|---|---|
| `auditList` | GET | `passcode` | Recent Activity Records (filter by `actionFilter`, `actor`, `since`, `limit`) |
| `parentRequestList` | GET | `passcode` | All Family Access tickets, newest first |
| `privacyPacket` | GET | `passcode` | Returns base64-encoded ZIP (district privacy packet) |
| `parentRequest` | POST | none | Submit a new family request from the parent-facing form |
| `parentRequestDecide` | POST | `passcode` | Approve / deny / complete a parent request |

The `passcode` value is the `ADMIN_PASSCODE` script property. The Teacher Admin browser prompts for it the first time and caches it in `localStorage` only.

## Family Access Tools (parent-facing)

- Public-facing page: [`/parents/index.html`](../parents/index.html).
- Form posts to the configured Apps Script Web App URL (the same one Teacher Admin uses).
- A successful submission creates a ticket with status `pending_verification` and writes a `PARENT_REQUEST_CREATED` event to Activity Records.
- If `COMPLIANCE_ADMIN_EMAIL` is set, the admin gets an email. The parent does not automatically get a verification code in this iteration &mdash; that arrives in **Day 2.5**, where the teacher hand-issues a code through the school's existing parent-comms channel.

If the parent visits the public site and no Web App URL is configured in their browser, the form gives them a clear "email the school directly" message instead of failing silently. This means parents using `drawsplat.org` itself won't reach a backend &mdash; the form is for districts running their own deployment with their own Apps Script.

## Teacher Admin Compliance Console

Open **Teacher Admin &rarr; Compliance Console**. Seven sections are scaffolded; two are live:

- **Activity Records** &mdash; opens to the last 200 events. Filter by action, download CSV.
- **District Privacy Packet** &mdash; one-click ZIP download containing:
  - `compliance-config.json` (the snapshot)
  - `activity-records.csv` (last 90 days)
  - `parent-requests.csv` (all tickets)
  - `README.txt` (what's inside + companion URLs)

The other five sections (Safety Review, Family Access Tools, Age Lock, Use Limits, Retention) are stubs that future roadmap days fill in.

## Activity Records schema

The `Audit` sheet has these columns:

| Column | Purpose |
|---|---|
| `id` | UUID per event |
| `timestamp` | ISO 8601 UTC |
| `actor` | Email or display name of the actor (best-effort) |
| `actorRole` | `student`, `teacher`, `admin`, `parent`, `system` |
| `action` | One of the `audit.actions` values in the config |
| `entityType` | `board`, `image`, `parent_request`, `privacy_packet`, etc. |
| `entityId` | Local UUID of the affected item |
| `before` | JSON string of prior state (optional) |
| `after` | JSON string of new state (optional) |
| `userAgent` | Caller's User-Agent if known (optional) |

Use `logEvent_(action, payload)` from anywhere in the Apps Script when you add a new compliance-relevant action. The helper never throws, so audit failures cannot break the calling endpoint.

## Operator playbook

| Task | Where |
|---|---|
| Review a flagged parent request | Teacher Admin &rarr; Compliance Console &rarr; Family Access Tools (Day 2.4 next) |
| Pull a CSV of last week's events | Activity Records section &rarr; filter `since=YYYY-MM-DD` &rarr; Download CSV |
| Produce a packet for a district reviewer | District Privacy Packet section &rarr; Download District Privacy Packet |
| Invalidate all stored admin passcodes in the browser | Have the operator clear `localStorage` for `drawsplat.complianceAdminPasscode` |
| Rotate the admin passcode | Apps Script &gt; Project Settings &gt; Script Properties &gt; edit `ADMIN_PASSCODE`. Re-deploy. |

## Student Age Band Lock (Days 2.1 / 2.2)

A new `Users` sheet tracks one row per (student, class) pair. Columns: `id, studentName, className, email, ageBand, ageSource, ageLocked, ageChangedBy, ageChangedAt, ageChangeReason, parentCodeHash, parentCodeExpiresAt, lastSeen, createdAt, notes`.

- Rows auto-populate when a student submits a turn-in (`upsertUserFromTurnIn_`).
- Allowed bands: `under_13`, `13_to_17`, `18_plus`, `unknown_minor`. Default for new rows is `unknown_minor`.
- `ageLocked` defaults to `true` and only the admin can change `ageBand`. Every change requires a reason and emits an `AGE_BAND_CHANGED` audit event.
- The Teacher Admin &rarr; Compliance Console &rarr; **Student Age Band Lock** section lists students, shows current band, and offers a dropdown to change it (prompts for a reason on submit).

## Teacher-Issued Parent Verification Code (Day 2.5)

Each student row can carry a single-use 8-character verification code. Workflow:

1. In Teacher Admin &rarr; Compliance Console &rarr; Student Age Band Lock, click **Issue Parent Code** next to a student.
2. The browser shows the cleartext code in a one-time prompt. The server stores only a SHA-256 hash (with `PASSWORD_SALT`) and an expiry 14 days out.
3. The teacher shares the code with the parent through the school's existing parent-communications channel (email, paper, etc.).
4. The parent enters the code in the **Verification code** field on `/parents/index.html` when submitting a request.
5. On submission, if the code matches and is unexpired, the ticket starts in `verified` status (skipping `pending_verification`). The code is then cleared so it cannot be reused.
6. The `PARENT_CODE_ISSUED` event is logged when issued; the request itself logs `verified: true` on successful match.

If a code is lost or compromised, click **Issue Parent Code** again — the new code replaces the old one.

## Data Export (Day 2.6)

Clicking **Export** next to a student in the Age Band Lock section:

1. Prompts the admin for a reason (logged in Activity Records).
2. Calls `exportStudentData` on the Apps Script backend. The server gathers:
   - Every board in the `Boards` sheet whose `className` matches and whose `title` contains the student's name, including JSON and PNG.
   - Every turn-in in `TurnIns` keyed by (student, class).
   - The student's `Users` row, minus any hashed credentials.
3. Builds a ZIP with `boards/`, `turnins/`, `manifest.json` (machine-readable summary), and a `README.txt` (human-readable).
4. Returns it as base64; the browser saves it to your Downloads folder.
5. Logs `DATA_EXPORT` with counts and the supplied reason.

The export is admin-initiated. For verified parent requests, the typical workflow is: parent submits a request with their verification code → request shows up in Family Access Tools as `verified` → admin clicks **Export** on that student → emails the ZIP to the parent through the school's normal channel.

## Data Deletion (Day 2.7)

Clicking **Delete Data** next to a student in the Age Band Lock section:

1. Confirms the action (twice &mdash; once for the warning, once for a reason that goes into Activity Records).
2. Trashes Drive files for every matching turn-in and (if a class is supplied) every matching board.
3. Removes the user row and all matching turn-in / board rows.
4. Emits a `DATA_DELETED` audit event with counts of items removed and the supplied reason.

This action is permanent from the DrawSplat side. Drive files go to the trash and stay recoverable from Drive for the standard 30-day window.

## Retention Policy &amp; Cleanup (Days 3.7 / 3.8)

The Compliance Console &rarr; **Retention Policy &amp; Cleanup** section drives three thresholds:

- `retention.boards.archiveAfterDays` &mdash; boards untouched longer than this move to an `Archive` Drive subfolder.
- `retention.boards.deleteAfterDays` &mdash; boards untouched longer than this are trashed and removed from the `Boards` sheet.
- `retention.audit.keepDays` &mdash; rows in the `Audit` sheet older than this are pruned.

The settings are stored in the `COMPLIANCE_CONFIG` Script Property. **Save Settings** writes them; **Load Current** re-reads from the server.

**Manual run.** Click **Run Cleanup Now** to execute the pass immediately. Returns counts and writes a `RETENTION_ACTION` audit event.

**Daily trigger.** Click **Install Daily Trigger** to schedule `dailyRetentionCleanup()` via Apps Script time-driven triggers (runs at 02:00 server time). Click **Remove Trigger** to stop the schedule. Manual runs still work without the trigger.

The status line below the buttons shows the last run's summary and whether the trigger is currently installed.

## District-Wide Safety Defaults (Day 3.9)

The single `COMPLIANCE_CONFIG` Script Property is the authoritative server-side configuration. Every save through `saveBoard_` / `saveRoom_` reads `safetyConfig_()` which consults this property; the retention cleanup reads it on each run. So once an admin changes the config through the Console, every subsequent teacher's save (and every nightly cleanup pass) honors the new settings &mdash; there is no per-teacher override layer to keep in sync.

**Reset to Defaults** rewrites the property with the built-in defaults baked into `Code.gs` (`DS_DEFAULT_COMPLIANCE`). Useful if a previous edit landed in a bad state.

## Compliance Console Panels (Days 3.1–3.5)

The Teacher Admin &rarr; Compliance Console is split into seven collapsible sections. Each section reads from and writes to the same `COMPLIANCE_CONFIG` Script Property via `getCompliance` / `setCompliance`. Saved changes propagate to every subsequent `saveBoard_` / `saveRoom_` call automatically.

| Section | What it controls |
|---|---|
| **Safety Review** | Text filter on/off, blockOnMatch, link allowlist on/off, blockUnapproved. Plus the existing board/room freeze controls. |
| **Family Access Tools** | Parent portal enabled, request form enabled, verification method (`teacher_code`, `district_roster`, `admin_approval`). Plus the existing request queue. |
| **Student Age Band Lock** | Per-student age band table (see Day 2.1 / 2.2 section above). |
| **Use Limits** | Daily seconds, session seconds, allowed hours, weekend toggle, enabled flag. Enforcement code lands in Days 2.8&ndash;2.9; the config is pre-stageable now. |
| **Retention Policy &amp; Cleanup** | Archive / delete / audit-keep thresholds + manual run + daily trigger install (see retention section above). |
| **Privacy Settings** | Read-only declarations from the privacy section of the config: storage location, encryption, third-party services, "AI training" / advertising / data-sold flags, and what the District Privacy Packet includes. |
| **Activity Records** | Filter by action, actor, and date range. Download as CSV or JSON. |
| **District Privacy Packet** | One-click ZIP download (see Day 3.6 section above). |

For advanced edits (anything not exposed as a checkbox or input), use **Open Raw Config Editor** in the Privacy Settings panel. The dialog shows the entire merged config as JSON; saving runs through the same `setCompliance` filter, so only the known top-level sections persist.

## Time Limits (Days 2.8 / 2.9)

When `compliance.config.json` (or the `COMPLIANCE_CONFIG` Script Property) has `timeLimits.enabled = true`, the system enforces three checks on student writes:

- **Allowed hours.** If the current local hour falls outside `allowedHoursStart`&ndash;`allowedHoursEnd`, saves are rejected with a clear message.
- **Weekend access.** If `weekendAllowed` is false and the current day is Saturday or Sunday, saves are rejected.
- **Daily limit.** Once `secondsToday` reaches `dailySeconds`, saves are rejected and the browser locks the workspace.

**Client (browser)** &mdash; `assets/js/timelimits.js`:
- Tracks active interaction time (counts only when the user has typed / moved the mouse / clicked within the last 60 seconds).
- Persists per-day total in `localStorage` so a reload resumes the counter.
- Posts a heartbeat to `?action=timeHeartbeat` every 30 seconds with the delta; the server records it in a `TimeUsage` sheet keyed by `(student, class, date)`.
- Displays a remaining-time chip at the bottom-right of the whiteboard.
- Locks the workspace (full-screen overlay, disables all inputs) when the limit is reached or the server responds with `allowed: false`.

**Server (Apps Script)**:
- `checkTimeLimitsAllowed_(studentName, className)` gates `saveBoard_` / `saveRoom_` for students (teachers bypass). Hits write a `TIME_LIMIT_HIT` audit event before throwing.
- `?action=timeStatus` is an open endpoint returning the active configuration and the student&rsquo;s `secondsToday` / `remaining`. Used by the client on load.
- `?action=timeHeartbeat` (POST) accepts a delta (capped at 90 seconds per beat to prevent inflated counters) and returns the updated counter.

Operators configure the limits in **Teacher Admin &rarr; Compliance Console &rarr; Use Limits**. Disable by toggling `enabled` off &mdash; the chip disappears and saves are no longer gated.

## What is intentionally not built yet

This file documents what ships in the current commits. The roadmap lists everything else, with day-sized work items and acceptance criteria. Do not assume any feature works just because it is mentioned in the roadmap &mdash; check the **Status** column in COMPLIANCE-ROADMAP.md for ticked boxes.
