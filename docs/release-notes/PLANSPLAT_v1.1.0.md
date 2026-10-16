# PlanSplat v1.1.0

PlanSplat now offers optional one-way Google Calendar updates for assignment deadlines and study blocks. Connect Drive, then choose **Backups & settings → Connect Google Calendar** with the same account. The app creates its own PlanSplat calendar and reuses it on another device. Separate permission uses `calendar.app.created`; existing Google calendars and manually added events are preserved.

Edits update managed events; completion marks the title; deleting or restoring an item removes or restores its event. Date-only deadlines are all-day events. Timed deadlines use a 15-minute marker; study blocks retain their duration across daylight-saving changes. Sync runs while PlanSplat is open and authorized. Reconnect after reload or authorization expiry. Calendar edits do not update the planner. Disconnecting leaves existing events. Google Drive saving works independently.

The task editor also supports **+ New course…** and **+ Add course**, selecting the saved course without losing task notes, dates or checklist entries. Cancelling keeps the previous selection.

The [planner guide](https://splatworks.org/wiki/plansplat.html), [Google setup](https://splatworks.org/wiki/google-drive.html#plansplat-calendar-setup), provider disclosures and standalone package are refreshed. The hosting Google Cloud project must enable Calendar API and allow the optional scope. The selected browser reconnect workflow needs no client secret. Existing v3.1.43 full-suite downloads retain their published contents.

Verification covers 5 model workflows, 19 Chromium planner workflows, 46 shared wiki/navigation checks, 29 privacy checks, and standalone offline create/reopen. Google tests simulate API responses; real personal/school-account authorization and Calendar acceptance remain pending a user trial. Interface: English. Application license: AGPL-3.0-or-later.
