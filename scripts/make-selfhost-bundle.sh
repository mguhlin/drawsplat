#!/usr/bin/env bash
#
# DrawSplatTM self-hosting bundle builder.
#
# Produces dist/drawsplat-selfhost-YYYYMMDD-<shortsha>.zip containing:
#   - everything a school / district needs to deploy DrawSplatTM
#   - excluding: .git, node_modules, .env, image-cache, log files, OS noise
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
OUT_NAME="drawsplat-selfhost-$VERSION_LABEL.zip"
OUT_PATH="$OUT_DIR/$OUT_NAME"
STAGE_DIR="$(mktemp -d)"
STAGE_ROOT="$STAGE_DIR/drawsplat-selfhost-$VERSION_LABEL"

mkdir -p "$OUT_DIR" "$STAGE_ROOT"

EXCLUDES=(
  ".git"
  ".github"
  "node_modules"
  "dist"
  "tmp"
  "build"
  "coverage"
  ".DS_Store"
  ".env"
  ".env.local"
  "*.log"
  "*.swp"
  "drawsplat-selfhost-*.zip"
)

RSYNC_ARGS=(-a --delete)
for pattern in "${EXCLUDES[@]}"; do
  RSYNC_ARGS+=(--exclude "$pattern")
done

if command -v rsync >/dev/null 2>&1; then
  rsync "${RSYNC_ARGS[@]}" ./ "$STAGE_ROOT/"
else
  echo "rsync not found; falling back to cp + manual prune (slower)" >&2
  cp -r ./ "$STAGE_ROOT"
  for pattern in "${EXCLUDES[@]}"; do
    find "$STAGE_ROOT" -name "$pattern" -prune -exec rm -rf {} + 2>/dev/null || true
  done
fi

cat > "$STAGE_ROOT/SELFHOST-README.txt" <<EOF
DrawSplatTM Self-Hosted Bundle
==============================

Version: $VERSION_LABEL
Built:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")

What's in this zip
------------------
- The complete static site (index.html, app/, pages/, legal/, guides/, parents/,
  community/, languages/, admin/, solutions/) ready to drop into any static host.
- apps-script/Code.gs  — the Google Apps Script backend (single-file).
- server/mysql-backend/ — Node.js + MySQL backend with Docker compose.
- compliance.config.json — default safety / retention / privacy configuration.
- docs/, guides/ — operator + setup documentation.
- COMPLIANCE-ROADMAP.md, LICENSE, README.md — project context.

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

cd "$STAGE_DIR"
if command -v zip >/dev/null 2>&1; then
  zip -rq "$REPO_ROOT/$OUT_PATH" "drawsplat-selfhost-$VERSION_LABEL"
else
  echo "zip not found; please install zip or run this on Linux/macOS" >&2
  exit 1
fi
cd "$REPO_ROOT"

SIZE_HUMAN="$(du -h "$OUT_PATH" | cut -f1)"
SHA="$(sha256sum "$OUT_PATH" | cut -d' ' -f1)"

echo ""
echo "Built bundle:"
echo "  $OUT_PATH ($SIZE_HUMAN)"
echo "  sha256: $SHA"
echo ""

rm -rf "$STAGE_DIR"
