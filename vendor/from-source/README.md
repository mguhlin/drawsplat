# Building the vendored crypto dependencies from source

CipherSplat ships two third-party cryptography bundles as vendored files:

| File | Library | Version | License |
|---|---|---|---|
| `solutions/CipherSplat/vendor/openpgp/openpgp.min.js` | [OpenPGP.js](https://github.com/openpgpjs/openpgpjs) | 6.3.1 | LGPL-3.0+ |
| `solutions/CipherSplat/vendor/hash-wasm/argon2.umd.min.js` | [hash-wasm](https://github.com/Daninet/hash-wasm) Argon2 | 4.12.0 | MIT |

Both are the upstream, npm-published minified builds. That is fine for the
website, but **F-Droid** prefers artifacts built from source in its pipeline
rather than committed prebuilt blobs (the hash-wasm file in particular embeds a
compiled WebAssembly binary). These scripts regenerate the bundles from the
pinned upstream sources so the Android app can be built without trusting the
prebuilt files.

## Scripts

- `build-openpgp.sh [OUT_DIR]` — clones OpenPGP.js at `v6.3.1`, installs its
  dependencies, runs its build, and copies `dist/openpgp.min.js` to `OUT_DIR`.
  Needs `git`, `node`, `npm`, and network. No special toolchain.

- `build-hash-wasm.sh [OUT_DIR]` — clones hash-wasm at `v4.12.0` and rebuilds
  the Argon2 **WebAssembly from C** using the toolchain pinned in hash-wasm's own
  Dockerfile (clang + wasi-sdk + Binaryen), then copies
  `dist/argon2.umd.min.js` to `OUT_DIR`. Needs `git`, `docker`, and network.
  Docker is used so no WASM toolchain has to be installed on the host.

Environment overrides: `OPENPGP_VERSION`, `HASH_WASM_VERSION`, and the `*_REPO`
variables.

## Verification result (OpenPGP.js)

`build-openpgp.sh` was run against the shipped bundle. The from-source output is
**byte-identical to `vendor/openpgp/openpgp.min.js` except for two bytes** — the
build date stamped into the license banner (`OpenPGP.js v6.3.1 - <date>`). Both
files are 394,552 bytes; all code bytes match. This is strong provenance: the
committed bundle is exactly what building the pinned `v6.3.1` source produces.

To make the build bit-for-bit reproducible, set `SOURCE_DATE_EPOCH` before
running; the script then normalises the banner date to it:

```bash
SOURCE_DATE_EPOCH=$(git -C /path/to/openpgpjs log -1 --format=%ct v6.3.1) \
  vendor/from-source/build-openpgp.sh out/
```

## Reproducibility notes

- OpenPGP.js commits a lockfile (`package-lock.json`, lockfileVersion 3). Some
  npm versions reject it with `npm ci`; the script uses `npm install`, which
  honours it, and needs npm ≥ 10 (it falls back to `npx npm@10` on older hosts).
  OpenPGP's `prepare` script builds the bundle during install.
- The hash-wasm build has not been executed here (no Docker/wasm toolchain in the
  authoring environment); `build-hash-wasm.sh` is written against hash-wasm's
  documented Docker build and needs a run + verification on a machine with Docker.
- Treat any swap of the **shipped** files as a change that must be re-tested
  (OpenPGP encrypt/decrypt round trip, Argon2 known-answer vector) and re-hashed
  in `solutions/CipherSplat/integrity.json` and the `index.html` SRI attributes.

## How F-Droid uses this

The F-Droid recipe (see `android/README.md`) runs these scripts in a `prebuild`
step and copies the outputs over the vendored files before Gradle bundles the web
app into the APK. That makes the shipped Android crypto build-from-source and lets
the recipe drop any `Prebuilt` / `NonFreeAssets` note tied to the minified blobs.
