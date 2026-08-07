#!/usr/bin/env bash
# Rebuild the vendored Argon2 (hash-wasm) UMD bundle from source at a pinned
# version, including recompiling the WebAssembly from C rather than shipping the
# npm-published prebuilt blob.
#
# hash-wasm compiles its C sources to wasm with clang + wasi-sdk and optimises
# with Binaryen's wasm-opt. That toolchain is provided by the Dockerfile in the
# hash-wasm repository, so this script drives the build through Docker to keep it
# reproducible without polluting the host.
#
# Requires: git, docker, and network access to github.com + the npm registry.
# (No emscripten/clang needed on the host — it lives inside the image.)
set -euo pipefail

VERSION="${HASH_WASM_VERSION:-4.12.0}"
REPO="${HASH_WASM_REPO:-https://github.com/Daninet/hash-wasm.git}"
OUT_DIR="${1:-$(pwd)/hash-wasm-from-source}"

if ! command -v docker >/dev/null 2>&1; then
  echo "!! docker is required to compile the WebAssembly from source." >&2
  echo "   Install Docker, or run this on the F-Droid buildserver, then retry." >&2
  exit 2
fi

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

echo "==> Cloning hash-wasm v$VERSION"
git clone --depth 1 --branch "v$VERSION" "$REPO" "$WORK/src"
cd "$WORK/src"

# The repo pins its C->wasm toolchain in its own Dockerfile. Build that image and
# run the project's own compile + bundle steps inside it, so the wasm is produced
# from source rather than reused from git.
echo "==> Building hash-wasm toolchain image"
docker build -t hashwasm-build:"$VERSION" .

echo "==> Recompiling WebAssembly from C and bundling"
docker run --rm -v "$PWD":/app -w /app hashwasm-build:"$VERSION" bash -lc '
  set -euo pipefail
  npm ci
  # Regenerate the wasm binaries from C, then build the JS bundles.
  npm run compile
  npm run build
'

mkdir -p "$OUT_DIR"
if [ -f dist/argon2.umd.min.js ]; then
  cp dist/argon2.umd.min.js "$OUT_DIR/argon2.umd.min.js"
else
  echo "!! dist/argon2.umd.min.js not found. dist/ contents:" >&2
  ls -la dist >&2
  exit 1
fi

echo "==> Built hash-wasm Argon2 v$VERSION"
sha256sum "$OUT_DIR/argon2.umd.min.js"
echo "Output: $OUT_DIR/argon2.umd.min.js"
echo
echo "NOTE: exact npm script names (compile/build) should be confirmed against"
echo "      this tag's package.json; hash-wasm has used both 'compile' and"
echo "      'build:wasm' historically. Adjust the docker run step if they differ."
