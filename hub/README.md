# DrawSplat Hub

The `hub/` folder holds school, campus, or classroom-specific DrawSplat Hub entry points that share the main DrawSplatTM codebase while routing whiteboard storage to a configured backend for that instance.

## Example

The first example instance is:

- `hub/hubcampus/`
- public launch page: `hub/hubcampus/index.html`
- instance admin: `hub/hubcampus/admin.html`
- config: `hub/hubcampus/config.json`

The DrawSplat Hub dashboard is:

- `hub/index.html`
- protected dashboard/admin: `hub/admin.html`
- manifest: `hub/instances.json`
- Hub OAuth/admin config: `hub/config.json`

## Intended Flow

1. The site owner creates an instance folder and gives the school admin a one-time setup password.
2. The school admin opens the instance admin page.
3. The admin enters the setup password.
4. The admin signs in with Google.
5. The backend verifies the Google ID token and binds that Google account to the instance.
6. Future admin access requires that same Google account.
7. The admin enters the Apps Script Web App URL or MySQL API endpoint for the instance.
8. Teachers and students use the instance launch links so saves route to the instance backend.

## Hub Levels

DrawSplat Hub supports three dashboard levels:

- `Classroom`: independent classroom teachers who are not connected to a campus or district Hub. These instances should be free, with optional Buy Me a Coffee support shown on the admin page.
- `Campus`: one campus admin manages multiple teacher classroom setups under the same campus Hub.
- `District`: one district Hub groups campuses, and each campus can list its teacher classroom setups.

Use `hub/instances.json` to describe those relationships. Campus entries can include a `teachers` array. District entries can include a `campuses` array. The dashboard displays those child records under the parent card and searches across both parent and child names.

## Hub Admin Access

The public splash page stays visible at `hub/index.html`. The live dashboard and teacher-add workflow live at `hub/admin.html`.

Production admin access must use the Apps Script registry, not browser-only checks. Configure:

- `hub/config.json` → `instanceRegistryUrl`
- `hub/config.json` → `googleClientId` from the Google Cloud project owned by `mguhlin@gmail.com`
- Apps Script property `GOOGLE_CLIENT_ID` with that same OAuth client ID
- Apps Script property `HUB_ADMIN_EMAILS=mguhlin@gmail.com,jeguhlin@gmail.com`

The registry verifies the Google ID token server-side and only returns dashboard data to approved Hub admins.

## Adding Teachers

The Instances Admin page can add a teacher as an independent classroom teacher or under a campus. The Apps Script registry creates a folder named `DrawSplat Hub Teachers`, creates a teacher folder/config JSON file, and shares both with the teacher as editor.

This is the easiest reliable ownership path. Google Drive ownership transfer is constrained by account and domain rules, especially across consumer and Workspace accounts. Start by sharing editor access, then transfer ownership manually later when Google permits it.

## Backend

For production use, do not rely on browser-only storage to protect instance settings. Use a server-side registry. The starter Apps Script registry lives at:

- `apps-script/InstanceRegistry.gs`

It verifies Google tokens using Google's `tokeninfo` endpoint, stores the Google `sub` claim for the instance admin, and returns signed admin sessions.

## Copying for Another School

Copy `hub/hubcampus/` to a new slug, then edit:

- `config.json`
- page titles in `index.html` and `admin.html`
- setup password hash/registry values in the instance backend

Then add one object to `hub/instances.json`. The dashboard sorts entries alphabetically under `Classroom`, `Campus`, or `District`.
