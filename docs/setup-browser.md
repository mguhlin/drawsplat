# DrawSplat&trade; — Browser-Only Setup

Use this when you want **the simplest possible deployment**: a single user (or a teacher demoing on a projector) with no accounts, no shared boards, no cloud storage, and no compliance features beyond client-side text filtering.

## What you get

- The whiteboard runs entirely in the browser.
- Boards autosave to `localStorage` and stay on that browser profile.
- No data ever leaves the user's machine.
- Optional **Save File** / **Load File** for keeping local `.drawsplat.json` copies.
- Optional **Export PNG / PDF** for sharing snapshots.

## What you do **not** get

These all require either the Apps Script or MySQL backend:

- Cross-device sync (a board you made at school won't be on your laptop at home).
- Cloud collaboration rooms.
- Activity Records / audit log.
- Parent request center.
- Student age band lock.
- Server-side text filter (only the client-side pre-check runs).
- District Privacy Packet.

## Setup options

### Option A — Use the hosted site (zero setup)

Open [https://drawsplat.org/](https://drawsplat.org/) and click **Open Whiteboard**. Done. Your work is local to that browser.

### Option B — Self-host on Cloudflare Pages, GitHub Pages, or Netlify

1. Clone (or fork) the repository: `git clone https://github.com/mguhlin/drawsplat.git`.
2. Point your static host at the repo root.
   - **Cloudflare Pages**: connect the GitHub repo, build command empty, output directory `/`.
   - **GitHub Pages**: enable Pages on the repo, source `main` branch root.
   - **Netlify**: drag-and-drop the cloned folder, or connect the repo with no build step.
3. Open `https://<your-domain>/` and click **Open Whiteboard**.

That's the full setup. There's no `.env`, no API keys, no Apps Script project, nothing to break.

### Option C — Run from a USB stick / file://

Most browsers refuse to do certain things from `file://` URLs (font loading, fetch). If you really want a no-server deploy, run a tiny static server:

```
cd drawsplat_github
python3 -m http.server 8000
# open http://localhost:8000/
```

This is the safest local-only setup — it gives you HTTP semantics without any cloud.

## Browser settings to know

- **localStorage** holds the active board. Don't clear site data unless you've exported a copy.
- **Incognito / private browsing** uses temporary storage. Anything you draw vanishes when the window closes.
- Some districts auto-clear browser storage on logout. Export a `.drawsplat.json` before logging off if that's your environment.

## Upgrading later

You can move from browser-only to Google Apps Script or MySQL at any time without losing your boards — both backends let you upload an existing `.drawsplat.json` via **Load File**, then save it to the cloud the same session. See [`setup-google-apps-script.md`](setup-google-apps-script.md) or [`setup-mysql.md`](setup-mysql.md) when you're ready.
