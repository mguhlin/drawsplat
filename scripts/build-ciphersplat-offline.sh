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

"$ROOT_DIR/scripts/generate-ciphersplat-integrity.sh"

mkdir -p "$STAGING_DIR/CipherSplat/assets" "$OUTPUT_DIR"
cp "$SOURCE_DIR/index.html" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/styles.css" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/security.css" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/mobile.css" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/app.js" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/argon2-worker.js" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/OFFLINE-README.txt" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/assets/ciphersplat-hero.png" "$STAGING_DIR/CipherSplat/assets/"
cp "$SOURCE_DIR/assets/drawsplat-logo.png" "$STAGING_DIR/CipherSplat/assets/"
cp "$SOURCE_DIR/assets/tools.svg" "$STAGING_DIR/CipherSplat/assets/"
mkdir -p "$STAGING_DIR/CipherSplat/vendor/openpgp"
cp "$SOURCE_DIR/vendor/openpgp/openpgp.min.js" "$STAGING_DIR/CipherSplat/vendor/openpgp/"
cp "$SOURCE_DIR/vendor/openpgp/LICENSE" "$STAGING_DIR/CipherSplat/vendor/openpgp/"
cp "$SOURCE_DIR/vendor/openpgp/package.json" "$STAGING_DIR/CipherSplat/vendor/openpgp/"
mkdir -p "$STAGING_DIR/CipherSplat/vendor/hash-wasm"
cp "$SOURCE_DIR/vendor/hash-wasm/argon2.umd.min.js" "$STAGING_DIR/CipherSplat/vendor/hash-wasm/"
cp "$SOURCE_DIR/vendor/hash-wasm/LICENSE" "$STAGING_DIR/CipherSplat/vendor/hash-wasm/"
cp "$SOURCE_DIR/vendor/hash-wasm/package.json" "$STAGING_DIR/CipherSplat/vendor/hash-wasm/"

# file:// scripts cannot use browser SRI because local files have an opaque
# origin. The offline edition verifies the same vendored file via its local
# integrity.json instead, generated after this intentional HTML transform.
sed -i 's/ integrity="sha384-[^"]*"//' "$STAGING_DIR/CipherSplat/index.html"
"$ROOT_DIR/scripts/generate-ciphersplat-integrity.sh" "$STAGING_DIR/CipherSplat" "$STAGING_DIR/CipherSplat/integrity.json"

# Normalize timestamps and metadata so identical source produces identical ZIP bytes.
find "$STAGING_DIR/CipherSplat" -exec touch -d '@946684800' {} +

rm -f "$OUTPUT_FILE"
(
  cd "$STAGING_DIR"
  find CipherSplat -print | LC_ALL=C sort | zip -X -q "$OUTPUT_FILE" -@
)

echo "Built $OUTPUT_FILE"
