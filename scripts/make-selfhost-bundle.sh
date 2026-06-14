#!/usr/bin/env bash
#
# DrawSplatTM / SplatWorksTM self-hosting bundle builder.
#
# Produces:
#   - dist/drawsplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/splatworks-gridsplat-selfhost-YYYYMMDD-<shortsha>.zip
#   - dist/splatworks-showsplat-selfhost-YYYYMMDD-<shortsha>.zip
#
# The DrawSplatTM bundle contains the whiteboard, tools, widgets, games,
# backends, and compliance docs. SplatWorksTM apps ship separately so a
# SplatWorksTM-only update does not force a full DrawSplatTM download refresh.
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
DRAWSPLAT_OUT_NAME="drawsplat-selfhost-$VERSION_LABEL.zip"
GRID_OUT_NAME="splatworks-gridsplat-selfhost-$VERSION_LABEL.zip"
SHOW_OUT_NAME="splatworks-showsplat-selfhost-$VERSION_LABEL.zip"
DRAWSPLAT_OUT_PATH="$OUT_DIR/$DRAWSPLAT_OUT_NAME"
GRID_OUT_PATH="$OUT_DIR/$GRID_OUT_NAME"
SHOW_OUT_PATH="$OUT_DIR/$SHOW_OUT_NAME"

mkdir -p "$OUT_DIR" "$DRAWSPLAT_ROOT" "$GRID_ROOT" "$SHOW_ROOT"
rm -f "$DRAWSPLAT_OUT_PATH" "$GRID_OUT_PATH" "$SHOW_OUT_PATH"

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
SplatWorksTM apps, including GridSplatTM and ShowSplatTM, are packaged
separately. Download splatworks-gridsplat-selfhost-$VERSION_LABEL.zip when you
want the spreadsheet app, and splatworks-showsplat-selfhost-$VERSION_LABEL.zip
when you want the presentation/WebDeck app. This keeps GPL-covered SplatWorks
app releases independent from DrawSplatTM whiteboard/tools/widgets/games
releases.

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
  ".env"
  ".env.local"
  "*.log"
  "*.swp"
)

if command -v rsync >/dev/null 2>&1; then
  GRID_RSYNC_ARGS=(-a --delete)
  for pattern in "${SPLATWORKS_EXCLUDES[@]}"; do
    GRID_RSYNC_ARGS+=(--exclude "$pattern")
  done
  mkdir -p "$GRID_ROOT/splatworks"
  rsync "${GRID_RSYNC_ARGS[@]}" splatworks/gridsplat/ "$GRID_ROOT/splatworks/gridsplat/"
else
  mkdir -p "$GRID_ROOT/splatworks"
  cp -R splatworks/gridsplat "$GRID_ROOT/splatworks/gridsplat"
  for pattern in "${SPLATWORKS_EXCLUDES[@]}"; do
    find "$GRID_ROOT/splatworks/gridsplat" -name "$pattern" -prune -exec rm -rf {} + 2>/dev/null || true
  done
fi

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

if command -v rsync >/dev/null 2>&1; then
  SHOW_RSYNC_ARGS=(-a --delete)
  for pattern in "${SPLATWORKS_EXCLUDES[@]}"; do
    SHOW_RSYNC_ARGS+=(--exclude "$pattern")
  done
  mkdir -p "$SHOW_ROOT/splatworks"
  rsync "${SHOW_RSYNC_ARGS[@]}" splatworks/showsplat/ "$SHOW_ROOT/splatworks/showsplat/"
else
  mkdir -p "$SHOW_ROOT/splatworks"
  cp -R splatworks/showsplat "$SHOW_ROOT/splatworks/showsplat"
  for pattern in "${SPLATWORKS_EXCLUDES[@]}"; do
    find "$SHOW_ROOT/splatworks/showsplat" -name "$pattern" -prune -exec rm -rf {} + 2>/dev/null || true
  done
fi

cat > "$SHOW_ROOT/SPLATWORKS-SHOWSPLAT-README.txt" <<EOF
SplatWorksTM ShowSplatTM Self-Hosted Bundle
==========================================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")

What's in this zip
------------------
- splatworks/showsplat/ — the ShowSplatTM static presentation and WebDeck authoring app.
- splatworks/showsplat/docs/plan.md — the ShowSplatTM feature plan and release scope.

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

cd "$STAGE_DIR"
if command -v zip >/dev/null 2>&1; then
  zip -rq "$REPO_ROOT/$DRAWSPLAT_OUT_PATH" "drawsplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$GRID_OUT_PATH" "splatworks-gridsplat-selfhost-$VERSION_LABEL"
  zip -rq "$REPO_ROOT/$SHOW_OUT_PATH" "splatworks-showsplat-selfhost-$VERSION_LABEL"
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

rm -rf "$STAGE_DIR"
