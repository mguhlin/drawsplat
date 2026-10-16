# PlanSplat student planner development plan

PlanSplat helps students turn assignments, exams and projects into a workable daily and weekly study plan. The canonical app will be available at `/plansplat/` on SplatWorks.org. Google Drive autoload and autosave are required for the connected experience; local drafts protect work during interruptions.

## Student experience

The opening screen is Today: a quick-add field, upcoming deadlines, a short list of planned work, and a focus timer. Students organize work by course and distinguish a deadline from the day they intend to work. A weekly timetable combines classes and study blocks, with a list alternative for small screens and keyboard users.

| Area | First release | Follow-up |
| --- | --- | --- |
| Tasks | Assignments, exams, projects, personal tasks, course, due date/time, study date, priority, notes, links, checklist and completion | Dependencies and reusable project templates |
| Planning | Today, upcoming week, courses, calendar, search, estimated minutes and study blocks | Drag scheduling with keyboard equivalents and workload suggestions |
| Routines | Daily, weekday, weekly and monthly recurrence; habit check-ins | Custom recurrence and term exceptions |
| Focus | Adjustable study/break timer, task association, session history | Longer-term study summaries |
| Portability | Native JSON, CSV, calendar export and printable agenda | Guided Todoist/TickTick mappings and calendar subscriptions |
| Access | Responsive phone/Chromebook/desktop interface, keyboard operation, meaningful focus states, reduced motion | Student usability sessions and additional translations |

Todoist informs quick capture, subtasks, priorities and Today/Upcoming views. TickTick informs calendar planning, focus sessions and routines. The interface and implementation remain original. See [Todoist features](https://www.todoist.com/features) and [TickTick features](https://ticktick.com/?language=en_us).

## Google account and Drive behavior

1. The student chooses Continue with Google and authorizes access to app-used files.
2. Resolve the account from Google, isolate its local draft, and search Drive for PlanSplat files using app properties. A browser-only last-file ID must not be the discovery mechanism.
3. Load and merge the remote planner before uploading any local changes. Create a planner only when no matching remote file exists.
4. Save every edit locally first. After a short debounce, update the main planner and the browser’s stable recovery file. Recovery checkpoints preserve concurrent device edits; avoid creating a new copy on every save.
5. Show Saving, Saved to Google Drive, Offline changes saved on this device, Reconnect, and conflict states accurately. Retry transient failures with bounded backoff.
6. Pull remote changes on return to the tab and periodically while active. Preserve concurrent edits using stable record IDs, field versions and deletion markers. Keep both values for unresolved conflicting edits.
7. Switching accounts changes the local namespace and stops in-flight writes. A draft must never be silently uploaded to a different account. Sign-out clears the active view and offers explicit device-draft removal.

Use a visible `PlanSplat.plansplat.json` file and the `drive.file` scope, with app properties identifying the planner. Students can locate and download it in Drive. Hidden app-data storage is an alternative for settings, not the main planner. [Google documents app-data restrictions](https://developers.google.com/workspace/drive/api/guides/appdata) and [file upload/update operations](https://developers.google.com/workspace/drive/api/guides/manage-uploads).

## Authentication architecture

The existing suite helper creates manual Drive file copies and keeps short-lived tokens in tab memory. PlanSplat needs its own discovery, update and synchronization service. Reuse the shared privacy controls and Google loader without changing other applications' save behavior.

For a future release with continuous token renewal, use Google's authorization-code flow with a small server-side component, encrypted refresh-token storage and an HttpOnly session cookie. The browser receives no refresh token or client secret. Validate OAuth state/origin and Google identity, rotate sessions, restrict API origins, and serialize writes for an account. Revoked permission returns the app to a recoverable reconnect state. [Google's code model](https://developers.google.com/identity/oauth2/web/guides/use-code-model) supports backend token exchange and refresh-token storage.

The user selected a browser-token launch on October 16, 2026. It autoloads and autosaves while authorized and asks the student to reconnect after expiry. Local drafts preserve pending edits. Continuous token renewal is a future deployment option requiring securely configured server credentials. [Google's token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model) documents this constraint.

## Implementation structure

Use a small native JavaScript application with separate model, recurrence/date helpers, IndexedDB storage, Google Drive sync and UI modules. A versioned document contains courses, tasks, habits/check-ins, study blocks, focus sessions and settings. Records use stable IDs, per-field change stamps, and deletion markers. Native imports validate types and limits before replacing anything. Browser storage and Drive content contain student-entered planning data; credentials never enter exports or persistent browser storage.

Keep personal tasks private by default. Calendar export prepares a file without granting access to Google Calendar. Version 1.1 adds separately authorized one-way live updates to an app-created PlanSplat calendar using calendar.app.created; Drive sign-in alone grants no Calendar access. Browser reconnect remains the selected authorization model. Do not request Classroom, Gmail, contacts or whole-Drive access. Group projects, teacher dashboards, push notifications while the app is closed and Classroom imports are separate stages with their own data and authorization requirements.

## Release stages and acceptance

| Stage | Deliverable | Required evidence |
| --- | --- | --- |
| 1 | Account and storage foundation | Real sign-in; discover an existing planner on a new device; repeated saves update one file; denied permission and expired tokens preserve drafts |
| 2 | Daily student planner | Create courses and assignments; checklist and recurrence; filtering/search; local reload; separate due and work dates |
| 3 | Week and focus | Class timetable, study blocks, habit check-ins, accurate timer after tab suspension, print/JSON/CSV/calendar exports |
| 4 | Sync reliability | Two-device edits, same-field conflicts, deletion vs offline edits, duplicate-file recovery, offline reload, rate limits, revoked access and account switching |
| 5 | Publication | Register the app, launcher and short URL; update privacy/wiki/docs and distribution; run browser/mobile/accessibility checks; commit, push, deploy and verify live |

Automated Google API tests verify sync behavior but do not establish real-account acceptance. Record real personal and permitted school-account results separately. Publish completed features and actual limits; keep future features in this plan.
