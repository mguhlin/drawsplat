#!/usr/bin/env bash
# Complete district source + built apps; preserves each component's license.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
command -v python3 >/dev/null || { printf 'Python 3 is required to build a release ZIP (not to install it).\n' >&2; exit 1; }
mkdir -p dist
version=$(git rev-parse --short HEAD)
file="dist/drawsplat-district-suite-$version.zip"
archive=$(mktemp)
trap 'rm -f "$archive"' EXIT
git archive --format=zip -o "$archive" HEAD
python3 scripts/package-district-suite.py "$archive" "$file"
printf 'Complete DrawSplat + SplatWorks suite: %s\nOpen start-here.html after extracting. Application files and launchers are inside drawsplat/.\n' "$file"
