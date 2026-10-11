# Browser-only setup

Use a whiteboard without creating an account or installing a database. Draw, write, add media, and save board files on your device.

## Open a board

Open your school’s link, or choose **Apps → Whiteboard** at [DrawSplat.org](https://drawsplat.org/). You can also [open the whiteboard directly](../app/whiteboard.html).

Browser-only use does not enable school classrooms or account-based online saving. Those need a configured [district service](../guides/mysql-setup.html) or the separate [Apps Script connection](../guides/google-setup.html) for its Google-backed workflows.

## Keep your work

- Browser autosave keeps a draft in the current browser profile.
- Use **Save File** to keep a `.drawsplat.json` board you can edit later.
- Use **Load File** to reopen a saved board.
- Export PNG or PDF to share or print work.

Do not rely on browser storage as your only backup. Private browsing uses temporary storage, and some schools clear browser data at logout. Save a file before clearing site data or switching devices.

## Choose where to run it

- **Hosted site:** open the whiteboard link above. No server setup is needed.
- **School website:** use [modular self-hosting](../wiki/modular-selfhost.html) or the [complete district package](../docs/district-selfhost.html). Use the supplied gateway rules to protect private files.
- **Local computer:** serve the static application over HTTP. Opening files directly with `file://` can block fonts, imports, and other features.

For a local static copy, run this from the extracted application folder:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000/app/whiteboard.html`. This local preview serves files; it does not create online accounts or a saving service. Do not expose the whole extracted folder publicly with this preview server.

## Internet and privacy

A local draft is not automatically uploaded. Loading outside images, embedded media, or connected services can make network requests. Internet access may be needed for those features. See [Terms and privacy](../legal/terms-privacy.html) and your school’s notice.

## Add online saving later

Keep a local board file first. After the school configures its saving service, load that file, sign in, and explicitly save it online. Changing a connection does not upload existing drafts. See [saving and exporting](../guides/saving-exporting.html).
