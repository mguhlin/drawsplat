# Classroom setup template

The admin wizard works today with a one-time Copy setup script installation. To
replace that step with a template:

1. Create a **new, empty** Google Sheet in the account that will own the public
   template. Do not reuse or share a Sheet containing classroom data.
2. In Extensions → Apps Script, replace the starter code with the current
   `apps-script/Code.gs` from this repository and save. Reload the Sheet to verify
   the DrawSplat menu appears. Do not add personal credentials or student work.
3. Share the empty Sheet as a view-only template with copying allowed. Verify
   the copy link from another account. Make a test copy, use DrawSplat → Prepare
   classroom storage, and publish that copy as a Web app. Check and save its
   connection using step 4 of the admin wizard. Verify a board saves and loads.
4. Set `spreadsheetId` in `apps-script/setup-template.json` to the verified empty
   template's ID. Deploy. The wizard switches to Copy classroom template and
   hides manual installation.

Copying a bound Sheet also copies its attached script. Google's publishing and
permission steps still belong to each teacher. When changing `Code.gs`, update
the template too; existing copies do not receive script updates automatically.

The prepare-storage action binds each copy to its own Sheet and creates its own
Drive folder. It creates missing tabs and repairs mismatched headers using the
existing setup routine, which clears a mismatched tab. Use a clean classroom
file for initial setup; preserve backups when updating an existing backend.

References: https://developers.google.com/apps-script/guides/bound and
https://developers.google.com/apps-script/guides/web.
