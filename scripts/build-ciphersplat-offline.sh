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

python3 "$ROOT_DIR/scripts/pin-ciphersplat-assets.py"
"$ROOT_DIR/scripts/generate-ciphersplat-integrity.sh"

mkdir -p "$STAGING_DIR/CipherSplat/assets" "$OUTPUT_DIR"
# Bundle every local workspace/help module and its pinned engines.
for file in "$SOURCE_DIR"/*.{html,js,css,webmanifest} "$SOURCE_DIR"/{OFFLINE-README.txt,port-source.json}; do
  [ "$(basename "$file")" != "playwright.config.js" ] || continue
  [ ! -f "$file" ] || cp "$file" "$STAGING_DIR/CipherSplat/"
done
cp -r "$SOURCE_DIR/assets/." "$STAGING_DIR/CipherSplat/assets/"
cp -r "$SOURCE_DIR/vendor" "$STAGING_DIR/CipherSplat/"
cp "$ROOT_DIR/LICENSE" "$ROOT_DIR/NOTICE.md" "$STAGING_DIR/CipherSplat/"
cp "$SOURCE_DIR/README.md" "$STAGING_DIR/CipherSplat/"

# Keep all referenced language/menu assets inside the offline folder.
mkdir -p "$STAGING_DIR/CipherSplat/shared/assets/css" "$STAGING_DIR/CipherSplat/shared/assets/js"
for name in action-cards app-language; do
  cp "$ROOT_DIR/assets/css/$name.css" "$STAGING_DIR/CipherSplat/shared/assets/css/"
  cp "$ROOT_DIR/assets/js/$name.js" "$STAGING_DIR/CipherSplat/shared/assets/js/"
done
cp "$ROOT_DIR/assets/css/action-icons.css" "$STAGING_DIR/CipherSplat/shared/assets/css/"
mkdir -p "$STAGING_DIR/CipherSplat/shared/assets/icons"
cp -r "$ROOT_DIR/assets/icons/actions" "$STAGING_DIR/CipherSplat/shared/assets/icons/"
python3 - "$STAGING_DIR/CipherSplat" <<'PYCODE'
import sys,re
from pathlib import Path
for p in Path(sys.argv[1]).glob('*.html'):
 s=p.read_text()
 s=re.sub(r'<!-- splat-privacy:start -->.*?<!-- splat-privacy:end -->','',s,flags=re.S)
 s=re.sub(r' integrity="[^"]*"','',s)
 p.write_text(s.replace('../../assets/','./shared/assets/'))
PYCODE
python3 "$ROOT_DIR/scripts/add-offline-launcher.py" "$STAGING_DIR/CipherSplat" CipherSplat 'index.html?offline=1'

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
