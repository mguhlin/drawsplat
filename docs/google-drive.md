# Save to Google Drive

Keep a file copy in your Google Drive from the SplatWorks office apps and creative tools. Drive saving is optional: local downloads and existing browser drafts remain available. These saves create files in Drive; they do not convert your work into Google Docs, Sheets or Slides, or automatically sync later edits. **PlanSplat has a separate connected planner workflow:** one Google sign-in loads your planner, automatically updates its Drive files and connects its separate PlanSplat calendar while authorization is active. See the [PlanSplat guide](plansplat.md).

## Save your work

1. Open an app and create or open your work. In PDFSplat, open a PDF first; in MediaSplat, process a file first.
2. Choose the Drive action listed below.
3. Check the filename and choose **Save to Google Drive**.
4. Choose your Google account and allow the requested access. **PDFSplat, VideoSplat and MediaSplat open a separate authorization window:** choose **Continue with Google** there, complete sign-in, then return to the original app tab.
5. Wait for the app’s **Saved** result. **Open in Google Drive** lets you check the saved copy. Editing afterward requires another save for an updated copy.

![The PDFSplat Drive dialog showing a filename, Cancel and Save to Google Drive buttons.](../assets/drive-guide/save-dialog.png)

*The file stays open in its app while you authorize the save. Allow the authorization popup if your browser blocks it.*

## Apps, actions and formats

| App | Where to save | What Drive receives |
| --- | --- | --- |
| PlanSplat | **Continue with Google** | One sign-in for planner autoload/autosave and Calendar updates, account-separated device drafts, and per-browser recovery files; reconnect when authorization expires. |
| WriteSplat, ShowSplat, ListSplat, LayoutSplat | **File → Save to Google Drive** | A native editable project copy. |
| GridSplat | **File → Save → Save Google Drive** | A native editable spreadsheet project. **File → Open → Open Google Drive** reopens its last Drive save from this browser. |
| PDFSplat | **Save PDF to Google Drive** in the toolbar | A PDF with the current edits and page arrangement. |
| VideoSplat | **File → Save project to Google Drive** | A `.videosplat.json` timeline manifest. It references media; keep the originals and relink them when moving to another device. |
| VideoSplat rendered video | **Export video**, render, then **Save video to Google Drive** | The rendered playable video, separate from the editable project manifest. |
| MediaSplat | **Save to Google Drive** beside a processed output; **Save all to Google Drive** for multiple outputs | The processed file, or a ZIP containing the output files. Generated subtitles and transcripts also have SRT and TXT Drive saves. |
| MarkdownSplat | **Save to Google Drive** in the toolbar | Editable `.md` source. |
| ConceptSplat | **Save As → Google Drive**, or the File menu’s Drive action | An editable `.drawsplat-cmap.json` map, including groups, connectors and embedded images. |
| MermaidSplat (DiagramSplat in the app) | **Save to Google Drive** | Editable `.mmd` diagram source. SVG and PNG downloads remain available. |
| AudioSplat | Its existing Google Drive mix export | An audio mix. AudioSplat’s optional sharing choice is separate from saving. |

**Reopen a saved copy:** download the file from Drive, then open or import it in the corresponding app. MermaidSplat has **Open .mmd**. A rendered video or output ZIP contains exported results; keep the native project and source media when you need further editing.

For LayoutSplat, Drive may preview `publication.json` and `README.txt` inside the saved file. This is expected: `.layoutsplat` is a ZIP-based project. Download the whole `.layoutsplat` file and use **File → Open** in LayoutSplat. A real user-run upload, download and reopen succeeded on October 16, 2026; the downloaded one-page project passed archive and native-model validation with five stories, two embedded pictures and nine objects. This verifies that observed account/workflow; school account policies may differ.

The DrawSplat whiteboard’s Google Drive/Sheets saving, rooms and turn-ins use its separate [Apps Script setup](../guides/google-setup.html). You do not need to deploy Apps Script for the direct saves listed above.

## Privacy and school accounts

Google sign-in loads after you choose Drive. The direct saves request `drive.file` access to files used with the app. Their access tokens stay in tab memory. The separate authorization page receives no project content. Cancelling or denying permission leaves your local work available; the new save actions do not enable sharing. Manage access in Google Drive.

If optional connections are off, open [Privacy](../privacy/) and enable them before saving to Drive. School Workspace administrators can restrict Google authorization, so use the account and workflow your school approves. [Security, privacy and terms](../legal/terms-privacy.html#google-oauth-disclosure) covers Google access and district review.

## Troubleshooting

- **Popup blocked:** allow the authorization window for the site, then retry the Drive save.
- **Permission denied or sign-in closed:** your work stays open. Retry or use the local download.
- **Transfer interrupted:** retry when connected. Large files use resumable upload transport, but an interrupted save may need to start again. Check Drive for any completed copy before retrying.
- **Different device or domain:** browser drafts do not move automatically. Download the Drive file and open it in the appropriate app. VideoSplat manifests also need their original media.
- **`origin_mismatch`:** a self-hosted OAuth client must register the exact origin used in the address bar, including protocol and any port. Origins contain no app path.

## District and self-hosted setup

Local editing needs no Google configuration. The public SplatWorks.org and DrawSplat.org sites use the configured public client. A district’s own host needs its own OAuth web client:

1. In the district’s Google Cloud project, enable the **Google Drive API** and configure the OAuth audience/consent settings for the intended users.
2. Under **APIs & Services → Credentials**, open the OAuth client of type **Web application**. Add the exact site under **Authorized JavaScript origins** and save. Use the host’s HTTPS origin; for localhost testing, register both `http://localhost` and `http://localhost:PORT` as Google’s setup guide requires. Keep any other required origins.
3. Add `<meta name="google-drive-client-id" content="YOUR_CLIENT_ID.apps.googleusercontent.com">` before the app scripts in each app’s `index.html`. Retain it in `index.vite.html` when rebuilding Vite apps. GridSplat also supports `VITE_GOOGLE_DRIVE_CLIENT_ID`; AudioSplat retains its own build-time client setting. A client ID is public configuration; never distribute a client secret.
4. Deploy the included `splatworks/shared/` folder. For PDFSplat, VideoSplat and MediaSplat, retain the editors’ isolation headers. Give `/splatworks/shared/google-drive-auth` and its `.html` form `Cross-Origin-Opener-Policy: same-origin-allow-popups` and `Cross-Origin-Embedder-Policy: unsafe-none`.
5. For Cloudflare Pages, use the [current `_headers` file](https://github.com/mguhlin/drawsplat/blob/main/_headers) from the source repository, including when deploying an extracted ZIP. Configure equivalent rules on other servers. Allow Google Drive API connections from the editor and Google identity scripts/frames on the authorization page. Test using a permitted school account before student rollout.

## PlanSplat Calendar setup

PlanSplat's **Continue with Google** requests Drive and app-created Calendar permissions together and connects both services with one authorization. Declining Calendar permission keeps Drive saving available; **Connect Calendar** in the header can enable it later. In the same Google Cloud project as the site's web OAuth client, enable **Google Calendar API** and add `https://www.googleapis.com/auth/calendar.app.created` to the OAuth consent configuration for the intended audience. Keep the existing `drive.file` permission. No client secret or server-side token renewal is needed for the browser reconnect workflow.

The app requests access to secondary calendars created by the app, rather than all calendars. It verifies that Calendar and Drive belong to the same account, creates a separate PlanSplat calendar and stores its ID in the main planner file's Drive app properties. It updates only marked PlanSplat deadline/study events in that calendar. Calendar tokens stay in tab memory. Reloading requires reconnecting; closing the app pauses sync. Calendar changes do not update the planner.

If Calendar returns access denied, check API enablement, consent/audience restrictions and school Workspace policy. Drive autoload/autosave remains available independently. The public project owner enabled Calendar API on October 16, 2026, and a Google Workspace user confirmed dated-task creation in the PlanSplat calendar. Test the intended account and operations for each deployment before rollout. [Google's scope reference](https://developers.google.com/workspace/calendar/api/auth) documents this permission.

See [Google’s OAuth client setup](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid), [modular hosting](../wiki/modular-selfhost.html) and [district installation](../docs/district-selfhost.html).
