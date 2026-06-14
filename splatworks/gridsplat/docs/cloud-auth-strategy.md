# GridSplat Cloud Auth Strategy

Last updated: 2026-06-13

This note answers whether GridSplat can use the same OAuth setup as DrawSplat Community and the whiteboard.

## Short Answer

Use the same Google Cloud or Microsoft Entra tenant/app family where possible, but do not treat every DrawSplat OAuth flow as interchangeable.

- DrawSplat Community uses Google Identity Services and Microsoft sign-in for identity. It verifies a user's name/email and creates a Community session in the Apps Script backend.
- DrawSplat whiteboard uses a teacher-configured Google Apps Script Web App URL for storage. The Apps Script deployment runs under the teacher or school account and writes boards, rooms, templates, and turn-ins to Drive and Sheets.
- GridSplat currently uses browser-only OAuth 2.0 PKCE for direct user cloud save to Google Drive, Dropbox, and OneDrive. It does not use a backend or client secret.

Those are compatible under one deployment policy, but they are not the same token or the same permission model.

## Recommended Unified Model

Keep a single DrawSplat family of OAuth disclosures and deployment instructions, with three clear modes.

| Mode | Used by | Who configures it | What users can do |
| --- | --- | --- | --- |
| Browser-only | DrawSplat, GridSplat | Nobody | Work locally, save/open files manually, use no cloud account. |
| DrawSplat Apps Script storage | Whiteboard today, GridSplat optional future adapter | Co-developer, teacher, or district admin | Save through a school-owned Google Apps Script backend into school-controlled Drive/Sheets. |
| Direct cloud save with OAuth PKCE | GridSplat today | Co-developer or deployment owner | Save a `.gridsplat.json` file directly to the signed-in user's Drive, Dropbox, or OneDrive. |

For public `drawsplat.org`, the cleanest user-facing message is:

> GridSplat works without sign-in. Cloud save is optional. If enabled, it uses either a school-configured DrawSplat Google Apps Script storage backend or a user-authorized Google Drive, Dropbox, or OneDrive connection.

## Can the Existing Community OAuth Client Be Reused?

Sometimes, with changes.

Community's Google client is configured for Google Identity Services. That verifies identity and returns an ID token. GridSplat direct Google Drive save needs an OAuth authorization-code/PKCE client that is allowed to request `https://www.googleapis.com/auth/drive.file` and redirect back to the GridSplat route.

To reuse the same Google OAuth client/project for GridSplat direct Drive save, the deployment owner must confirm:

- The OAuth consent screen names DrawSplat/GridSplat and links to the updated privacy policy and OAuth disclosure.
- The GridSplat origin and route are listed in the OAuth client's authorized redirect/origin settings as required by the provider flow.
- The requested Drive scope is present and approved.
- Google verification is complete before broad public or student-account use.

For Microsoft, the same Entra app can often support both Community sign-in and GridSplat OneDrive save if the app registration includes the required SPA redirect URI and delegated Graph permissions. District tenants may still block it.

Dropbox does not overlap with Community or the whiteboard. It requires its own free Dropbox app registration if that provider remains enabled.

## Who Has to Do What?

End users should not have to configure OAuth. They only choose local save or connect an allowed cloud account after the site is deployed.

The co-developer/deployment owner must do the setup that cannot be done in code:

- Register or update Google, Microsoft, and Dropbox public app/client IDs.
- Add the deployed GridSplat URL as an allowed origin/redirect URL.
- Put the client IDs into the GridSplat build environment.
- Publish the updated privacy/OAuth disclosure URLs on the provider consent screens.
- Test with a real district-managed student account before release.

District or campus IT may also need to approve the apps in Google Workspace or Microsoft Entra. That is an administrative control, not a GridSplat code task.

## No Paid License Requirement

The cloud strategy should not require a paid GridSplat software license or a third-party paid storage license.

- Google, Microsoft, and Dropbox app registrations can be free, though each provider may impose verification, quota, tenant, or admin-approval requirements.
- GridSplat's static hosting model works on free or district-owned hosting.
- Optional support, setup, or professional learning can be paid services, but use of the software should remain free.
- Dependency license review is separate from OAuth. The current dependency list is mostly permissive, but `hyperformula@3.3.0` publishes as `GPL-3.0-only`; see `docs/decisions.md`. To avoid buying a commercial HyperFormula license, GridSplat / SplatStudio is released under GPL-3.0-only while the DrawSplat whiteboard/tools/widgets remain under their existing repository-level license.

## Implementation Direction

Keep the current GridSplat direct provider adapters because they preserve the no-backend privacy model and do not require paid licensing.

Add a future `drawsplat-google-script` cloud provider only if GridSplat needs the whiteboard's teacher-controlled classroom storage model. That adapter should call a school-configured Apps Script URL and store GridSplat native JSON files, but it should remain optional so browser-only and direct cloud save keep working.
