# PlanSplat progress

## Version 1.2.0 October 16 2026

Added the shared six-language switcher (English, Spanish, Vietnamese, Arabic, Chinese and Hindi under the shared Hindi/Urdu option), Arabic RTL layout, suite-matching purple and Ocean/Forest/High contrast themes. Language and theme preferences persist on the device. Translations touch app-authored UI only; student text and open task/course drafts remain unchanged. The offline shell includes every translation resource.

Calendar updates now use a complete event update to replace nested start/end fields when switching between all-day and timed deadlines. This prevents date and dateTime coexisting after a patch. Existing reminders are retained. Other Calendar errors expose Google's diagnostic text while Drive saving continues. Automated regression covers both date-mode directions.

JSON download/reimport is verified in a fresh browser: IDs and data survive, and newer work merges without removal. All 28 branded tool shortcuts now target actual apps on both domains; the SplatWorks menu opens the six suite tools directly.

Release checks: five model workflows, 25 Chromium planner workflows, 54 shared wiki/navigation checks and 29 privacy checks passed. The standalone package creates/reopens data with external networking blocked. Theme primary buttons meet 4.5:1 contrast in all four themes; Arabic phone layout, saved preferences, open-draft preservation and fresh-browser JSON restore/merge are covered.

Google sign-in now connects Drive and Calendar together with one token request. Calendar reuses the authorization after Drive loads the correct account's planner. Declining the optional Calendar permission retains Drive saving and offers Connect Calendar in the header. Header retries remove the need to visit settings. Reload/expiry uses the main Reconnect Google flow for both; a session-level Calendar disconnect remains available.

Real verification on October 16: a Google Workspace account granted Calendar consent; the app correctly reported disabled Calendar API. The project owner enabled the API, and the user confirmed that a task with a Due date appeared in the PlanSplat calendar. This verifies real dated-task creation in the original separate-connect workflow. Combined sign-in, subsequent event edits/deletion/restoration and cross-device operations have automated API simulations; do not claim those have all been manually verified.

## Version 1.1.1 October 16 2026

The live review added a cross-device safeguard: managed events whose records have not yet arrived from Drive are preserved. Removal requires an explicit deletion marker or cleared schedule in a known planner record. Calendar account and API acceptance remain pending a real signed-in trial.

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
