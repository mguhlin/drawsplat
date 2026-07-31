#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/solutions/CipherSplat"
OUTPUT_DIR="$SOURCE_DIR/downloads"
OUTPUT_FILE="$OUTPUT_DIR/CipherSplat-offline.zip"
STAGING_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

mkdir -p "$STAGING_DIR/CipherSplat/assets" "$OUTPUT_DIR"
cp "$SOURCE_DIR/index.html" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/styles.css" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/app.js" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/OFFLINE-README.txt" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/assets/ciphersplat-hero.png" "$STAGING_DIR/CipherSplat/assets/"
cp "$SOURCE_DIR/assets/drawsplat-logo.png" "$STAGING_DIR/CipherSplat/assets/"
cp "$SOURCE_DIR/assets/tools.svg" "$STAGING_DIR/CipherSplat/assets/"

rm -f "$OUTPUT_FILE"
(
  cd "$STAGING_DIR"
  zip -q -r "$OUTPUT_FILE" CipherSplat
)

echo "Built $OUTPUT_FILE"
