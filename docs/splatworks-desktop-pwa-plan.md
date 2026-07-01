# SplatWorks Desktop PWA Plan

## Purpose

SplatWorks Desktop should start as an installable PWA wrapper for the SplatWorks suite, not as a native rewrite. The goal is to let teachers and students install one app-like launcher that opens GridSplatTM, ShowSplatTM, WriteSplatTM, and ListSplatTM from the same local/static SplatWorks package.

This keeps the browser-first architecture intact while leaving a path toward packaged Windows, macOS, and Linux installers later.

## Product Shape

- One installable app: **SplatWorks Desktop**.
- Start screen: a quiet launcher for the four SplatWorks apps.
- Scope: `/splatworks/` plus the SplatWorks public pages and shared assets needed by those apps.
- Install path: browser install prompt from a manifest-backed PWA.
- Offline behavior: cache the launcher shell and built app assets for the installed package.
- File behavior: keep existing browser save/open flows first; adopt File System Access API where already supported and gracefully fall back to download/upload.

## Why PWA First

- It matches the existing static-site deployment model.
- It avoids Electron/Tauri build complexity at the first step.
- It works for ChromeOS and managed school devices.
- It gives a real install icon, standalone window, offline cache, and app-like launch flow.
- It does not force code signing, installer updates, or native packaging decisions yet.

## Proposed Files

Add these when implementation begins:

- `splatworks/index.html` or a dedicated launcher page if the existing suite page is not enough.
- `splatworks/manifest.webmanifest`
- `splatworks/sw.js`
- `splatworks/icons/` with maskable icons at 192, 512, and app-store-ready source sizes.
- Optional `splatworks/offline.html`
- Optional `splatworks/pwa-install.js` for install prompt handling and install-status UI.

## Manifest Direction

Recommended manifest defaults:

```json
{
  "name": "SplatWorks Desktop",
  "short_name": "SplatWorks",
  "description": "Installable browser office suite for GridSplat, ShowSplat, WriteSplat, and ListSplat.",
  "start_url": "/splatworks/",
  "scope": "/splatworks/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#7c3aed",
  "orientation": "any"
}
```

Use DrawSplat/SplatWorks purple, white, and orange branding. Include maskable icons so Windows, ChromeOS, Android, and desktop Chromium installs look intentional.

## Service Worker Direction

Use a conservative app-shell cache:

- Cache the SplatWorks launcher, manifest, icons, shared CSS/JS, and built static assets.
- Cache each app's current `index.html` and generated assets.
- Avoid caching user-created files.
- Prefer network-first for HTML during online use so new releases arrive.
- Use cache-first for versioned built assets.
- Show `offline.html` only when navigation cannot be served from network or cache.

Version the cache with the release label, for example:

```js
const CACHE_NAME = "splatworks-desktop-v3.2.0";
```

Update cache names during release packaging so stale app shells do not survive forever.

## Launcher Requirements

The launcher should be an actual working workspace, not a marketing page:

- App tiles for GridSplat, ShowSplat, WriteSplat, and ListSplat.
- Recent/local work guidance, if available without backend storage.
- Clear install status: installed, install available, or browser install menu guidance.
- Offline status indicator.
- Direct links to each app's local route.
- Compact help/about menu for file save/open expectations.

## App Integration Requirements

Each app should support being launched inside the installed PWA window:

- Relative asset paths must work under `/splatworks/<app>/`.
- Navigation back to the SplatWorks launcher should be available.
- Save/open flows must not assume cloud storage.
- App titles/icons should remain app-specific inside the suite.
- Offline behavior should fail gracefully if a dynamic import or asset is missing.

## Packaging Relationship

The existing `splatworks-suite-selfhost-<version>.zip` should eventually include the PWA launcher, manifest, icons, and service worker. The individual app ZIPs can stay app-only unless there is a clear need for separate installable PWAs.

Recommended order:

1. Add suite-level PWA files to the source tree.
2. Verify installed behavior locally from a static server.
3. Include PWA files in the SplatWorks suite ZIP.
4. Later decide whether individual app ZIPs should also include app-specific manifests.

## Desktop Executable Path Later

If a true `.exe` or native installer becomes necessary, keep it as a second layer:

- PWA first: installable web app from the browser.
- Tauri later: smaller native wrapper using system webview.
- Electron later: fastest native wrapper if package size is acceptable.

The native wrapper should point at the same SplatWorks launcher and reuse the same app routes. Do not fork app behavior for desktop unless native file dialogs or OS integration become necessary.

## Implementation Phases

### Phase 1: Planning and Assets

- Confirm launcher route.
- Create SplatWorks Desktop icon set.
- Draft manifest.
- Identify every static asset the suite launcher and four apps need offline.

### Phase 2: PWA Shell

- Add `splatworks/manifest.webmanifest`.
- Add `splatworks/sw.js`.
- Register the service worker only from the SplatWorks launcher scope.
- Add install/status UI to the launcher.
- Verify Chrome desktop install and ChromeOS-like standalone display.

### Phase 3: Offline Verification

- Test fresh install from a local static server.
- Load each app once, go offline, reload, and confirm the app shell returns.
- Confirm missing uncached files show a clear offline fallback instead of a blank screen.
- Verify existing save/open flows still work.

### Phase 4: Release Packaging

- Add PWA files to `splatworks-suite-selfhost-<version>.zip`.
- Update download/release notes only when the feature is actually shipping.
- Add a small verification script or Playwright test that checks manifest, service worker registration, and launcher routes.

### Phase 5: Native Wrapper Decision

- Reassess demand for `.exe`, `.dmg`, and Linux packages after the PWA has been used.
- If needed, prototype Tauri first.
- Keep Electron as the fallback when speed matters more than package size.

## Acceptance Criteria

- Browser install prompt is available from the SplatWorks launcher in Chromium-based browsers.
- Installed app opens in standalone display mode.
- Launcher works offline after first successful load.
- Each SplatWorks app opens from the installed launcher.
- Save/open behavior remains local and understandable.
- No DrawSplat whiteboard pages are pulled into the PWA scope unless intentionally linked.
- SplatWorks suite ZIP includes all PWA shell files when the feature ships.

## Open Questions

- Should the public `pages/splatworks.html` become the launcher, or should `/splatworks/` get a dedicated app-like launcher?
- Should GridSplat keep its existing app-level manifest, or should the suite manifest supersede it when installed from the suite launcher?
- Should the launcher maintain a browser-local recent-files list, or avoid that until every app has a shared local file model?
- Do managed school devices need an admin-installable shortcut package separate from browser PWA install?
