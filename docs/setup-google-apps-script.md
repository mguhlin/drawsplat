# DrawSplat&trade; — Google Apps Script Setup

Use this when you want **Google Drive + Sheets** as the backend. You get cloud saves, shared collaboration rooms, templates, student turn-ins, the full Compliance Console (Activity Records, Safety Review, Age Band Lock, Family Access Tools, Retention, Time Limits, District Privacy Packet), and the Parent Request Center.

This is the supported production path today. It scales to roughly hundreds of active users per deployment (Apps Script quotas).

## Prerequisites

- A Google account (Workspace or personal — school accounts work).
- 10–15 minutes for the initial setup.

## Step 1 — Create the Apps Script project

1. Go to [script.google.com](https://script.google.com/).
2. Click **New project**.
3. Rename it (e.g. `DrawSplatTM Backend`).
4. Delete the starter code in `Code.gs`.
5. Open `apps-script/Code.gs` from this repository, copy its full contents, and paste into the Apps Script editor.
6. Save.

> Tip: the first line of `Code.gs` shows `DS_VERSION = '1.x.y'`. Every time the file changes, the version bumps. Use it to verify the deployment is current — `?action=ping` returns this version.

## Step 2 — Run `setup()` once

1. In the Apps Script toolbar, pick `setup` from the function dropdown.
2. Click **Run**.
3. Authorize when prompted. The script needs:
   - **Drive** — to store board JSON and PNG previews.
   - **Sheets** — to maintain the index of boards, rooms, turn-ins, audit events, etc.
   - **External requests** — to verify Google sign-in tokens for the Community board.
   - **Mail** (optional) — to notify the compliance admin on new parent requests.

`setup()` creates a Google Sheet named **DrawSplatTM Saves** in your Drive with these tabs:

| Tab | Purpose |
|---|---|
| `Boards` | One row per saved board |
| `Rooms` | One row per shared collaboration room |
| `Templates` | Saved templates |
| `TurnIns` | Student turn-ins |
| `Audit` | Activity Records (audit log) |
| `ParentRequests` | Family Access Tools tickets |
| `Users` | Student roster with age band metadata |
| `TimeUsage` | Per-day active-time counters for time-limit enforcement |

It also creates a Drive folder named **DrawSplatTM Saves** to hold the file blobs.

## Step 3 — Set Script Properties

In Apps Script: **Project Settings → Script Properties → Add script property**.

| Property | Required? | Purpose |
|---|---|---|
| `ADMIN_PASSCODE` | **Yes** for compliance features | Gates every admin endpoint (Activity Records viewer, Privacy Packet, age band, parent requests). Use 16+ random characters. |
| `COMPLIANCE_ADMIN_EMAIL` | Recommended | Email address that gets notified when a new parent request arrives. |
| `COMPLIANCE_CONFIG` | Auto-generated | Holds the merged safety / retention / time-limit / privacy config blob. Created when you save settings from the Compliance Console. |
| `PASSWORD_SALT` | Auto-generated | Used to hash parent verification codes. Don't change it unless you want to invalidate every outstanding code. |

The compliance features (text filter, link allowlist, retention, time limits) all read defaults from `compliance.config.json` baked into `Code.gs`. You only need `COMPLIANCE_CONFIG` set if you want to override those defaults — and you can do that through the Compliance Console UI rather than editing the property directly.

## Step 4 — Deploy as a Web App

1. **Deploy → New deployment**.
2. Select type: **Web app**.
3. **Description**: `DrawSplat backend v1.0` (or your own).
4. **Execute as**: **Me** (the authoring Google account — required so the script has Drive access).
5. **Who has access**: pick the narrowest setting that still works for your users.
   - **Only myself** — testing.
   - **Anyone with a Google account** — strict, but blocks non-Google users.
   - **Anyone** — what the Community board needs (it uses Google/Microsoft OAuth inside the page). Most school deployments use this.
6. Click **Deploy** and authorize.
7. Copy the **Web app URL** (ends in `/exec`).

## Step 5 — Connect the frontend

1. Open the DrawSplat&trade; site in your browser.
2. Click **Teacher Admin** in the top nav.
3. Enter the admin gate password (separate from `ADMIN_PASSCODE` — this just unlocks the admin page).
4. Paste the Web app URL into **Google Drive + Sheets → Apps Script Web App URL → Save URL**.
5. Click **Test Connection**. You should see a green success message.

That URL is stored only in your browser. Every teacher repeats this step on their own machine. You can hardcode it once at the top of `assets/js/app.js` (`DEFAULT_GOOGLE_SCRIPT_URL`) if you're hosting the site yourself and want every teacher to share one backend without manual entry.

## Step 6 — (Optional) Wire the Community board

If you also want the `/community/` board with Google + Microsoft sign-in:

1. Follow [`community/Setup.md`](../community/Setup.md). It walks through a separate Apps Script project (the Community backend is independent of the whiteboard backend), Google OAuth client ID setup, optional Microsoft Azure App Registration, and pasting the URL into `community/community.js`.

## Step 7 — Verify everything is wired

1. Hit `https://script.google.com/macros/s/YOUR_DEPLOYMENT/exec?action=ping` in a browser. You should see JSON with `ok: true`, `app: "DrawSplatTM"`, and the current `version`.
2. Open the whiteboard, draw something, **Save to Google**. Check Drive — the new `.drawsplat.json` should be in the **DrawSplatTM Saves** folder, and the **Boards** sheet has a new row.
3. Open Teacher Admin → **Compliance Console** → **Activity Records**. Enter your `ADMIN_PASSCODE`. The save you just did should appear as a `BOARD_SAVE` event.

## Upgrading when `Code.gs` changes

The first line of `Code.gs` shows the current version. When this file changes in the repo:

1. Open Apps Script editor.
2. Paste the new `Code.gs` content. Save.
3. Run `setup()` again (safe to run repeatedly — it adds missing tabs/columns, doesn't destroy existing data).
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. Use the same deployment so the `/exec` URL stays stable.
5. Hit `?action=ping` again to verify the version bumped.

## Compliance Console quick reference

Once the backend is wired, Teacher Admin → Compliance Console has eight sections. See [`COMPLIANCE.md`](COMPLIANCE.md) for the full operator guide.

| Section | Quick win to test |
|---|---|
| Safety Review | Toggle filter on/off and freeze a test board |
| Family Access Tools | Submit a request from `/parents/`, approve it here |
| Student Age Band Lock | Run a roster CSV import; change a student's band |
| Use Limits | Enable, set a 60-second daily cap, watch the workspace lock |
| Retention Policy & Cleanup | Set 7-day delete, run cleanup, see audit events |
| Privacy Settings | Read-only declarations + raw config editor |
| Activity Records | Filter by action, download CSV/JSON |
| District Privacy Packet | One-click ZIP for reviewers |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Unknown action" on a compliance endpoint | Deployed `Code.gs` is older than the repo | Paste latest `Code.gs`, save, **Manage deployments → Edit → New version → Deploy**. |
| Form on `/parents/` says "no backend configured" | No Apps Script URL saved in that browser | Open Teacher Admin on that browser, paste the URL, Save. |
| Admin endpoints return "Invalid admin passcode" | `ADMIN_PASSCODE` not set, or the cached one in browser is wrong | Set the script property in Apps Script. In the browser DevTools console: `localStorage.removeItem('drawsplat.complianceAdminPasscode')`. |
| `?action=ping` returns HTML (a Google login page) | Deployment access is restricted | **Manage deployments → Edit → Who has access → Anyone**, then **New version → Deploy**. |
| Cleanup trigger doesn't fire | Trigger not installed | Compliance Console → Retention Policy & Cleanup → **Install Daily Trigger**. |

## Limits

Apps Script has hard quotas — be aware before scaling beyond a few hundred users:

- **Script runtime**: 6 minutes per execution.
- **URL Fetch**: 20 MB / call, 20 K calls / day (consumer accounts), 100 K / day (Workspace).
- **Sheet reads / writes**: efficient for thousands of rows, slow above ~50 K rows.
- **Daily request volume**: roughly 20 K requests / day on consumer accounts.

If you outgrow these, the MySQL backend ([`setup-mysql.md`](setup-mysql.md)) is the next step.
