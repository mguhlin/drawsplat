#!/usr/bin/env bash
# Build the vendored OpenPGP.js bundle from source at a pinned version.
#
# F-Droid (and anyone who wants to avoid trusting a prebuilt blob) can run this
# to regenerate solutions/CipherSplat/vendor/openpgp/openpgp.min.js from the
# upstream source instead of shipping the npm-published minified file.
#
# Requires: git, node, npm, and network access to github.com + the npm registry.
set -euo pipefail

VERSION="${OPENPGP_VERSION:-6.3.1}"
REPO="${OPENPGP_REPO:-https://github.com/openpgpjs/openpgpjs.git}"
OUT_DIR="${1:-$(pwd)/openpgp-from-source}"

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

echo "==> Cloning OpenPGP.js v$VERSION"
git clone --depth 1 --branch "v$VERSION" "$REPO" "$WORK/src"

cd "$WORK/src"

# OpenPGP.js's dev dependencies need a reasonably modern npm (older npm's semver
# cannot parse some aliased versions). Use the local npm when it is new enough,
# otherwise pull npm@10 through npx.
NPM="npm"
if [ "$(npm -v | cut -d. -f1)" -lt 10 ]; then
  echo "==> Local npm $(npm -v) is too old; using npm@10 via npx"
  NPM="npx -y npm@10.8.2"
fi

# `npm ci` is unreliable across npm versions here, so use `install`, which
# honours the committed lockfileVersion-3 package-lock.json. OpenPGP's `prepare`
# script builds the bundle as part of install, so no separate build step is
# needed in the normal case.
echo "==> Installing dependencies + building via prepare"
$NPM install --no-audit --no-fund

if [ ! -f dist/openpgp.min.js ]; then
  echo "==> prepare did not emit the bundle; building explicitly"
  $NPM run build
fi

mkdir -p "$OUT_DIR"
# v6 emits several bundles into dist/; the browser UMD build is openpgp.min.js.
if [ -f dist/openpgp.min.js ]; then
  cp dist/openpgp.min.js "$OUT_DIR/openpgp.min.js"
else
  echo "!! dist/openpgp.min.js not found. dist/ contents:" >&2
  ls -la dist >&2
  exit 1
fi

# The bundle is byte-identical to upstream except for the build date stamped
# into the license banner. Normalise it to SOURCE_DATE_EPOCH (if set) so
# repeated builds are bit-for-bit reproducible.
if [ -n "${SOURCE_DATE_EPOCH:-}" ]; then
  d="$(date -u -d "@$SOURCE_DATE_EPOCH" +%Y-%m-%d 2>/dev/null || true)"
  if [ -n "$d" ]; then
    sed -i -E "s/(OpenPGP\.js v[0-9.]+ - )[0-9]{4}-[0-9]{2}-[0-9]{2}/\1$d/" "$OUT_DIR/openpgp.min.js"
    echo "==> Normalised banner date to $d"
  fi
fi

echo "==> Built OpenPGP.js v$VERSION"
sha256sum "$OUT_DIR/openpgp.min.js"
echo "Output: $OUT_DIR/openpgp.min.js"
