#!/usr/bin/env bash
#
# DrawSplatTM / SplatWorksTM self-hosting bundle builder.
#
# Produces:
#   - dist/drawsplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/splatworks-gridsplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/splatworks-showsplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/splatworks-writesplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/splatworks-listsplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/splatworks-suite-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/drawsplat-tools-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/drawsplat-widgets-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/drawsplat-games-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/audiosplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/videosplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/mediasplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/pdfsplat-selfhost-YYYYMMDD-<shortsha>.zip
#
# The DrawSplatTM bundle contains the full static site, backends, and compliance
# docs. SplatWorksTM, tools, widgets, and games also ship as drop-in modules so
# each family can be updated without forcing a full DrawSplatTM download refresh.
#
# Run from the repo root:
#   ./scripts/make-selfhost-bundle.sh
#
# Override the version label:
#   ./scripts/make-selfhost-bundle.sh v1.0.0
#

set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
node scripts/build-pdfsplat.mjs
bash scripts/build-ciphersplat-offline.sh

VERSION_LABEL="${1:-}"
DATE="$(date -u +%Y%m%d)"
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  SHORT_SHA="$(git rev-parse --short HEAD)"
else
  SHORT_SHA="nogit"
fi

if [ -z "$VERSION_LABEL" ]; then
  VERSION_LABEL="$DATE-$SHORT_SHA"
fi

OUT_DIR="dist"
STAGE_DIR="$(mktemp -d)"
DRAWSPLAT_ROOT="$STAGE_DIR/drawsplat-selfhost-$VERSION_LABEL"
GRID_ROOT="$STAGE_DIR/splatworks-gridsplat-selfhost-$VERSION_LABEL"
SHOW_ROOT="$STAGE_DIR/splatworks-showsplat-selfhost-$VERSION_LABEL"
WRITE_ROOT="$STAGE_DIR/splatworks-writesplat-selfhost-$VERSION_LABEL"
LIST_ROOT="$STAGE_DIR/splatworks-listsplat-selfhost-$VERSION_LABEL"
SPLATWORKS_SUITE_ROOT="$STAGE_DIR/splatworks-suite-selfhost-$VERSION_LABEL"
TOOLS_ROOT="$STAGE_DIR/drawsplat-tools-selfhost-$VERSION_LABEL"
WIDGETS_ROOT="$STAGE_DIR/drawsplat-widgets-selfhost-$VERSION_LABEL"
GAMES_ROOT="$STAGE_DIR/drawsplat-games-selfhost-$VERSION_LABEL"
AUDIOSPLAT_ROOT="$STAGE_DIR/audiosplat-selfhost-$VERSION_LABEL"
VIDEOSPLAT_ROOT="$STAGE_DIR/videosplat-selfhost-$VERSION_LABEL"
MEDIASPLAT_ROOT="$STAGE_DIR/mediasplat-selfhost-$VERSION_LABEL"
PDFSPLAT_ROOT="$STAGE_DIR/pdfsplat-selfhost-$VERSION_LABEL"
DRAWSPLAT_OUT_NAME="drawsplat-selfhost-$VERSION_LABEL.zip"
GRID_OUT_NAME="splatworks-gridsplat-selfhost-$VERSION_LABEL.zip"
SHOW_OUT_NAME="splatworks-showsplat-selfhost-$VERSION_LABEL.zip"
WRITE_OUT_NAME="splatworks-writesplat-selfhost-$VERSION_LABEL.zip"
LIST_OUT_NAME="splatworks-listsplat-selfhost-$VERSION_LABEL.zip"
SPLATWORKS_SUITE_OUT_NAME="splatworks-suite-selfhost-$VERSION_LABEL.zip"
TOOLS_OUT_NAME="drawsplat-tools-selfhost-$VERSION_LABEL.zip"
WIDGETS_OUT_NAME="drawsplat-widgets-selfhost-$VERSION_LABEL.zip"
GAMES_OUT_NAME="drawsplat-games-selfhost-$VERSION_LABEL.zip"
AUDIOSPLAT_OUT_NAME="audiosplat-selfhost-$VERSION_LABEL.zip"
VIDEOSPLAT_OUT_NAME="videosplat-selfhost-$VERSION_LABEL.zip"
MEDIASPLAT_OUT_NAME="mediasplat-selfhost-$VERSION_LABEL.zip"
PDFSPLAT_OUT_NAME="pdfsplat-selfhost-$VERSION_LABEL.zip"
CHECKSUM_OUT_NAME="SHA256SUMS-$VERSION_LABEL.txt"
DRAWSPLAT_OUT_PATH="$OUT_DIR/$DRAWSPLAT_OUT_NAME"
GRID_OUT_PATH="$OUT_DIR/$GRID_OUT_NAME"
SHOW_OUT_PATH="$OUT_DIR/$SHOW_OUT_NAME"
WRITE_OUT_PATH="$OUT_DIR/$WRITE_OUT_NAME"
LIST_OUT_PATH="$OUT_DIR/$LIST_OUT_NAME"
SPLATWORKS_SUITE_OUT_PATH="$OUT_DIR/$SPLATWORKS_SUITE_OUT_NAME"
TOOLS_OUT_PATH="$OUT_DIR/$TOOLS_OUT_NAME"
WIDGETS_OUT_PATH="$OUT_DIR/$WIDGETS_OUT_NAME"
GAMES_OUT_PATH="$OUT_DIR/$GAMES_OUT_NAME"
AUDIOSPLAT_OUT_PATH="$OUT_DIR/$AUDIOSPLAT_OUT_NAME"
VIDEOSPLAT_OUT_PATH="$OUT_DIR/$VIDEOSPLAT_OUT_NAME"
MEDIASPLAT_OUT_PATH="$OUT_DIR/$MEDIASPLAT_OUT_NAME"
PDFSPLAT_OUT_PATH="$OUT_DIR/$PDFSPLAT_OUT_NAME"
CHECKSUM_OUT_PATH="$OUT_DIR/$CHECKSUM_OUT_NAME"

mkdir -p "$OUT_DIR" "$DRAWSPLAT_ROOT" "$GRID_ROOT" "$SHOW_ROOT" "$WRITE_ROOT" "$LIST_ROOT" "$SPLATWORKS_SUITE_ROOT" "$TOOLS_ROOT" "$WIDGETS_ROOT" "$GAMES_ROOT" "$AUDIOSPLAT_ROOT" "$VIDEOSPLAT_ROOT" "$MEDIASPLAT_ROOT" "$PDFSPLAT_ROOT"
rm -f "$DRAWSPLAT_OUT_PATH" "$GRID_OUT_PATH" "$SHOW_OUT_PATH" "$WRITE_OUT_PATH" "$LIST_OUT_PATH" "$SPLATWORKS_SUITE_OUT_PATH" "$TOOLS_OUT_PATH" "$WIDGETS_OUT_PATH" "$GAMES_OUT_PATH" "$AUDIOSPLAT_OUT_PATH" "$VIDEOSPLAT_OUT_PATH" "$MEDIASPLAT_OUT_PATH" "$PDFSPLAT_OUT_PATH" "$CHECKSUM_OUT_PATH"

EXCLUDES=(
  ".git"
  ".github"
  ".codex"
  ".agents"
  "node_modules"
  "dist"
  "tmp"
  "build"
  "coverage"
  ".tmp"
  "test-results"
  "playwright-report"
  ".DS_Store"
  "audit_instructions.md"
  ".env"
  ".env.local"
  "/package.json"
  "/package-lock.json"
  "/splatworks"
  "*.log"
  "*.swp"
  "drawsplat-selfhost-*.zip"
  "splatworks-gridsplat-selfhost-*.zip"
  "splatworks-showsplat-selfhost-*.zip"
  "splatworks-writesplat-selfhost-*.zip"
  "splatworks-listsplat-selfhost-*.zip"
  "splatworks-suite-selfhost-*.zip"
  "drawsplat-tools-selfhost-*.zip"
  "drawsplat-widgets-selfhost-*.zip"
  "drawsplat-games-selfhost-*.zip"
  "audiosplat-selfhost-*.zip"
  "videosplat-selfhost-*.zip"
  "mediasplat-selfhost-*.zip"
  "pdfsplat-selfhost-*.zip"
)

RSYNC_ARGS=(-a --delete)
for pattern in "${EXCLUDES[@]}"; do
  RSYNC_ARGS+=(--exclude "$pattern")
done

if command -v rsync >/dev/null 2>&1; then
  rsync "${RSYNC_ARGS[@]}" ./ "$DRAWSPLAT_ROOT/"
else
  echo "rsync not found; falling back to cp + manual prune (slower)" >&2
  cp -r ./ "$DRAWSPLAT_ROOT"
  for pattern in "${EXCLUDES[@]}"; do
    find "$DRAWSPLAT_ROOT" -name "$pattern" -prune -exec rm -rf {} + 2>/dev/null || true
  done
fi

if [ -d "$DRAWSPLAT_ROOT/hub" ]; then
  find "$DRAWSPLAT_ROOT/hub" -mindepth 1 -maxdepth 1 -type d ! -name "hubcampus" -prune -exec rm -rf {} +
  cat > "$DRAWSPLAT_ROOT/hub/instances.json" <<'EOF'
[
  {
    "slug": "hubcampus",
    "name": "DrawSplat Hub Campus",
    "category": "Campus",
    "status": "Demo",
    "lastActivity": "Demo only",
    "licenseModel": "Campus-managed classrooms",
    "ownerType": "Campus admin",
    "summary": "Demo campus where a single admin manages multiple teacher classroom setups.",
    "path": "hubcampus/",
    "adminPath": "hubcampus/admin.html",
    "whiteboardPath": "hubcampus/whiteboard.html",
    "configPath": "hubcampus/config.json",
    "teachers": [
      {
        "slug": "sample-teacher",
        "name": "Sample Teacher Classroom",
        "teacher": "Demo Teacher",
        "status": "Demo",
        "summary": "Example classroom setup under this campus."
      }
    ]
  }
]
EOF
fi

cat > "$DRAWSPLAT_ROOT/SELFHOST-README.txt" <<EOF
DrawSplatTM Self-Hosted Bundle
==============================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- The complete static site (index.html, app/, pages/, legal/, guides/, parents/,
  community/, languages/, admin/, games/, solutions/) ready to drop
  into any static host.
- apps-script/Code.gs  — the Google Apps Script backend (single-file).
- server/mysql-backend/ — Node.js + MySQL backend with Docker compose.
- compliance.config.json — default safety / retention / privacy configuration.
- docs/, guides/ — operator + setup documentation.
- hub/ — generic DrawSplat Hub dashboard plus hubcampus demo only. Real Hub
  campus folders from drawsplat.org are intentionally excluded from this bundle.
- COMPLIANCE-ROADMAP.md, LICENSE, README.md — project context.

What is not in this zip
-----------------------
SplatWorksTM apps, including GridSplatTM, ShowSplatTM, WriteSplatTM, and
ListSplatTM, are packaged separately. Download
splatworks-gridsplat-selfhost-$VERSION_LABEL.zip when you want the spreadsheet
app, splatworks-showsplat-selfhost-$VERSION_LABEL.zip when you want the
presentation/WebDeck app, splatworks-writesplat-selfhost-$VERSION_LABEL.zip
when you want the writing app, and
splatworks-listsplat-selfhost-$VERSION_LABEL.zip when you want the classroom
database app.
This keeps GPL-covered SplatWorks app releases independent from DrawSplatTM
whiteboard/tools/widgets/games releases.

Deployment paths
----------------
1. Browser-only (no accounts):
     Open START-HERE.html and use the included local launcher (Python 3),
     or upload the whole tree to a static host.

2. Google Apps Script (recommended for teachers and most districts):
     Follow guides/google-setup.html. Paste apps-script/Code.gs into a new
     Apps Script project bound to a Google Sheet, deploy as Web App.

3. Portable MySQL (private account-owned online Save/Open):
     Follow guides/mysql-setup.html and docs/setup-mysql.md for Railway,
     DigitalOcean, or an existing MySQL 8 server. Docker or Node.js 22+ required.
     The browser uses an HTTPS API; database credentials stay on the server.
     In admin/mysql-setup.html enter the public API address, choose
     Test & Enable Online Saving, and create a teacher saving account.
     Use File > Save online / Open online board / Online account.
     Student accounts must be school-provisioned. Added audio/video notes
     are included in board JSON. Saving is explicit, with revision checks.
     Google shared rooms, galleries, moderation, and turn-in/review remain
     separate; advanced district modules require their own validation.
     Configure backups before classroom use. Moving providers does not
     migrate data automatically; follow the guide's restore instructions.

Compliance
----------
Read legal/texas-compliance.html for the plain-language overview.
Read guides/compliance-guide.html for day-to-day operator instructions.
Read COMPLIANCE-ROADMAP.md for the implementation map (Phases 0-3 = Apps Script
path, Phase 4 = MySQL path).

Support
-------
- Contact form: pages/contact.html (free, opt-in for paid PD)
- Optional donation: https://buymeacoffee.com/drawsplat
- License: AGPL-3.0-or-later (see LICENSE)
EOF

SPLATWORKS_EXCLUDES=(
  ".codex"
  ".agents"
  "node_modules"
  "dist"
  "coverage"
  "test-results"
  "playwright-report"
  "tsconfig.tsbuildinfo"
  "assets/assets"
  ".env"
  ".env.local"
  "*.log"
  "*.swp"
)

copy_tree() {
  local source_path="$1"
  local dest_path="$2"
  shift 2
  local excludes=("$@")
  mkdir -p "$(dirname "$dest_path")"
  if command -v rsync >/dev/null 2>&1; then
    local args=(-a --delete)
    for pattern in "${excludes[@]}"; do
      args+=(--exclude "$pattern")
    done
    rsync "${args[@]}" "$source_path/" "$dest_path/"
  else
    rm -rf "$dest_path"
    mkdir -p "$(dirname "$dest_path")"
    cp -R "$source_path" "$dest_path"
    for pattern in "${excludes[@]}"; do
      find "$dest_path" -name "$pattern" -prune -exec rm -rf {} + 2>/dev/null || true
    done
  fi
}

copy_file() {
  local source_path="$1"
  local dest_path="$2"
  mkdir -p "$(dirname "$dest_path")"
  cp "$source_path" "$dest_path"
}

MODULE_EXCLUDES=(
  ".git"
  ".github"
  ".codex"
  ".agents"
  "node_modules"
  "dist"
  "coverage"
  "test-results"
  "playwright-report"
  "tsconfig.tsbuildinfo"
  ".env"
  ".env.local"
  "*.log"
  "*.swp"
)

TOOLS_SOLUTIONS=(
  shared
  animated-gif
  audiosplat
  videosplat
  mediasplat
  big-link
  chart-studio
  CipherSplat
  coloring-book
  concept-map
  dicebreakers
  graph-maker
  markdown-studio
  mermaid
  picture-graph
  pdfsplat
  rubric-builder
  splatimage-studio
  imagesplat
  graphsplat
  qrsplat
  sketchspace-VR
  wordsearch
)

WIDGET_SOLUTIONS=(
  bingo-card-generator
  bingo-caller
  brain-sort
  clock-wizard
  coinflipping
  dice
  drawsketch
  fortune
  memepuzzle
  memesplat
  quiz-flashcard-studio
  step-splat
  splatbot-studio
  storywheel
  toneshifter
  vibe-check
  wheel-spinner
)

copy_tree splatworks/gridsplat "$GRID_ROOT/splatworks/gridsplat" "${SPLATWORKS_EXCLUDES[@]}"

cat > "$GRID_ROOT/SPLATWORKS-GRIDSPLAT-README.txt" <<EOF
SplatWorksTM GridSplatTM Self-Hosted Bundle
==========================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- splatworks/gridsplat/ — the built GridSplatTM static app plus source, tests, docs, and
  package metadata for rebuilding from source.
- splatworks/gridsplat/LICENSE.md and splatworks/gridsplat/COPYING — GPL-3.0-only license text for
  GridSplatTM / SplatWorksTM spreadsheet code.

Deployment
----------
GridSplatTM is currently built to run from /splatworks/gridsplat/.

1. Upload the included splatworks/ folder to your static host.
2. Open https://your-domain.example/splatworks/gridsplat/.
3. To rebuild from source:
     cd splatworks/gridsplat
     npm install
     npm run build

Licensing boundary
------------------
GridSplatTM is packaged separately from DrawSplatTM so spreadsheet updates can
ship without requiring a full DrawSplatTM whiteboard/tools/widgets/games
download. GridSplatTM is GPL-3.0-only. DrawSplatTM whiteboard code, tools,
widgets, games, backends, and compliance features remain under the repository
level DrawSplatTM license unless a file or subdirectory says otherwise.
EOF

copy_tree splatworks/showsplat "$SHOW_ROOT/splatworks/showsplat" "${SPLATWORKS_EXCLUDES[@]}"
copy_tree vendor "$SHOW_ROOT/vendor" "${MODULE_EXCLUDES[@]}"

cat > "$SHOW_ROOT/SPLATWORKS-SHOWSPLAT-README.txt" <<EOF
SplatWorksTM ShowSplatTM Self-Hosted Bundle
==========================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- splatworks/showsplat/ — the ShowSplatTM static presentation and WebDeck authoring app.
- splatworks/showsplat/docs/plan.md — the ShowSplatTM feature plan and release scope.
- vendor/ — bundled JSZip and PDF.js files used by import/export workflows.

Deployment
----------
ShowSplatTM is a static browser app.

1. Upload the included splatworks/ folder to your static host.
2. Open https://your-domain.example/splatworks/showsplat/.

Licensing boundary
------------------
ShowSplatTM is packaged separately from DrawSplatTM so presentation app updates
can ship without requiring a full DrawSplatTM whiteboard/tools/widgets/games
download. ShowSplatTM is GPL-3.0-only as part of the SplatWorksTM app family.
DrawSplatTM whiteboard code, tools, widgets, games, backends, and compliance
features remain under the repository-level DrawSplatTM license unless a file or
subdirectory says otherwise.
EOF

copy_tree splatworks/writesplat "$WRITE_ROOT/splatworks/writesplat" "${SPLATWORKS_EXCLUDES[@]}"

cat > "$WRITE_ROOT/SPLATWORKS-WRITESPLAT-README.txt" <<EOF
SplatWorksTM WriteSplatTM Self-Hosted Bundle
===========================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- splatworks/writesplat/ — the WriteSplatTM browser writing and classroom
  publishing app, including source, tests, docs, package metadata, and icon
  assets.
- splatworks/writesplat/docs/plan.md — the WriteSplatTM feature plan and
  release scope.
- splatworks/writesplat/LICENSE.md and splatworks/writesplat/COPYING —
  GPL-3.0-only license text for WriteSplatTM / SplatWorksTM writing code.

Deployment
----------
WriteSplatTM is built to run from /splatworks/writesplat/.

1. Upload the included splatworks/ folder to your static host.
2. Open https://your-domain.example/splatworks/writesplat/.
3. To rebuild from source:
     cd splatworks/writesplat
     npm install
     npm run build

Licensing boundary
------------------
WriteSplatTM is packaged separately from DrawSplatTM so writing app updates can
ship without requiring a full DrawSplatTM whiteboard/tools/widgets/games
download. WriteSplatTM is GPL-3.0-only as part of the SplatWorksTM app family.
DrawSplatTM whiteboard code, tools, widgets, games, backends, and compliance
features remain under the repository-level DrawSplatTM license unless a file or
subdirectory says otherwise.
EOF

copy_tree splatworks/listsplat "$LIST_ROOT/splatworks/listsplat" "${SPLATWORKS_EXCLUDES[@]}"

cat > "$LIST_ROOT/SPLATWORKS-LISTSPLAT-README.txt" <<EOF
SplatWorksTM ListSplatTM Self-Hosted Bundle
==========================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- splatworks/listsplat/ — the ListSplatTM browser classroom database app,
  including source, tests, docs, package metadata, and icon assets.
- splatworks/listsplat/docs/plan.md — the ListSplatTM feature plan and release
  scope.
- splatworks/listsplat/LICENSE.md and splatworks/listsplat/COPYING —
  GPL-3.0-only license text for ListSplatTM / SplatWorksTM database code.

Deployment
----------
ListSplatTM is built to run from /splatworks/listsplat/.

1. Upload the included splatworks/ folder to your static host.
2. Open https://your-domain.example/splatworks/listsplat/.
3. To rebuild from source:
     cd splatworks/listsplat
     npm install
     npm run build

Licensing boundary
------------------
ListSplatTM is packaged separately from DrawSplatTM so database app updates can
ship without requiring a full DrawSplatTM whiteboard/tools/widgets/games
download. ListSplatTM is GPL-3.0-only as part of the SplatWorksTM app family.
DrawSplatTM whiteboard code, tools, widgets, games, backends, and compliance
features remain under the repository-level DrawSplatTM license unless a file or
subdirectory says otherwise.
EOF

for app_dir in gridsplat showsplat writesplat listsplat; do
  copy_tree "splatworks/$app_dir" "$SPLATWORKS_SUITE_ROOT/splatworks/$app_dir" "${SPLATWORKS_EXCLUDES[@]}"
done
copy_tree assets "$SPLATWORKS_SUITE_ROOT/assets" "${MODULE_EXCLUDES[@]}"
copy_tree vendor "$SPLATWORKS_SUITE_ROOT/vendor" "${MODULE_EXCLUDES[@]}"
copy_file pages/splatworks.html "$SPLATWORKS_SUITE_ROOT/pages/splatworks.html"
copy_file pages/gridsplat.html "$SPLATWORKS_SUITE_ROOT/pages/gridsplat.html"
copy_file pages/showsplat.html "$SPLATWORKS_SUITE_ROOT/pages/showsplat.html"
copy_file pages/writesplat.html "$SPLATWORKS_SUITE_ROOT/pages/writesplat.html"
copy_file pages/listsplat.html "$SPLATWORKS_SUITE_ROOT/pages/listsplat.html"
copy_file pages/download.html "$SPLATWORKS_SUITE_ROOT/pages/download.html"

cat > "$SPLATWORKS_SUITE_ROOT/SPLATWORKS-SUITE-README.txt" <<EOF
SplatWorksTM Suite Self-Hosted Bundle
====================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- splatworks/gridsplat/ — spreadsheet app.
- splatworks/showsplat/ — presentation and WebDeck authoring app.
- splatworks/writesplat/ — writing and classroom publishing app.
- splatworks/listsplat/ — classroom database app.
- pages/splatworks.html and app detail pages for a suite launcher.
- assets/ shared by the public launcher pages.
- vendor/ shared by ShowSplatTM import/export workflows.

Deployment
----------
This module is designed to be dropped into the same folder as a DrawSplatTM
self-host install, or hosted by itself as a static browser-based office suite.

1. Upload the included folders to your static host.
2. Open https://your-domain.example/pages/splatworks.html for the suite hub.
3. App launch paths:
     /splatworks/gridsplat/
     /splatworks/showsplat/
     /splatworks/writesplat/
     /splatworks/listsplat/

Modular install
---------------
If you already installed DrawSplatTM, unzip this package into the same web root.
It uses the same /splatworks/, /pages/, and /assets/ paths, so the suite links
connect without a server process or installer.

License
-------
SplatWorksTM apps are GPL-3.0-only unless a file or subdirectory says otherwise.
EOF

copy_file splatworks_hero_image.png "$SPLATWORKS_SUITE_ROOT/splatworks_hero_image.png"

copy_tree assets "$TOOLS_ROOT/assets" "${MODULE_EXCLUDES[@]}"
copy_tree vendor "$TOOLS_ROOT/vendor" "${MODULE_EXCLUDES[@]}"
copy_file pages/tools.html "$TOOLS_ROOT/pages/tools.html"
mkdir -p "$TOOLS_ROOT/solutions"
for solution in "${TOOLS_SOLUTIONS[@]}"; do
  copy_tree "solutions/$solution" "$TOOLS_ROOT/solutions/$solution" "${MODULE_EXCLUDES[@]}"
done

cat > "$TOOLS_ROOT/DRAWSPLAT-TOOLS-README.txt" <<EOF
DrawSplatTM Tools Self-Hosted Module
===================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- pages/tools.html — module launcher.
- solutions/ — standalone classroom creation tools.
- assets/ — shared CSS, branding, icons, and client helpers used by the launcher
  and tool pages.
- vendor/ — bundled third-party browser libraries used by selected tools.

Deployment
----------
Unzip this module into the same web root as DrawSplatTM, or host it by itself as
static files. Open /pages/tools.html and use the Tools section.

This module intentionally keeps the same /solutions/ paths used by the full
DrawSplatTM download so links connect when modules are placed together.
EOF

copy_tree assets "$WIDGETS_ROOT/assets" "${MODULE_EXCLUDES[@]}"
copy_tree vendor "$WIDGETS_ROOT/vendor" "${MODULE_EXCLUDES[@]}"
copy_file pages/tools.html "$WIDGETS_ROOT/pages/tools.html"
mkdir -p "$WIDGETS_ROOT/solutions"
for solution in "${WIDGET_SOLUTIONS[@]}"; do
  copy_tree "solutions/$solution" "$WIDGETS_ROOT/solutions/$solution" "${MODULE_EXCLUDES[@]}"
done

cat > "$WIDGETS_ROOT/DRAWSPLAT-WIDGETS-README.txt" <<EOF
DrawSplatTM Widgets Self-Hosted Module
=====================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- pages/tools.html — launcher page; use the Widgets section.
- solutions/ — quick standalone classroom utilities.
- assets/ — shared CSS, branding, icons, and client helpers used by the launcher
  and widget pages.
- vendor/ — bundled third-party browser libraries used by selected widgets.

Deployment
----------
Unzip this module into the same web root as DrawSplatTM, or host it by itself as
static files. Open /pages/tools.html#widgets.

This module intentionally keeps the same /solutions/ paths used by the full
DrawSplatTM download so links connect when modules are placed together.
EOF

copy_tree assets "$GAMES_ROOT/assets" "${MODULE_EXCLUDES[@]}"
copy_tree games "$GAMES_ROOT/games" "${MODULE_EXCLUDES[@]}"
copy_tree vendor "$GAMES_ROOT/vendor" "${MODULE_EXCLUDES[@]}"
copy_tree solutions/dotsboxes "$GAMES_ROOT/solutions/dotsboxes" "${MODULE_EXCLUDES[@]}"

cat > "$GAMES_ROOT/DRAWSPLAT-GAMES-README.txt" <<EOF
DrawSplatTM Games Self-Hosted Module
===================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- games/ — standalone classroom games and the games index.
- assets/ — shared branding, styles, icons, and media used by game pages.

Deployment
----------
Unzip this module into the same web root as DrawSplatTM, or host it by itself as
static files. Open /games/.

This module intentionally keeps the same /games/ paths used by the full
DrawSplatTM download so links connect when modules are placed together.
EOF

copy_tree solutions/audiosplat "$AUDIOSPLAT_ROOT/solutions/audiosplat" "${MODULE_EXCLUDES[@]}"
copy_tree solutions/shared/subtitles "$AUDIOSPLAT_ROOT/solutions/shared/subtitles" "${MODULE_EXCLUDES[@]}"

cat > "$AUDIOSPLAT_ROOT/AUDIOSPLAT-SELFHOST-README.txt" <<EOF
AudioSplat Self-Hosted Solution
===============================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- solutions/audiosplat/ — the built static AudioSplat multitrack recorder and
  editor plus source, tests, documentation, package metadata, and license.

Deployment
----------
AudioSplat must be served over HTTPS (or localhost during development) for
microphone, screen/tab audio, service-worker, and clipboard features.

1. Upload the included solutions/ folder to your static host.
2. Open https://your-domain.example/solutions/audiosplat/.
3. To rebuild from source:
     cd solutions/audiosplat
     npm install
     npm run build

Google Drive configuration
--------------------------
Recording, editing, local autosave, project download, and audio export work
without an account. The included production build authorizes Google Drive only
from https://drawsplat.org. A different self-host domain must create its own
Google OAuth Web client, authorize that HTTPS origin, enable Google Drive API,
add the non-sensitive drive.file scope, replace GOOGLE_CLIENT_ID in
solutions/audiosplat/src/main.ts, and rebuild the app.

License
-------
AudioSplat is AGPL-3.0-or-later. See solutions/audiosplat/LICENSE.md.
EOF

copy_tree solutions/videosplat "$VIDEOSPLAT_ROOT/solutions/videosplat" "${MODULE_EXCLUDES[@]}"
copy_tree solutions/shared/subtitles "$VIDEOSPLAT_ROOT/solutions/shared/subtitles" "${MODULE_EXCLUDES[@]}"

cat > "$VIDEOSPLAT_ROOT/VIDEOSPLAT-SELFHOST-README.txt" <<EOF
VideoSplat Self-Hosted Solution
===============================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- solutions/videosplat/ — the built static VideoSplat editor plus source,
  tests, documentation, package metadata, and AGPL license notice.

Deployment
----------
VideoSplat should be served over HTTPS (or localhost during development) for
service-worker, browser-storage, worker, and high-performance media features.

1. Upload the included solutions/ folder to your static host.
2. Open https://your-domain.example/solutions/videosplat/.
3. To rebuild from source:
     cd solutions/videosplat
     npm install
     npm run build

Privacy boundary
----------------
Core project storage, media analysis, editing, anonymization, and export run in
the browser. VideoSplat includes no required account, analytics, advertising,
tracking, backend, or remote media processing.

License
-------
VideoSplat is AGPL-3.0-or-later. See solutions/videosplat/LICENSE.md.
EOF

copy_tree solutions/mediasplat "$MEDIASPLAT_ROOT/solutions/mediasplat" "${MODULE_EXCLUDES[@]}"
copy_tree solutions/shared/subtitles "$MEDIASPLAT_ROOT/solutions/shared/subtitles" "${MODULE_EXCLUDES[@]}"

cat > "$MEDIASPLAT_ROOT/MEDIASPLAT-SELFHOST-README.txt" <<EOF
MediaSplat Self-Hosted Solution
===============================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

What's in this zip
------------------
- solutions/mediasplat/ — the built static MediaSplat browser media toolkit
  plus source, tests, documentation, package metadata, and bundled FFmpeg runtime.

Deployment
----------
MediaSplat should be served over HTTPS (or localhost during development) for
service-worker, browser-storage, worker, and high-performance media features.

1. Upload the included solutions/ folder to your static host.
2. Open https://your-domain.example/solutions/mediasplat/.
3. To rebuild from source:
     cd solutions/mediasplat
     npm install
     npm run build

Privacy boundary
----------------
Media inspection, conversion, trimming, splitting, and archive creation run in
the browser. MediaSplat includes no required account, analytics, advertising,
tracking, backend, or remote media processing.

License
-------
See solutions/mediasplat/README.md and docs/credits.md for project and bundled
dependency licensing details.
EOF

copy_tree solutions/pdfsplat "$PDFSPLAT_ROOT/solutions/pdfsplat" "${MODULE_EXCLUDES[@]}"
unzip -q solutions/CipherSplat/downloads/CipherSplat-offline.zip -d "$PDFSPLAT_ROOT/solutions"
copy_file scripts/build-pdfsplat.mjs "$PDFSPLAT_ROOT/scripts/build-pdfsplat.mjs"
for pdf_vendor in pdf.min.js pdf.worker.min.js jszip.min.js; do
  copy_file "vendor/$pdf_vendor" "$PDFSPLAT_ROOT/vendor/$pdf_vendor"
done
copy_file assets/js/pdf-language-loader.js "$PDFSPLAT_ROOT/assets/js/pdf-language-loader.js"
copy_file LICENSE "$PDFSPLAT_ROOT/LICENSE"
copy_file NOTICE.md "$PDFSPLAT_ROOT/NOTICE.md"
copy_file docs/pdfsplat-save-as.md "$PDFSPLAT_ROOT/docs/pdfsplat-save-as.md"
cat > "$PDFSPLAT_ROOT/PDFSPLAT-SELFHOST-README.txt" <<EOF
PDFSplat Self-Hosted Solution
===========================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Source:  $SHORT_SHA

Includes the PDF editor, touch signing, scan/capture tools, local encryption,
source, tests, and bundled PDF.js, PDF-Lib, JSZip, and Argon2 dependencies.
The shared app launcher, menus, and language controls are included.

Upload all included folders together, keeping their names unchanged.
Open https://your-domain.example/solutions/pdfsplat/ on an HTTPS static host
(or localhost during development). No build step or backend is required.
PDFs, edits, and passwords are processed locally in the browser.

CipherSplat is included for the linked local password generator.
Other Apps-menu destinations require those apps to be installed separately.
See solutions/pdfsplat/README.md, LICENSE, and NOTICE.md for workflows,
limitations, project licensing, and third-party notices.
EOF

# Individual apps use shared menus, localization, and launcher modules.
# Keep these runtime dependencies without copying the full whiteboard asset tree.
for media_root in "$AUDIOSPLAT_ROOT" "$VIDEOSPLAT_ROOT" "$MEDIASPLAT_ROOT" "$PDFSPLAT_ROOT" "$GRID_ROOT" "$SHOW_ROOT" "$WRITE_ROOT" "$LIST_ROOT"; do
  copy_tree assets/icons "$media_root/assets/icons" "${MODULE_EXCLUDES[@]}"
  copy_tree assets/favicons "$media_root/assets/favicons" "${MODULE_EXCLUDES[@]}"
  for css_file in action-cards.css app-language.css tool-launcher.css launcher-trigger.css; do
    copy_file "assets/css/$css_file" "$media_root/assets/css/$css_file"
  done
  for js_file in action-cards.js app-language.js widget-i18n.js tool-launcher-loader.js tool-launcher.js tool-registry.js tool-search.js tool-preferences.js; do
    copy_file "assets/js/$js_file" "$media_root/assets/js/$js_file"
  done
  copy_file data/drawsplat-tools.json "$media_root/data/drawsplat-tools.json"
done

# Public module pages also reference the root manifest and launcher registry.
for module_root in "$SPLATWORKS_SUITE_ROOT" "$TOOLS_ROOT" "$WIDGETS_ROOT" "$GAMES_ROOT"; do
  copy_file site.webmanifest "$module_root/site.webmanifest"
  copy_file data/drawsplat-tools.json "$module_root/data/drawsplat-tools.json"
done

python3 scripts/add-offline-launcher.py "${DRAWSPLAT_ROOT}" DrawSplat "index.html"
python3 scripts/add-offline-launcher.py "${GRID_ROOT}" GridSplat "splatworks/gridsplat/"
python3 scripts/add-offline-launcher.py "${SHOW_ROOT}" ShowSplat "splatworks/showsplat/"
python3 scripts/add-offline-launcher.py "${WRITE_ROOT}" WriteSplat "splatworks/writesplat/"
python3 scripts/add-offline-launcher.py "${LIST_ROOT}" ListSplat "splatworks/listsplat/"
python3 scripts/add-offline-launcher.py "${SPLATWORKS_SUITE_ROOT}" SplatWorks "pages/splatworks.html"
python3 scripts/add-offline-launcher.py "${TOOLS_ROOT}" Tools "pages/tools.html"
python3 scripts/add-offline-launcher.py "${WIDGETS_ROOT}" Widgets "pages/tools.html#widgets"
python3 scripts/add-offline-launcher.py "${GAMES_ROOT}" Games "games/"
python3 scripts/add-offline-launcher.py "${AUDIOSPLAT_ROOT}" AudioSplat "solutions/audiosplat/"
python3 scripts/add-offline-launcher.py "${VIDEOSPLAT_ROOT}" VideoSplat "solutions/videosplat/"
python3 scripts/add-offline-launcher.py "${MEDIASPLAT_ROOT}" MediaSplat "solutions/mediasplat/"
python3 scripts/add-offline-launcher.py "${PDFSPLAT_ROOT}" PDFSplat "solutions/pdfsplat/"

# Catalog scripts are tailored to each package, so refresh dependent integrity files.
for module_root in "$DRAWSPLAT_ROOT" "$TOOLS_ROOT"; do
  bash scripts/generate-ciphersplat-integrity.sh "$module_root/solutions/CipherSplat"
done

cd "$STAGE_DIR"
if command -v zip >/dev/null 2>&1; then
  zip -rq "$REPO_ROOT/$DRAWSPLAT_OUT_PATH" "drawsplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$GRID_OUT_PATH" "splatworks-gridsplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$SHOW_OUT_PATH" "splatworks-showsplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$WRITE_OUT_PATH" "splatworks-writesplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$LIST_OUT_PATH" "splatworks-listsplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$SPLATWORKS_SUITE_OUT_PATH" "splatworks-suite-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$TOOLS_OUT_PATH" "drawsplat-tools-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$WIDGETS_OUT_PATH" "drawsplat-widgets-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$GAMES_OUT_PATH" "drawsplat-games-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$AUDIOSPLAT_OUT_PATH" "audiosplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$VIDEOSPLAT_OUT_PATH" "videosplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$MEDIASPLAT_OUT_PATH" "mediasplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$PDFSPLAT_OUT_PATH" "pdfsplat-selfhost-$VERSION_LABEL"
else
  echo "zip not found; please install zip or run this on Linux/macOS" >&2
  exit 1
fi
cd "$REPO_ROOT"

DRAWSPLAT_SIZE_HUMAN="$(du -h "$DRAWSPLAT_OUT_PATH" | cut -f1)"
DRAWSPLAT_SHA="$(sha256sum "$DRAWSPLAT_OUT_PATH" | cut -d' ' -f1)"
GRID_SIZE_HUMAN="$(du -h "$GRID_OUT_PATH" | cut -f1)"
GRID_SHA="$(sha256sum "$GRID_OUT_PATH" | cut -d' ' -f1)"
SHOW_SIZE_HUMAN="$(du -h "$SHOW_OUT_PATH" | cut -f1)"
SHOW_SHA="$(sha256sum "$SHOW_OUT_PATH" | cut -d' ' -f1)"
WRITE_SIZE_HUMAN="$(du -h "$WRITE_OUT_PATH" | cut -f1)"
WRITE_SHA="$(sha256sum "$WRITE_OUT_PATH" | cut -d' ' -f1)"
LIST_SIZE_HUMAN="$(du -h "$LIST_OUT_PATH" | cut -f1)"
LIST_SHA="$(sha256sum "$LIST_OUT_PATH" | cut -d' ' -f1)"
SPLATWORKS_SUITE_SIZE_HUMAN="$(du -h "$SPLATWORKS_SUITE_OUT_PATH" | cut -f1)"
SPLATWORKS_SUITE_SHA="$(sha256sum "$SPLATWORKS_SUITE_OUT_PATH" | cut -d' ' -f1)"
TOOLS_SIZE_HUMAN="$(du -h "$TOOLS_OUT_PATH" | cut -f1)"
TOOLS_SHA="$(sha256sum "$TOOLS_OUT_PATH" | cut -d' ' -f1)"
WIDGETS_SIZE_HUMAN="$(du -h "$WIDGETS_OUT_PATH" | cut -f1)"
WIDGETS_SHA="$(sha256sum "$WIDGETS_OUT_PATH" | cut -d' ' -f1)"
GAMES_SIZE_HUMAN="$(du -h "$GAMES_OUT_PATH" | cut -f1)"
GAMES_SHA="$(sha256sum "$GAMES_OUT_PATH" | cut -d' ' -f1)"
AUDIOSPLAT_SIZE_HUMAN="$(du -h "$AUDIOSPLAT_OUT_PATH" | cut -f1)"
AUDIOSPLAT_SHA="$(sha256sum "$AUDIOSPLAT_OUT_PATH" | cut -d' ' -f1)"
VIDEOSPLAT_SIZE_HUMAN="$(du -h "$VIDEOSPLAT_OUT_PATH" | cut -f1)"
VIDEOSPLAT_SHA="$(sha256sum "$VIDEOSPLAT_OUT_PATH" | cut -d' ' -f1)"
MEDIASPLAT_SIZE_HUMAN="$(du -h "$MEDIASPLAT_OUT_PATH" | cut -f1)"
MEDIASPLAT_SHA="$(sha256sum "$MEDIASPLAT_OUT_PATH" | cut -d' ' -f1)"
PDFSPLAT_SIZE_HUMAN="$(du -h "$PDFSPLAT_OUT_PATH" | cut -f1)"
PDFSPLAT_SHA="$(sha256sum "$PDFSPLAT_OUT_PATH" | cut -d' ' -f1)"

sha256sum \
  "$DRAWSPLAT_OUT_PATH" \
  "$GRID_OUT_PATH" \
  "$SHOW_OUT_PATH" \
  "$WRITE_OUT_PATH" \
  "$LIST_OUT_PATH" \
  "$SPLATWORKS_SUITE_OUT_PATH" \
  "$TOOLS_OUT_PATH" \
  "$WIDGETS_OUT_PATH" \
  "$GAMES_OUT_PATH" \
  "$AUDIOSPLAT_OUT_PATH" \
  "$VIDEOSPLAT_OUT_PATH" \
  "$MEDIASPLAT_OUT_PATH" \
  "$PDFSPLAT_OUT_PATH" > "$CHECKSUM_OUT_PATH"

echo ""
echo "Built bundles:"
echo "  $DRAWSPLAT_OUT_PATH ($DRAWSPLAT_SIZE_HUMAN)"
echo "  sha256: $DRAWSPLAT_SHA"
echo ""
echo "  $GRID_OUT_PATH ($GRID_SIZE_HUMAN)"
echo "  sha256: $GRID_SHA"
echo ""
echo "  $SHOW_OUT_PATH ($SHOW_SIZE_HUMAN)"
echo "  sha256: $SHOW_SHA"
echo ""
echo "  $WRITE_OUT_PATH ($WRITE_SIZE_HUMAN)"
echo "  sha256: $WRITE_SHA"
echo ""
echo "  $LIST_OUT_PATH ($LIST_SIZE_HUMAN)"
echo "  sha256: $LIST_SHA"
echo ""
echo "  $SPLATWORKS_SUITE_OUT_PATH ($SPLATWORKS_SUITE_SIZE_HUMAN)"
echo "  sha256: $SPLATWORKS_SUITE_SHA"
echo ""
echo "  $TOOLS_OUT_PATH ($TOOLS_SIZE_HUMAN)"
echo "  sha256: $TOOLS_SHA"
echo ""
echo "  $WIDGETS_OUT_PATH ($WIDGETS_SIZE_HUMAN)"
echo "  sha256: $WIDGETS_SHA"
echo ""
echo "  $GAMES_OUT_PATH ($GAMES_SIZE_HUMAN)"
echo "  sha256: $GAMES_SHA"
echo ""
echo "  $AUDIOSPLAT_OUT_PATH ($AUDIOSPLAT_SIZE_HUMAN)"
echo "  sha256: $AUDIOSPLAT_SHA"
echo ""
echo "  $VIDEOSPLAT_OUT_PATH ($VIDEOSPLAT_SIZE_HUMAN)"
echo "  sha256: $VIDEOSPLAT_SHA"
echo ""
echo "  $MEDIASPLAT_OUT_PATH ($MEDIASPLAT_SIZE_HUMAN)"
echo "  sha256: $MEDIASPLAT_SHA"
echo ""
echo "  $PDFSPLAT_OUT_PATH ($PDFSPLAT_SIZE_HUMAN)"
echo "  sha256: $PDFSPLAT_SHA"
echo ""
echo "  $CHECKSUM_OUT_PATH"
echo ""

rm -rf "$STAGE_DIR"
