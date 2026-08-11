# Modular Self-Hosting

DrawSplatTM can be installed as one complete browser-based package, or as
drop-in modules that share the same folder structure.

## Package model

All modules are static files. There is no installer and no server-side linking
step. To combine modules, unzip them into the same web root.

| Package | Main paths | Use when |
|---|---|---|
| DrawSplatTM full package | `/`, `/app/`, `/pages/`, `/solutions/`, `/games/`, `/admin/`, `/server/` | You want the complete whiteboard, tools, widgets, games, docs, and backend scaffolds. |
| SplatWorksTM suite | `/splatworks/`, `/pages/splatworks.html` | You want the browser-based office suite as its own entity. |
| GridSplatTM | `/splatworks/gridsplat/` | You only need the spreadsheet app. |
| ShowSplatTM | `/splatworks/showsplat/` | You only need the presentation/WebDeck app. |
| WriteSplatTM | `/splatworks/writesplat/` | You only need the writing app. |
| ListSplatTM | `/splatworks/listsplat/` | You only need the database app. |
| DrawSplatTM Tools | `/pages/tools.html`, `/solutions/` selected tools | You only need standalone creation tools. |
| DrawSplatTM Widgets | `/pages/tools.html#widgets`, `/solutions/` selected widgets | You only need quick classroom utilities. |
| DrawSplatTM Games | `/games/` | You only need standalone classroom games. |
| AudioSplat | `/solutions/audiosplat/` | You only need the multitrack browser recorder/editor. |

## Combining modules

1. Create a web root folder, such as `drawsplat-site/`.
2. Unzip one or more packages into that same folder.
3. Keep existing folder names unchanged.
4. Serve the folder with any static host.

Example:

```text
drawsplat-site/
├── index.html
├── app/
├── pages/
├── assets/
├── splatworks/
├── solutions/
└── games/
```

The modules connect because they keep the same paths used by the full
DrawSplatTM download.

## Standalone SplatWorks

SplatWorksTM can be hosted without the DrawSplatTM whiteboard. Install the
SplatWorksTM suite package and open:

```text
/pages/splatworks.html
```

Direct app paths:

```text
/splatworks/gridsplat/
/splatworks/showsplat/
/splatworks/writesplat/
/splatworks/listsplat/
```

## Building packages

From the repository root:

```bash
./scripts/make-selfhost-bundle.sh vX.Y.Z
```

The command produces the full DrawSplatTM package, individual SplatWorksTM app
packages, the SplatWorksTM suite package, and standalone Tools, Widgets, and
Games modules, plus an independent AudioSplat solution package.

AudioSplat recording and editing require HTTPS (or localhost for development).
Its included Google Drive client is authorized for `drawsplat.org`; another
self-host domain must provide its own Google OAuth Web client, authorize that
origin, enable Google Drive API, request `drive.file`, and rebuild AudioSplat.
