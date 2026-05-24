# DrawSplat&trade; Compliance Roadmap

This document is the authoritative implementation plan for compliance work in DrawSplat&trade;. It is structured so that:

- Every unit of work is a **"day"** &mdash; one focused session, typically 2–4 hours, that produces a shippable change.
- Each day has explicit **deliverables**, **acceptance criteria**, **files touched**, and **docs to update**.
- Each day starts with an unchecked checkbox `[ ]`. Mark complete with `[x]` when the change is committed.
- **Phases 1–3** are buildable on the current static-site + Google Apps Script stack.
- **Phase 4** ("MySQL / District") parks every item that needs a real backend. Districts that buy a self-hosted DrawSplat license get Phase 4 enabled. Public deployments stay on Phases 1–3.

## How to use this document

1. Open this file.
2. Find the first unchecked day (`[ ]`) in the **Running checklist** below.
3. Jump to its detail section, do the work as described.
4. Tick the box, fill in the **commit hash** column, optionally write one line in the **Progress log** at the bottom.
5. Push.

## Architecture principle: three modes

DrawSplat&trade; runs in one of three modes. Compliance features are scoped to the mode that actually needs them.

| Mode | Backend | Audience | Scope of compliance features |
|---|---|---|---|
| **Local-only browser** | None &mdash; `localStorage` only | Teacher demos, single users | No account, no data leaves the browser. Filtering still runs client-side. |
| **Teacher-managed classroom** | Google Apps Script + Sheets + Drive | Normal K–12 use | Everything in Phases 1–3 below. |
| **District-hosted** | MySQL/Postgres + DrawSplat&trade; server | District deployments under DPA | Phases 1–3 plus the Phase 4 items that require a real backend (SSO, real-time enforcement, true RBAC, etc.). |

## Architecture split: Apps Script vs MySQL

| Capability | Apps Script (Phases 1–3) | MySQL/District (Phase 4) |
|---|---|---|
| Text keyword filter | ✅ Client + Apps Script `doPost` re-check | ✅ Same code path, server-enforced |
| Image upload approval queue | ✅ Pending state in Sheet | ✅ Pending state in DB |
| Link allow/blocklist | ✅ Config JSON | ✅ Config table |
| Board freeze | ✅ Flag in Sheet | ✅ Flag in DB |
| Activity log (audit) | ✅ Append-only Sheet tab | ✅ Append-only DB table with retention |
| Age band + lock | ✅ Sheet cell, lock enforced server-side | ✅ DB column, lock enforced server-side, SIS-fed |
| Parent request form | ✅ Static form → Apps Script ticket | ✅ Static form → DB ticket |
| Parent verification | ✅ Teacher-issued one-time code | ✅ SIS guardian sync (Clever, ClassLink, etc.) |
| Data export | ✅ Apps Script ZIP build | ✅ Server-side ZIP build |
| Data deletion request | ✅ Manual admin action | ✅ Manual admin action |
| Time limits (UX) | ✅ Browser timer + Apps Script gate at save/load | ✅ Real-time push kick-out |
| Admin Compliance Console | ✅ Static page reading Apps Script config | ✅ Same UI, DB-backed |
| District Privacy Packet | ✅ Generator combines static docs + config snapshot | ✅ Same |
| Retention policy + cleanup | ✅ Apps Script time-driven trigger | ✅ Cron / scheduled DB job |
| SSO (Google + Microsoft for community) | ✅ Already shipped on `/community/` | ✅ Extended to whiteboard accounts |
| Roster import (CSV upload) | ⚠️ Possible but clunky | ✅ Native |
| Live SIS API integration (Clever, ClassLink, Skyward) | ❌ Not feasible | ✅ Per-vendor |
| Real-time session enforcement | ❌ Apps Script is request/response | ✅ WebSocket / SSE |
| True role-based access control (district / campus / teacher / student / parent) | ⚠️ Limited | ✅ Full RBAC tree |
| Parent portal (read-only data view) | ⚠️ Limited (Apps Script auth is awkward) | ✅ Native |

## Running checklist

Phase totals are calendar-day estimates assuming one focused session per day. Adjust for reality.

### Phase 0 &mdash; Foundation (2 days)

| Day | Item | Status | Commit |
|---|---|---|---|
| 0.1 | Compliance config schema (`compliance.config.json`) | [x] | 021c657 |
| 0.2 | Compliance UI scaffolding in Teacher Admin | [x] | 021c657 |

### Phase 1 &mdash; Safety Foundation (9 days)

| Day | Item | Status | Commit |
|---|---|---|---|
| 1.1 | Text keyword filter &mdash; config + client-side pre-check | [x] | 26adb18 |
| 1.2 | Text keyword filter &mdash; Apps Script server-side enforcement | [x] | 26adb18 |
| 1.3 | Image upload approval queue &mdash; data model + Apps Script | [ ] | deferred |
| 1.4 | Image upload approval queue &mdash; teacher review UI | [ ] | deferred |
| 1.5 | Link allow/blocklist | [x] | 26adb18 |
| 1.6 | Board freeze + write-blocked enforcement | [x] | 26adb18 |
| 1.7 | Activity Records (audit log) &mdash; schema + write helpers | [x] | 021c657 |
| 1.8 | Activity Records &mdash; viewer UI in Teacher Admin | [x] | 021c657 |
| 1.9 | Safety Review &mdash; rename moderation + merged queue | [x] | 26adb18 |

### Phase 2 &mdash; Age + Parent (10 days)

| Day | Item | Status | Commit |
|---|---|---|---|
| 2.1 | Age band schema + lock field + audit on change | [x] | f40279f |
| 2.2 | Age band admin UI in Teacher Admin | [x] | f40279f |
| 2.3 | Parent Request Center &mdash; static page scaffold | [x] | 021c657 |
| 2.4 | Parent Request Center &mdash; Apps Script ticket endpoint | [x] | 021c657 |
| 2.5 | Teacher-issued parent verification code | [x] | f40279f |
| 2.6 | Data export &mdash; download student work as ZIP | [x] | pending |
| 2.7 | Data deletion request &mdash; ticket + admin action | [x] | f40279f |
| 2.8 | Time-limit controls &mdash; browser timer + lock UX | [ ] | |
| 2.9 | Time-limit controls &mdash; Apps Script gate on save/load | [ ] | |
| 2.10 | Phase 2 documentation pass | [ ] | |

### Phase 3 &mdash; District Admin Console (9 days)

| Day | Item | Status | Commit |
|---|---|---|---|
| 3.1 | Admin Compliance Console &mdash; page scaffolding | [ ] | |
| 3.2 | Privacy Settings panel | [ ] | |
| 3.3 | Student Safety panel | [ ] | |
| 3.4 | Parent Controls panel | [ ] | |
| 3.5 | Audit Logs panel (extends Day 1.8) | [ ] | |
| 3.6 | District Privacy Packet generator | [x] | 021c657 |
| 3.7 | Retention policy settings | [ ] | |
| 3.8 | Scheduled cleanup script | [ ] | |
| 3.9 | District-wide safety defaults propagation | [ ] | |
| 3.10 | Phase 3 documentation pass + Terms & Privacy update | [ ] | |

### Phase 4 &mdash; MySQL / District (deferred)

Triggered by a paying district. Each item assumes the MySQL backend exists.

| Day | Item | Status | Commit |
|---|---|---|---|
| 4.1 | MySQL schema for users, sessions, boards, audit, rate limits | [ ] | |
| 4.2 | Auth: port Community OAuth + email/password to MySQL | [ ] | |
| 4.3 | Whiteboard save/load via MySQL backend | [ ] | |
| 4.4 | RBAC tree (district / campus / teacher / student / parent) | [ ] | |
| 4.5 | Roster CSV import | [ ] | |
| 4.6 | SSO/roster API integration &mdash; pick one (Clever or ClassLink) | [ ] | |
| 4.7 | Parent portal (read-only) | [ ] | |
| 4.8 | Real-time session enforcement (SSE / WebSocket kick) | [ ] | |
| 4.9 | Cross-device sync on the MySQL path | [ ] | |
| 4.10 | DB-backed audit log with retention | [ ] | |
| 4.11 | Self-hosted deployment guide | [ ] | |
| 4.12 | Phase 4 documentation pass | [ ] | |

---

# Phase 0 &mdash; Foundation

**Goal.** Define a single source of truth for compliance configuration so every later phase reads from one config rather than scattering booleans across the codebase.

### Day 0.1 &mdash; Compliance config schema

- **Deliverables**
  - `compliance.config.json` at the repo root with the full schema (`safety`, `parentAccess`, `ageLock`, `timeLimits`, `retention`, `audit`, `privacy`).
  - Loader function in `assets/js/app.js` that reads it on boot and exposes `window.complianceConfig`.
  - Defaults are conservative ("safer" defaults on).
- **Acceptance criteria**
  - File parses as JSON; loader returns the parsed object; defaults render in console.
- **Files touched** `compliance.config.json` (new), `assets/js/app.js`.
- **Docs to update** Add a "Compliance configuration" section to `docs/` or a new `docs/COMPLIANCE.md`.

### Day 0.2 &mdash; Compliance UI scaffolding in Teacher Admin

- **Deliverables**
  - New tab/section in `admin/admin.html` titled "Compliance" with empty subsections that future days fill in (Safety, Parent Access, Age Lock, Time Limits, Retention, Audit, Privacy Packet).
  - Each subsection is a `<details>` element so it's collapsible.
- **Acceptance criteria**
  - The tab renders; opening it shows seven empty placeholders that read "Configured in Day X.Y".
- **Files touched** `admin/admin.html`, possibly `assets/css/app.css`.
- **Docs to update** `docs/` Teacher Admin walkthrough.

---

# Phase 1 &mdash; Safety Foundation

**Goal.** Visible, demonstrable safety: filters, queues, freezes, logs. Every district reviewer asks about these first.

### Day 1.1 &mdash; Text keyword filter (config + client-side pre-check)

- **Deliverables**
  - Patterns and word lists added to `compliance.config.json` under `safety.text.patterns` (regex strings) and `safety.text.words`.
  - `checkTextSafety(text)` helper in a new `assets/js/safety.js`.
  - Called on save for sticky notes, text boxes, comments, board titles, image captions, file names.
  - On hit: block save, show a clear modal explaining why.
- **Acceptance criteria**
  - Typing a flagged word in a sticky note and clicking save shows the modal and does not persist.
  - Clean text saves normally.
- **Files touched** `compliance.config.json`, `assets/js/safety.js` (new), `assets/js/app.js`.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Safety Review &gt; Text".

### Day 1.2 &mdash; Text keyword filter (Apps Script server-side enforcement)

- **Deliverables**
  - `checkTextSafety_()` mirror in `apps-script/Code.gs` (whiteboard side).
  - Every save/update endpoint runs the check before writing to the Sheet or Drive.
  - Hits return a clear error and (Day 1.7) log an audit event.
- **Acceptance criteria**
  - Bypassing the browser by replaying a POST with flagged text returns an error from the server.
- **Files touched** `apps-script/Code.gs` (or wherever the whiteboard's Apps Script lives).
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Server-side enforcement".

### Day 1.3 &mdash; Image upload approval queue (data model + Apps Script)

- **Deliverables**
  - New Sheet tab `ImageQueue` with columns: `id, boardId, uploadedBy, fileName, driveId, mimeType, status (pending/approved/rejected), submittedAt, decidedBy, decidedAt`.
  - Upload endpoint stores file as `pending`; image stays hidden on student view until status flips to `approved`.
  - Allowed mime types: `image/png`, `image/jpeg`, `image/webp`. `image/svg+xml` rejected outright.
  - File size cap honoring `compliance.config.json` value.
- **Acceptance criteria**
  - Student-mode upload creates a row with status `pending`; student does not see the image until teacher approves.
- **Files touched** `apps-script/Code.gs`, `compliance.config.json`.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Safety Review &gt; Images".

### Day 1.4 &mdash; Image upload approval queue (teacher review UI)

- **Deliverables**
  - New section in the Moderation Dashboard (or Compliance tab) showing pending uploads with thumbnail, uploader name, board, and **Approve** / **Reject** buttons.
  - Approval flips status; image becomes visible to students.
  - Rejection moves Drive file to trash and logs the event (Day 1.7).
- **Acceptance criteria**
  - Teacher sees pending image, approves it, student sees it. Rejection removes the file and posts a notice.
- **Files touched** `app/whiteboard.html`, `assets/js/app.js`, `assets/css/app.css`.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Teacher review workflow".

### Day 1.5 &mdash; Link allow/blocklist

- **Deliverables**
  - `compliance.config.json` gains `safety.links.allowedDomains[]` and `safety.links.blockUnapproved` (bool).
  - Any text save scans for `https?://` URLs; unapproved domains are rejected with an explanatory modal.
- **Acceptance criteria**
  - Pasting an unapproved link into a sticky note is blocked; pasting an allowed-domain link saves.
- **Files touched** `assets/js/safety.js`, mirror in `apps-script/Code.gs`.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Safety Review &gt; Links".

### Day 1.6 &mdash; Board freeze + write-blocked enforcement

- **Deliverables**
  - New flag on board records: `frozen: true/false`, plus `frozenBy`, `frozenAt`, `frozenReason`.
  - **Freeze board** button in Teacher Admin and on the inspector (teacher-only).
  - All write endpoints reject changes to a frozen board with a clear message.
  - Frozen board renders a header banner: "This board is frozen by your teacher."
- **Acceptance criteria**
  - Teacher freezes a board; students see the banner; saves/replies/uploads all fail with the freeze message.
- **Files touched** `apps-script/Code.gs`, `app/whiteboard.html`, `assets/js/app.js`, `assets/css/app.css`.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Board freeze".

### Day 1.7 &mdash; Activity Records (audit log) &mdash; schema + write helpers

- **Deliverables**
  - New Sheet tab `Audit` with columns: `id, timestamp, actor (email), actorRole, action, entityType, entityId, before, after, ip (best-effort), userAgent`.
  - `logEvent_(action, payload)` helper in `apps-script/Code.gs`.
  - Hook into: login, board create, board share, image upload, moderation actions, parent requests (Phase 2), age-band changes (Phase 2), admin setting changes (Phase 3), data export, data deletion, board freeze.
- **Acceptance criteria**
  - Triggering any of the above writes a row to `Audit`.
- **Files touched** `apps-script/Code.gs`.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Activity Records".

### Day 1.8 &mdash; Activity Records (viewer UI)

- **Deliverables**
  - New section in Teacher Admin showing the most recent 200 rows, filterable by action and actor, with a "Download CSV" button.
- **Acceptance criteria**
  - Filtering by action returns matching rows; CSV download opens cleanly in a spreadsheet.
- **Files touched** `admin/admin.html`, supporting JS.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Reviewing Activity Records".

### Day 1.9 &mdash; Safety Review (rename + merged queue)

- **Deliverables**
  - Rename existing Moderation Dashboard to **Safety Review** in UI and labels (keep moderation underneath as one tab among Safety queues).
  - Merge text flags, image queue, link blocks, and frozen boards into one filterable list.
- **Acceptance criteria**
  - Teacher opens Safety Review and sees a single chronological queue with type filter.
- **Files touched** `app/whiteboard.html`, `admin/admin.html`, JS, CSS.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; rename throughout. Update Terms & Privacy if it references "Moderation Dashboard".

---

# Phase 2 &mdash; Age + Parent

**Goal.** Texas SCOPE-aligned age band + parent-facing tools (request center, data export, time limits).

### Day 2.1 &mdash; Age band schema + lock + audit

- **Deliverables**
  - Sheet `Users` adds: `ageBand` (`under_13`, `13_to_17`, `18_plus`, `unknown_minor`), `ageSource` (`district_roster`, `teacher`, `parent`, `admin`), `ageLocked` (bool, default true).
  - Server rejects student-initiated `ageBand` writes. Teacher writes require a reason and emit an `AGE_BAND_CHANGED` audit event.
  - District admin (Phase 3) can change locked values.
- **Acceptance criteria**
  - Student attempt to change `ageBand` fails. Teacher change requires reason and is logged. Default for new accounts: `unknown_minor`.
- **Files touched** `apps-script/Code.gs`, possibly `community/code.gs` for parity.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Student Age Band Lock".

### Day 2.2 &mdash; Age band admin UI

- **Deliverables**
  - Teacher Admin gets a "Student Age Band Lock" panel listing students with current band, source, and last-changed metadata.
  - Edit button requires a reason and confirms before submitting.
- **Acceptance criteria**
  - Edits propagate to the Sheet; an audit row is written.
- **Files touched** `admin/admin.html`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 2.3 &mdash; Parent Request Center (static page scaffold)

- **Deliverables**
  - New page `parents/index.html` styled in the DrawSplat&trade; landing style, with form for:
    - Parent name, email, child name, student ID (optional), request type (view / export / correct / delete / pause / report concern / privacy question), free-text details.
  - Page links from the main site footer.
- **Acceptance criteria**
  - Form renders, validates required fields, submits with form data ready for the Day 2.4 endpoint.
- **Files touched** `parents/index.html` (new), CSS, links from `index.html` / `pages/support.html` / footers.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Family Access Tools &gt; Request Center".

### Day 2.4 &mdash; Parent Request Center (Apps Script ticket endpoint)

- **Deliverables**
  - New Sheet tab `ParentRequests` with columns: `id, parentName, parentEmail, studentName, studentId, requestType, details, status (pending_verification / approved / denied / completed), assignedTo, createdAt, decidedAt, decisionNote`.
  - Apps Script accepts the form submission and writes a row.
  - Email notification to a configured `complianceAdminEmail` (using `MailApp.sendEmail`).
  - Auto-reply to parent: "We received your request, ticket #..."
- **Acceptance criteria**
  - Form submission creates a row and sends both emails.
- **Files touched** `apps-script/Code.gs`, config.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 2.5 &mdash; Teacher-issued parent verification code

- **Deliverables**
  - In Teacher Admin (student-by-student view), a button "Generate Parent Verify Code" that creates a one-time alphanumeric code (8 chars), stores hash + expiry in Sheet, and shows the cleartext code to the teacher to share via the school's existing parent-comms channel.
  - Parent enters code in the request center; on first successful match, their email becomes verified for that student.
  - Code single-use, expires in 14 days.
- **Acceptance criteria**
  - Code works once, then is unusable; verified status appears on subsequent parent requests.
- **Files touched** `admin/admin.html`, `apps-script/Code.gs`, `parents/index.html`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 2.6 &mdash; Data export (download student work as ZIP)

- **Deliverables**
  - For a verified parent (or the student themselves), Apps Script bundles every board belonging to that student into a ZIP containing per-board JSON + PNG export + a `manifest.json` listing what's included and the export timestamp.
  - Delivered via a one-time download link (15-minute expiry) emailed to the verified parent address.
- **Acceptance criteria**
  - Parent receives a download link; the ZIP contains the student's boards.
- **Files touched** `apps-script/Code.gs`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 2.7 &mdash; Data deletion request (ticket + admin action)

- **Deliverables**
  - Parent submits a deletion request; ticket is created with status `pending_verification`.
  - Once verified, request moves to `approved` and shows up in Teacher Admin with a **Delete student data** button.
  - The button trashes the student's Drive files, removes their `Users` row, and writes an audit event.
- **Acceptance criteria**
  - End-to-end: request → verify → admin click → row gone, files trashed, audit entry exists.
- **Files touched** `apps-script/Code.gs`, `admin/admin.html`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 2.8 &mdash; Time-limit controls (browser timer + lock UX)

- **Deliverables**
  - Active-time tracker in `assets/js/app.js` (counts only when the user has interacted within the last 60 seconds).
  - Reads `compliance.config.json` for `timeLimits.dailySeconds`, `timeLimits.sessionSeconds`, `timeLimits.allowedHoursStart`/`End`, `timeLimits.weekend`.
  - On limit reached, locks the workspace with a friendly modal and disables all input.
- **Acceptance criteria**
  - With a low daily limit configured, the workspace locks after the configured time.
- **Files touched** `assets/js/app.js`, `compliance.config.json`.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "Use Limits".

### Day 2.9 &mdash; Time-limit controls (Apps Script gate on save/load)

- **Deliverables**
  - Server records per-student per-day active seconds.
  - Save and load endpoints reject when over the daily/session/hours limits.
  - Browser-side timer is for UX; the server-side decision is authoritative for compliance.
- **Acceptance criteria**
  - Replayed POST after limit returns an error.
- **Files touched** `apps-script/Code.gs`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 2.10 &mdash; Phase 2 documentation pass

- **Deliverables**
  - Update `legal/terms-privacy.html` to reference parent request center, data export, deletion, age-band lock, time limits.
  - Update `legal/district-addendum.html` with the same.
  - Update `pages/support.html` with a "Family Access Tools" pointer.
  - Add a Phase 2 summary to `docs/COMPLIANCE.md`.
- **Acceptance criteria**
  - All pages link to `/parents/` and reference the new capabilities by their district-friendly names.
- **Files touched** legal docs, support page, doc folder.
- **Docs to update** as above.

---

# Phase 3 &mdash; District Admin Console

**Goal.** Roll up everything from Phases 0–2 into a single admin surface, plus a one-click "District Privacy Packet" download. This is the demo surface for procurement.

### Day 3.1 &mdash; Admin Compliance Console (page scaffolding)

- **Deliverables**
  - In Teacher Admin, add a top-level "Compliance Console" view with sections (Privacy Settings, Student Safety, Parent Controls, Audit Logs, Retention, Privacy Packet).
  - Sections are stubs that future days populate.
- **Acceptance criteria**
  - Console renders, sections are reachable, empty.
- **Files touched** `admin/admin.html`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 3.2 &mdash; Privacy Settings panel

- **Deliverables**
  - Toggles + read-outs for: storage location, retention period, export format, delete policy, encryption status, third-party services used, AI moderation enabled, "student data trains AI models" forced to NO.
  - Changes write to `compliance.config.json` via Apps Script-served config (since static files can't be written from the browser; the config lives in Script Properties and the JSON file is the documented default).
- **Acceptance criteria**
  - Toggles persist across reload via the Apps Script-stored config.
- **Files touched** `admin/admin.html`, `apps-script/Code.gs`, JS.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 3.3 &mdash; Student Safety panel

- **Deliverables**
  - UI for: content filtering on/off, link restrictions on/off + manage allowed domains, image upload moderation on/off, teacher approval required, anonymous posting (default no), public sharing (default no).
  - Wires into Phase 1 features.
- **Acceptance criteria**
  - Toggling controls the live behavior on the next page load.
- **Files touched** `admin/admin.html`, config plumbing.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 3.4 &mdash; Parent Controls panel

- **Deliverables**
  - UI for: parent portal enabled, parent request form enabled, parent verification method, time limits on/off, account pause option.
- **Acceptance criteria**
  - Toggles flip the visible parent surface (e.g., hiding `/parents/` form fields appropriately).
- **Files touched** `admin/admin.html`, config plumbing.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 3.5 &mdash; Audit Logs panel (extends Day 1.8)

- **Deliverables**
  - Wired into the Compliance Console with full filter UI, date range, actor, action, entity type, plus CSV and JSON export.
- **Acceptance criteria**
  - Filtering by date range works; JSON export is parseable.
- **Files touched** `admin/admin.html`, JS.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 3.6 &mdash; District Privacy Packet generator

- **Deliverables**
  - "Download District Privacy Packet" button assembles a ZIP containing:
    - `terms-privacy.html` (rendered to PDF or HTML)
    - `district-addendum.html`
    - A generated `data-handling-summary.pdf` listing the live config (storage location, retention, third-party services, etc.)
    - The current Activity Records as CSV for the last 90 days
    - This `COMPLIANCE-ROADMAP.md`
    - A `README.txt` summarizing what's inside
- **Acceptance criteria**
  - One click produces a ZIP that contains everything a district reviewer typically asks for.
- **Files touched** `apps-script/Code.gs`, `admin/admin.html`.
- **Docs to update** `docs/COMPLIANCE.md` &mdash; "District Privacy Packet".

### Day 3.7 &mdash; Retention policy settings

- **Deliverables**
  - Config keys: `retention.boards.archiveAfterDays`, `retention.boards.deleteAfterDays`, `retention.audit.keepDays`.
  - UI in Privacy Settings panel to set values.
- **Acceptance criteria**
  - Values save and are visible in the config snapshot inside the Privacy Packet.
- **Files touched** `admin/admin.html`, `compliance.config.json`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 3.8 &mdash; Scheduled cleanup script

- **Deliverables**
  - Apps Script time-driven trigger that nightly:
    - Moves boards older than `archiveAfterDays` to an `Archived` folder.
    - Deletes boards older than `deleteAfterDays`.
    - Deletes audit rows older than `audit.keepDays`.
  - Each action emits an audit event of its own (`RETENTION_ACTION`).
- **Acceptance criteria**
  - Manual trigger run prunes expected rows and writes audit entries.
- **Files touched** `apps-script/Code.gs`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 3.9 &mdash; District-wide safety defaults propagation

- **Deliverables**
  - When district admin changes a default in the Compliance Console, the change applies to every teacher who hasn't explicitly overridden it.
  - Teachers can still override per-class within their allowed range.
- **Acceptance criteria**
  - District change visibly affects teacher accounts with no manual reload-of-config dance.
- **Files touched** `apps-script/Code.gs`, `admin/admin.html`.
- **Docs to update** `docs/COMPLIANCE.md`.

### Day 3.10 &mdash; Phase 3 documentation + Terms & Privacy update

- **Deliverables**
  - `legal/terms-privacy.html` mentions the Compliance Console, the District Privacy Packet, retention policy, scheduled cleanup, and audit-log retention window.
  - `legal/district-addendum.html` mentions same.
  - `pages/pricing.html` adds a "Compliance Console (district-only)" bullet to the District tier.
  - `README.md` adds a "Compliance" section pointing at this roadmap and the Compliance Console.
- **Acceptance criteria**
  - All references read correctly and link to the live surfaces.
- **Files touched** legal docs, pricing, README.
- **Docs to update** as above.

---

# Phase 4 &mdash; MySQL / District (deferred)

This phase doesn't start until a paying district triggers it. Items here all assume a real backend with a relational store, a session layer, and the ability to run long-lived processes.

### Day 4.1 &mdash; MySQL schema

- **Deliverables**
  - Migrations for `users`, `sessions`, `boards`, `board_items`, `audit_log`, `parent_requests`, `image_queue`, `rate_limits`, `compliance_config`.
  - Documented in `server/schema/README.md`.

### Day 4.2 &mdash; Auth: port Community OAuth + email/password to MySQL

- **Deliverables**
  - Reuse Community's HMAC session pattern against the MySQL `sessions` table.
  - Same login surfaces (Google, Microsoft, email/password) work on the whiteboard account.

### Day 4.3 &mdash; Whiteboard save/load via MySQL backend

- **Deliverables**
  - When `BACKEND=mysql`, board persistence goes to MySQL instead of Drive/Sheets.
  - Conversion utility for migrating existing Drive-backed boards to MySQL.

### Day 4.4 &mdash; RBAC tree

- **Deliverables**
  - Five roles: district admin, campus admin, teacher, student, parent.
  - Per-role permission matrix in code; enforced server-side on every endpoint.

### Day 4.5 &mdash; Roster CSV import

- **Deliverables**
  - Admin uploads a roster CSV (district, campus, teacher, students, optional guardian emails).
  - Idempotent upsert; conflict report after import.

### Day 4.6 &mdash; SSO/roster API integration (pick one)

- **Deliverables**
  - First integration with either Clever or ClassLink (pick whichever the first paying district uses).
  - Roster sync runs nightly; teacher/student/guardian rows mirror the SIS.

### Day 4.7 &mdash; Parent portal (read-only)

- **Deliverables**
  - Authenticated parent surface showing the child's account, recent boards, request history, and controls.
  - Pulls from MySQL with strict scoping to the parent's verified children.

### Day 4.8 &mdash; Real-time session enforcement

- **Deliverables**
  - SSE or WebSocket channel; when limit hits, server pushes "session-lock" event and the client locks immediately.

### Day 4.9 &mdash; Cross-device sync on the MySQL path

- **Deliverables**
  - Same board open on multiple devices stays in sync via the existing cloud-sync protocol routed through the MySQL backend.

### Day 4.10 &mdash; DB-backed audit log with retention

- **Deliverables**
  - Same schema as Day 1.7 but in MySQL; partitioned by month; nightly retention job.

### Day 4.11 &mdash; Self-hosted deployment guide

- **Deliverables**
  - `server/DEPLOY.md` covering Docker compose / bare-metal install, env vars, TLS, backups, log rotation.

### Day 4.12 &mdash; Phase 4 documentation pass

- **Deliverables**
  - Update legal docs to mention the self-hosted option's distinct data-handling profile.
  - Update pricing page accordingly.

---

# Out of scope (won't do here)

These are listed so we don't keep returning to them.

- **Signed DPAs.** Legal contracts require a lawyer and a district counterpart. The Privacy Builder template covers ~80% of the language.
- **Court-blocked SCOPE provisions.** A federal ruling has blocked certain content-filtering requirements for social networks. We implement what's currently in force (age registration + lock, parental empowerment, data limits), not what's been enjoined.
- **AI moderation as a default.** Hooking Google Cloud Vision or OpenAI moderation is technically easy but creates a new vendor relationship districts then have to evaluate. We keep manual review as the default; AI moderation can be an opt-in district setting later.
- **A second mode that isn't Apps-Script-or-MySQL.** No half-built SaaS-cluster intermediate. Static + Apps Script for classrooms, MySQL for districts.

---

# Progress log

One line per session, newest first.

```
YYYY-MM-DD  Day X.Y  <one-line summary>  <commit>
```

2026-05-23  Day 2.6  Student data export: Apps Script exportStudentData action builds a ZIP containing JSON+PNG copies of every board and turn-in matching the student, plus a manifest.json with their user row (no hashed credentials), plus a README. Admin gets an Export button next to Issue Parent Code / Delete in the user table; downloads directly to browser. Logs DATA_EXPORT audit event. Pending commit/push.
2026-05-23  Days 2.1, 2.2, 2.5, 2.7  Phase 2 trust additions: Users sheet with age band columns + lock; auto-populated from turn-ins. Admin UI in Compliance Console lists students with age band dropdown (change requires reason; emits AGE_BAND_CHANGED audit event). Teacher-issued one-time parent verification code (8-char alphanumeric, hashed with SHA-256+salt, 14-day expiry, single-use) shown to admin via one-time prompt. Parent form on /parents/ accepts the code; verified requests skip pending_verification. Admin Delete Data action trashes Drive files and removes rows for boards/turnins/user; logs DATA_DELETED audit. Day 2.6 (data export ZIP) still open. Pending commit/push.
2026-05-23  Days 1.1, 1.2, 1.5, 1.6, 1.9  Safety filters live: client-side text + link scan in assets/js/safety.js wired to inline text commit and board title; server-side scan in Apps Script saveBoard_ / saveRoom_ logs TEXT_FILTER_HIT and rejects when blockOnMatch is true. Board/room freeze adds frozen/frozenBy/frozenAt/frozenReason columns; freezeBoard / freezeRoom endpoints; Safety Review section in Teacher Admin lists recent boards + rooms with freeze/unfreeze toggle. Days 1.3/1.4 deferred (whiteboard images embed in board JSON; explicit upload endpoint doesn't exist yet). Pending commit/push.
2026-05-23  Days 0.1, 0.2, 1.7, 1.8, 2.3, 2.4, 3.6  Visible-trust items shipped: config schema + loader, Compliance Console scaffolding, Activity Records (Apps Script helpers + Teacher Admin viewer + CSV export), Family Access Tools page + Apps Script ticket endpoint + admin decide endpoint, District Privacy Packet generator + download button. New files: compliance.config.json, parents/index.html, assets/js/parents.js, docs/COMPLIANCE.md. Pending commit/push.
