#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CIPHER_DIR="${1:-$ROOT_DIR/solutions/CipherSplat}"
OUTPUT_FILE="${2:-$CIPHER_DIR/integrity.json}"
FILES=(
  app.js
  argon2-worker.js
  index.html
  security.css
  styles.css
  mobile.css
  assets/ciphersplat-hero.png
  assets/drawsplat-logo.png
  assets/tools.svg
  vendor/openpgp/openpgp.min.js
  vendor/openpgp/LICENSE
  vendor/openpgp/package.json
  vendor/hash-wasm/argon2.umd.min.js
  vendor/hash-wasm/LICENSE
  vendor/hash-wasm/package.json
)

{
  printf '{\n  "schema": "drawsplat-ciphersplat-integrity-v1",\n'
  printf '  "application": "CipherSplat",\n'
  printf '  "applicationVersion": "1.0.0",\n'
  printf '  "openpgpVersion": "6.3.1",\n'
  printf '  "argon2Version": "hash-wasm 4.12.0",\n'
  printf '  "hashAlgorithm": "SHA-256",\n'
  printf '  "files": {\n'
  for index in "${!FILES[@]}"; do
    file="${FILES[$index]}"
    hash="$(sha256sum "$CIPHER_DIR/$file" | cut -d ' ' -f 1)"
    comma=,
    if (( index == ${#FILES[@]} - 1 )); then comma=; fi
    printf '    "%s": "%s"%s\n' "$file" "$hash" "$comma"
  done
  printf '  }\n}\n'
} > "$OUTPUT_FILE"

echo "Generated $OUTPUT_FILE"
