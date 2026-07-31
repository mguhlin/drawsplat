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
DRAWSPLAT_OUT_NAME="drawsplat-selfhost-$VERSION_LABEL.zip"
GRID_OUT_NAME="splatworks-gridsplat-selfhost-$VERSION_LABEL.zip"
SHOW_OUT_NAME="splatworks-showsplat-selfhost-$VERSION_LABEL.zip"
WRITE_OUT_NAME="splatworks-writesplat-selfhost-$VERSION_LABEL.zip"
LIST_OUT_NAME="splatworks-listsplat-selfhost-$VERSION_LABEL.zip"
SPLATWORKS_SUITE_OUT_NAME="splatworks-suite-selfhost-$VERSION_LABEL.zip"
TOOLS_OUT_NAME="drawsplat-tools-selfhost-$VERSION_LABEL.zip"
WIDGETS_OUT_NAME="drawsplat-widgets-selfhost-$VERSION_LABEL.zip"
GAMES_OUT_NAME="drawsplat-games-selfhost-$VERSION_LABEL.zip"
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
CHECKSUM_OUT_PATH="$OUT_DIR/$CHECKSUM_OUT_NAME"

mkdir -p "$OUT_DIR" "$DRAWSPLAT_ROOT" "$GRID_ROOT" "$SHOW_ROOT" "$WRITE_ROOT" "$LIST_ROOT" "$SPLATWORKS_SUITE_ROOT" "$TOOLS_ROOT" "$WIDGETS_ROOT" "$GAMES_ROOT"
rm -f "$DRAWSPLAT_OUT_PATH" "$GRID_OUT_PATH" "$SHOW_OUT_PATH" "$WRITE_OUT_PATH" "$LIST_OUT_PATH" "$SPLATWORKS_SUITE_OUT_PATH" "$TOOLS_OUT_PATH" "$WIDGETS_OUT_PATH" "$GAMES_OUT_PATH" "$CHECKSUM_OUT_PATH"

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
  ".DS_Store"
  ".env"
  ".env.local"
  "/package.json"
  "/package-lock.json"
  "splatworks"
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
     Open index.html in a browser, or upload the whole tree to a static host.

2. Google Apps Script (recommended for teachers and most districts):
     Follow guides/google-setup.html. Paste apps-script/Code.gs into a new
     Apps Script project bound to a Google Sheet, deploy as Web App.

3. Self-hosted MySQL (recommended for districts wanting local storage):
     cd server/mysql-backend
     cp .env.example .env
     # edit .env — change MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, DRAWSPLAT_PEPPER
     docker compose up -d
     curl http://localhost:8787/api/drawsplat/mysql/health
     Then point the static site at the MySQL backend via the in-app setup wizard.

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
  animated-gif
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
  rubric-builder
  splatimage-studio
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
  quiz-flashcard-studio
  step-splat
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

cat > "$GAMES_ROOT/DRAWSPLAT-GAMES-README.txt" <<EOF
DrawSplatTM Games Self-Hosted Module
===================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")

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

sha256sum \
  "$DRAWSPLAT_OUT_PATH" \
  "$GRID_OUT_PATH" \
  "$SHOW_OUT_PATH" \
  "$WRITE_OUT_PATH" \
  "$LIST_OUT_PATH" \
  "$SPLATWORKS_SUITE_OUT_PATH" \
  "$TOOLS_OUT_PATH" \
  "$WIDGETS_OUT_PATH" \
  "$GAMES_OUT_PATH" > "$CHECKSUM_OUT_PATH"

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
echo "  $CHECKSUM_OUT_PATH"
echo ""

rm -rf "$STAGE_DIR"
