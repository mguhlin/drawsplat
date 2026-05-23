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

## What is intentionally not built yet

This file documents what ships in the current commits. The roadmap lists everything else, with day-sized work items and acceptance criteria. Do not assume any feature works just because it is mentioned in the roadmap &mdash; check the **Status** column in COMPLIANCE-ROADMAP.md for ticked boxes.
