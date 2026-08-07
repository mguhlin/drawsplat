# CipherSplat Android / F-Droid — pickup guide

Status as of this writing: the Android app **scaffold** and the **from-source
crypto build tooling** are merged to `main`. What remains needs a machine with a
build toolchain (the authoring environment had no Android SDK and no Docker).

This guide is written so a fresh session — including **Claude CoWork on a
Windows 11 machine with Docker** — can finish the job. Short answer to "can I do
the rest there?": **yes**, with the setup below. Do the heavy Linux-style steps
(Docker, Gradle, adb) inside **WSL2**; it avoids Windows path/volume-mount pain.

---

## What's already done (on `main`)

- `android/` — Kotlin WebView app. No `INTERNET` permission. `WebViewAssetLoader`
  serves the bundled web app from a secure origin. Download bridge + file chooser
  wired. Gradle `copyCipherSplat` task bundles `../solutions/CipherSplat` at
  build time. Adaptive icon, F-Droid fastlane metadata.
- `vendor/from-source/build-openpgp.sh` — **verified**: reproduces the shipped
  `openpgp.min.js` byte-for-byte except the banner date.
- `vendor/from-source/build-hash-wasm.sh` — written, **not yet run** (needs
  Docker).
- `vendor/from-source/README.md`, `android/README.md` — provenance + F-Droid recipe.

## What's left (the checklist)

1. Build + verify the hash-wasm Argon2 WASM from source (Docker).
2. Build the APK.
3. On-device / emulator smoke test.
4. Tag `v1.0.2-android` and prepare the fdroiddata recipe.
5. Resolve the F-Droid buildserver "no Docker" constraint for the wasm.

---

## 0. One-time environment setup (Windows 11)

Recommended: **WSL2 (Ubuntu)** + **Docker Desktop** with WSL integration enabled.

Inside the Ubuntu (WSL2) shell:

```bash
sudo apt update
sudo apt install -y git curl unzip zip openjdk-17-jdk
# Node 20 (for the OpenPGP build):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
# Android command-line tools (or install Android Studio on Windows and point to it):
#   https://developer.android.com/studio#command-line-tools-only
# Unzip to ~/Android/cmdline-tools/latest, then:
yes | ~/Android/cmdline-tools/latest/bin/sdkmanager --licenses
~/Android/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
export ANDROID_HOME=$HOME/Android
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

Verify Docker from WSL: `docker run --rm hello-world`.

Clone the repo inside the WSL filesystem (not `/mnt/c/...`) for speed:
`git clone https://github.com/mguhlin/drawsplat.git`.

> If you skip WSL and use Git Bash/PowerShell natively: Docker Desktop still
> works, but `build-hash-wasm.sh`'s `-v "$PWD":/app` mount needs
> `MSYS_NO_PATHCONV=1` in Git Bash, and Gradle needs `ANDROID_HOME` set as a
> Windows env var. WSL2 is the path of least resistance.

---

## 1. Rebuild the Argon2 WASM from source (Docker)

```bash
cd drawsplat
vendor/from-source/build-hash-wasm.sh /tmp/hw
# Compare against the shipped bundle:
sha256sum /tmp/hw/argon2.umd.min.js solutions/CipherSplat/vendor/hash-wasm/argon2.umd.min.js
```

Expected outcomes and how to react:

- **Script runs but npm script names differ.** hash-wasm has used `compile` /
  `build:wasm` / `build` across versions. If the `docker run ... npm run compile`
  step fails with "missing script", open `package.json` in the cloned repo and
  update the command in `build-hash-wasm.sh` to match that tag (v4.12.0), then
  re-run.
- **Output differs from the shipped file.** Likely only an embedded build date or
  wasm-opt version. Diff them (`cmp -l`) to confirm the delta is cosmetic like it
  was for OpenPGP. If the wasm bytes themselves differ, pin the exact
  clang/wasi-sdk/binaryen versions in the Dockerfile so the compile is
  deterministic.
- If it reproduces (modulo a datestamp), you've cleared the last real F-Droid
  blocker. Record the result in `vendor/from-source/README.md`.

Also sanity-check OpenPGP on this machine (should still be byte-identical
except the banner date):

```bash
vendor/from-source/build-openpgp.sh /tmp/opgp
cmp -l /tmp/opgp/openpgp.min.js solutions/CipherSplat/vendor/openpgp/openpgp.min.js | head
```

## 2. Build the APK

```bash
cd android
gradle wrapper --gradle-version 8.9   # one-time: generates gradlew + wrapper jar
./gradlew --warning-mode all assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

First build will flush out anything I couldn't catch without a compiler. Likely
touch-ups if any: dependency versions in `app/build.gradle.kts`, an unused
import in `MainActivity.kt`, or the `merge*Assets` task wiring for
`copyCipherSplat`. Fix, rebuild, commit.

## 3. On-device / emulator smoke test

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Test matrix (this is the real acceptance gate):

- [ ] App launches; UI renders; **Airplane mode on** the whole time (proves no network needed).
- [ ] Password vault: encrypt a file → it lands in **Downloads** as `.csplat`.
- [ ] Decrypt that `.csplat` back → bytes match the original.
- [ ] Text vault: encrypt → copy result; decrypt the text back.
- [ ] Argon2 timing feels right (a second or two), i.e. the worker or main-thread fallback ran.
- [ ] OpenPGP: encrypt to a public key; decrypt with the private key + passphrase.
- [ ] Rotate the screen mid-session — state is preserved (configChanges handles it).
- [ ] Confirm in app info that it has **no permissions**.

Known limitation to expect: **folder selection** for encryption isn't offered
(Android's file chooser can't pick a directory). Folder *restore* still works via
individual downloads.

## 4. Tag + fdroiddata recipe

```bash
git tag v1.0.2-android && git push origin v1.0.2-android
```

Then submit to F-Droid's `fdroiddata` repo (a merge request there, not this repo)
using the recipe in `android/README.md`. Reproducible-builds verification is
enabled by the `SOURCE_DATE_EPOCH` handling in the OpenPGP build; do the
equivalent date-normalization for the wasm if step 1 shows a datestamp delta.

## 5. The F-Droid buildserver "no Docker" reality

F-Droid's builders don't run Docker, so the `build-hash-wasm.sh` Docker path is
for **local verification**, not the official build. For the actual recipe, pick one:

- **(a) Toolchain via `sudo` in the recipe** — install wasi-sdk + clang + binaryen
  through the recipe's `sudo:` block and invoke hash-wasm's compile directly
  (no Docker). More work but fully "from source" on their builder.
- **(b) Commit the wasm with provenance** — keep the vendored `argon2.umd.min.js`
  but document (in `vendor/from-source/README.md`) the exact reproduction command
  and the hash you got locally, and accept F-Droid's `Prebuilt`/binary note for
  that one file. Common and acceptable for many apps.

Recommend (a) if F-Droid asks for it during review; otherwise ship with (b) and
the OpenPGP-from-source build, which already covers the larger dependency.

---

## Handy references

- App shell + design rationale: `android/README.md`
- Crypto build scripts + provenance: `vendor/from-source/README.md`
- Web app source of truth: `solutions/CipherSplat/`
- Open web hardening context: `solutions/CipherSplat/WEB-SECURITY-ASSESSMENT-2026-08-01.md`
