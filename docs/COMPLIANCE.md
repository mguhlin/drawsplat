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

## What is intentionally not built yet

This file documents what ships in the current commits. The roadmap lists everything else, with day-sized work items and acceptance criteria. Do not assume any feature works just because it is mentioned in the roadmap &mdash; check the **Status** column in COMPLIANCE-ROADMAP.md for ticked boxes.
