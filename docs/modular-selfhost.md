# Modular Self-Hosting

**Current documentation:** [SplatWorks Wiki](https://drawsplat.org/wiki/) — setup, installation, licensing, pricing, OAuth, and district privacy review.


DrawSplatTM can be installed as one complete browser-based package, or as
drop-in modules that share the same folder structure.

## Complete district setup

For the complete SplatWorks ecosystem, including the DrawSplat whiteboard, [download the full source archive](https://github.com/mguhlin/drawsplat/archive/refs/heads/main.zip), extract it, and open `start-here.html`. Quick Start offers each component checked by default and a rerunnable installation plan. The [district setup guide](district-selfhost.html) covers accounts, classrooms, Google, HTTPS and backups. The drop-in static packages below remain available separately.

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
| SplatWorks Tools (legacy DrawSplat package name) | `/pages/tools.html`, `/solutions/` selected tools | You only need standalone creation tools. |
| SplatWorks Widgets (legacy DrawSplat package name) | `/pages/tools.html#widgets`, `/solutions/` selected widgets | You only need quick classroom utilities. |
| SplatWorks Games (legacy DrawSplat package name) | `/games/` | You only need standalone classroom games. |
| AudioSplat | `/solutions/audiosplat/` | You only need the multitrack browser recorder/editor. |
| ClipSplat | `/solutions/clipsplat/` plus `/solutions/mediasplat/ffmpeg/` | Record video, add panels and image cards, cut sections, and export MP4. Use its standalone ZIP with included Python 3 launcher. |
| VideoSplat | `/solutions/videosplat/` | You only need the private browser video editor, subtitle burn-in, and anonymization workflow. |
| MediaSplat | `/solutions/mediasplat/` | You only need media conversion, trimming, and subtitles. |
| PDFSplat | `/solutions/pdfsplat/`, `/vendor/`, `/assets/` | You only need PDF editing, signing, scanning, and local protection. |

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

## Standalone office apps

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
Games modules, plus independent AudioSplat and VideoSplat solution packages.

AudioSplat recording and editing require HTTPS (or localhost for development).
Its included Google Drive client is authorized for `drawsplat.org`; another
self-host domain must provide its own Google OAuth Web client, authorize that
origin, enable Google Drive API, request `drive.file`, and rebuild AudioSplat.

VideoSplat editing, project storage, media analysis, and export are designed to
remain local. Serve it over HTTPS (or localhost during development) so the PWA,
workers, browser storage, and high-performance media APIs are available.

## Subtitle burn-in (v3.1.21)

MediaSplat and VideoSplat standalone packages, the Tools module, and the full DrawSplat package include SRT/VTT burn-in. Keep MediaSplat’s `ffmpeg/DejaVuSans.ttf` and `ffmpeg/FONT-LICENSE.txt` with its split runtime files. Update the complete app folder so the HTML, hashed assets, service worker, and font stay together. See the [subtitle walkthrough](../blog/subtitle-burn-in.html).

## Automatic subtitles (v3.1.23)

VideoSplat, MediaSplat, Tools, and full packages include the bundled ONNX speech
runtime and `solutions/shared/subtitles` source package. Keep that sibling package
when rebuilding either app with npm. The model downloads on first generation
from Hugging Face (about 42 MB) and is cached separately by the browser. Media and
caption text are never uploaded. Offline transcription requires a cached model
and runtime. If you add a host CSP, permit the model download hosts listed in
`solutions/videosplat/docs/NETWORK_INVENTORY.md`; keep runtime scripts same-origin.
See the [automatic subtitle walkthrough](../blog/automatic-subtitles.html).

## Current release: v3.1.37

The versioned v3.1.37 release contains these downloads: full DrawSplat, SplatWorks suite and five individual apps, Tools, Widgets, Games, AudioSplat, VideoSplat, MediaSplat, and PDFSplat. Download matching versions from [the download page](../pages/download.html) and verify them with the release’s `SHA256SUMS-v3.1.37.txt`. The full package includes whiteboard v3.1.12 and the portable MySQL API; individual modules contain their relevant apps and shared files, not a separate whiteboard or MySQL service. Stop active recordings/exports before updating shared assets, keep backups of local projects and backend data, and retain server-only configuration rather than overwriting it with example settings.

The download page shows approximate ZIP and unpacked sizes, measured from release archives in decimal MB. Run `python3 scripts/update-download-sizes.py vX.Y.Z` after building a release, rebuild with the updated page, then use `--check` to verify displayed sizes against the final archives.

## Offline entry points

Extract the entire ZIP and keep the folder structure intact. Every package includes `OPEN-APP.html`; individual packages also have a root `index.html` shortcut when that name is not already used. Complete DrawSplat and Tools include `Open-VideoSplat.html`, `Open-MediaSplat.html`, `Open-AudioSplat.html`, `Open-PDFSplat.html`, and `Open-CipherSplat.html`.

PDFSplat and CipherSplat’s dedicated offline edition open directly from disk in desktop Chrome and Firefox. The complete package’s CipherSplat shortcut selects its included offline edition for file access and its hosted app for HTTP access. AudioSplat, VideoSplat, and MediaSplat require the supplied local launcher (Python 3); their file shortcuts show `START-HERE.html`. A web page cannot automatically start Python or bypass file-origin browser restrictions. Once running locally, core editing does not need internet. Online services and first-time speech-model downloads still do.

### ClipSplat add-on

ClipSplat v1.1.1 is a separate [download](https://github.com/mguhlin/drawsplat/releases/tag/clipsplat-v1.1.1). The existing v3.1.28 archives predate it. Extract the ClipSplat ZIP and upload its `solutions/` folders alongside an existing installation, or use START-HERE.html and the Python 3 launcher locally. Keep its included MediaSplat FFmpeg runtime at the supplied path. The v3.1.37 full/Tools bundles include ClipSplat. The v3.1.37 release also supplies a refreshed standalone ClipSplat ZIP and records its checksum in the combined SHA-256 list.

## Typing Games in v3.1.29

The full DrawSplat and Games packages include the Typing Games menu and Cipher Chase, Wordfall Reactor, Story Sprint, and Paws & Keys Adventure. Install the complete `games/`, `assets/`, and `vendor/` folders supplied in the package; individual game folders depend on shared files in `games/typing-games/`. Use the Python 3 launcher for local HTTP access or publish to a static web server. No remote word-bank service is needed. See [the game guide](typing-games.md) for language behavior, TEKS scope, and legacy redirects expiring April 8, 2027.

## October 9 creative-tool updates

Current packages include document/image import and PNG/JPG/WebP export in PDFSplat, point placement and on-page formatting, matched text appearance, preserved page rotation, ImageSplat photo adjustments, VideoSplat timeline markers, AudioSplat analysis, ShowSplat WebDeck v5 and slide search, and labelled action icons. Keep shared styles, icon folders, PDF libraries, and ShowSplat framework files together. [Details and conversion limits](release-notes/RELEASE_NOTES_v3.1.35.md).

Version v3.1.35 also includes PDFSplat presentation/full-screen controls, timed looping, blank screens, and portable WebDeck v5 export in the applicable packages.


## October 14 package refresh

The v3.1.37 release includes LayoutSplat v0.4.6, 123 distinct compositions, a rich draggable editor and 96 shared whiteboard images, alongside standalone LayoutSplat, the five-app SplatWorks
suite, official glossy SplatWorks website artwork, and current SplatWorks Wiki.
The complete district suite is district-suite-v1.2.7. Archive/root paths remain
compatible with existing installations. Branding does not rename MySQL/MariaDB
databases, tables, service/environment names, accounts, rosters, or whiteboard files.
Back up deployed configuration and data before replacing application files.

### v3.1.37 validation and exchange update

Current packages add browser-native legacy QuarkXPress 3.1–4.1 import, binary DOC
and formatted DOCX/ODT text-box insertion, original font/style matching, updating
folios, editable reading order, richer WriteSplat paragraph exchange and independent
print preflight. WriteSplat v0.2.0 supplies blank documents, Letter page outlines,
rulers, indents and paragraph tabs. [Illustrated LayoutSplat guide](layoutsplat-features.md).

All 16 packages started offline in Chromium and Firefox; 12 focused LayoutSplat
workflows passed against the extracted standalone package. Four district Quick
Start workflows passed using the packaged entry page. The release ZIPs were checked
for CRC, checksums, safe paths and private-file exclusions. Native INDD, modern
Pages IWA, QuarkXPress 5+ and external print certification remain outside support.

## Current names and versioned archives

SplatWorks is the ecosystem and DrawSplat is its whiteboard. Existing release ZIP filenames and bundled labels retain the names used when built. For the current tool names and privacy documentation, use the [wiki](../wiki/) or build from the current source archive; do not assume a previously published ZIP was rebuilt by a documentation update.

## Optional Google Drive saving

The office suite and PDFSplat, VideoSplat, MediaSplat, MarkdownSplat, ConceptSplat,
and MermaidSplat include optional file saving to Google Drive. Keep the shared
`splatworks/shared/` folder and configure your district’s OAuth web client and
exact HTTPS origin. Editing and local downloads do not require Google.

PDFSplat, VideoSplat and MediaSplat use a separate authorization page so their
processing isolation can be preserved. Apply the included `_headers` rules (or
your server’s equivalents) to both the editor and `/splatworks/shared/google-drive-auth`
with or without `.html`. Follow the
[format table and district setup](../pages/splatworks.html#save-to-google-drive).

## ImageSplat PNG exports · v3.1.46

The v3.1.46 full DrawSplat, Tools, and complete district-suite downloads include the ImageSplat PNG border fix. **Export PNG** and **Copy PNG** include all visible images and annotations, regardless of selection, and fit the output to their bounds. **File → Export selection** includes only the selected visible layers. Multiline text, underlines, strokes, and arrowheads are included without the white editing canvas or selection handles. Gaps remain transparent; white pixels already inside an imported image remain part of that image. Hide layers you do not want to include.

Back up projects and server configuration before replacing files. Extract the entire matching full, Tools, or district ZIP and retain its shared folders; use the included launcher for local editing. Earlier v3.1.45 packages remain available and predate this fix. Office, media, Widgets, Games, PlanSplat, and ListSplat downloads keep their separately listed versions. Verify the three refreshed ZIPs using `SHA256SUMS-v3.1.46.txt`; the district archive also has an individual `.zip.sha256` file. [Downloads](../pages/download.html#imagesplat-png-export) · [Release notes](release-notes/RELEASE_NOTES_v3.1.46.md).
