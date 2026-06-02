# DrawSplatTM Instances

The `comenio/` folder holds Comenio-branded school, campus, or classroom-specific entry points that share the main DrawSplatTM codebase while routing whiteboard storage to a configured backend for that instance.

## Example

The first example instance is:

- `comenio/comeniocampus/`
- public launch page: `comenio/comeniocampus/index.html`
- instance admin: `comenio/comeniocampus/admin.html`
- config: `comenio/comeniocampus/config.json`

The Comenio dashboard is:

- `comenio/index.html`
- manifest: `comenio/instances.json`

## Intended Flow

1. The site owner creates an instance folder and gives the school admin a one-time setup password.
2. The school admin opens the instance admin page.
3. The admin enters the setup password.
4. The admin signs in with Google.
5. The backend verifies the Google ID token and binds that Google account to the instance.
6. Future admin access requires that same Google account.
7. The admin enters the Apps Script Web App URL or MySQL API endpoint for the instance.
8. Teachers and students use the instance launch links so saves route to the instance backend.

## Backend

For production use, do not rely on browser-only storage to protect instance settings. Use a server-side registry. The starter Apps Script registry lives at:

- `apps-script/InstanceRegistry.gs`

It verifies Google tokens using Google's `tokeninfo` endpoint, stores the Google `sub` claim for the instance admin, and returns signed admin sessions.

## Copying for Another School

Copy `comenio/comeniocampus/` to a new slug, then edit:

- `config.json`
- page titles in `index.html` and `admin.html`
- setup password hash/registry values in the instance backend

Then add one object to `comenio/instances.json`. The dashboard sorts entries alphabetically under `Classroom`, `Campus`, or `District`.
