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
- manifest: `hub/instances.json`

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
