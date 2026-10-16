# PlanSplat progress

## Version 1.1.0 October 16 2026

Added optional one-way Google Calendar updates for task deadlines and scheduled study blocks in a dedicated app-created calendar. Google Drive sign-in is a prerequisite; Calendar asks for separate calendar.app.created consent and confirms the same account using drive.file. Calendar ID discovery uses the main Drive file's app properties. Tokens remain in tab memory, with reconnect after reload/expiry. Edits, completion, deletions and restoration update deterministic managed events; unrelated manually added events remain. Calendar failure does not stop Drive saving. Study durations remain accurate across daylight-saving transitions; nonexistent local times are reported for correction.

Tasks now offer + New course… and + Add course within the editor. Creating/selecting/cancelling a course preserves the unsaved task fields, including on phones.

Validation adds Calendar API simulations for account matching, fresh-device calendar reuse, event updates/removal/restoration, authorization expiry, denied API access, sign-out and time-zone transitions. The guide, permission/provider disclosures, offline shell and standalone package are refreshed. Real Google-account acceptance remains pending because no signed-in browser is connected. Hosts must enable Google Calendar API and configure the optional scope; no OAuth client secret is required for the selected browser reconnect model.

## Version 1.0.0 October 16 2026

Implemented assignments/exams/projects/personal tasks, course timetables, due and study dates, priorities, notes/resource links, checklists, recurring tasks, weekly study blocks, routines, focus/break timer, session history, search, CSV/JSON/calendar export/import, printing and deleted-item restoration.

Google Drive sign-in discovers the account's planner, loads/merges its files, and updates a stable main file plus per-browser recovery checkpoints. Drafts are separated by Google Drive account ID. Tokens remain in tab memory. The user selected explicit reconnect after Google authorization expires; persistent server-side renewal is future work.

Validation: 5 model workflows, 13 Chromium planner workflows (including API simulations), 46 shared wiki/navigation/routing checks, and a standalone-package launcher/create/reload check with external networking blocked. Phone screenshots were reviewed for width, legibility and usable controls. Automated checks cover fresh-device discovery, repeated updates, expired authorization, offline drafts, account switching, sign-out, concurrent checkpoints, recovery, import validation and non-executable task text.

Real personal/school Google account sign-in, upload and cross-device loading remain pending user-run verification. No signed-in browser is connected to this agent session. Google Workspace administrators may restrict authorization. No Classroom/Gmail/calendar connection, closed-app push notifications, collaborative projects or automatic long-lived token renewal ships in this version.

The first release is available as its own app and standalone package. Existing v3.1.43 complete-suite downloads retain their published contents; they do not acquire PlanSplat automatically. The next complete-suite refresh should include this component and its shared assets.
