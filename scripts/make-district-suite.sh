#!/usr/bin/env bash
# Complete district source + built apps; preserves each component's license.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
mkdir -p dist
version=$(git rev-parse --short HEAD)
file="dist/drawsplat-district-suite-$version.zip"
git archive --format=zip --prefix=drawsplat-district-suite/ -o "$file" HEAD
printf 'Complete DrawSplat + SplatWorks suite: %s\nOpen 00-START-HERE.html after extracting.\n' "$file"
