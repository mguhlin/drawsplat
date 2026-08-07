# CipherSplat for Android

A minimal, offline-only native shell around the CipherSplat web app. It loads the
same code that ships at `/solutions/CipherSplat` inside a `WebView`, served from a
secure in-app origin so Web Crypto, Web Workers, Subresource Integrity, and the
strict Content-Security-Policy all work exactly as they do on the website.

## Design

- **No network, by construction.** The app declares **no** `INTERNET` permission,
  so the WebView cannot make any request. "Your data never leaves the device"
  becomes an OS-enforced guarantee, not a promise.
- **Secure local origin.** `WebViewAssetLoader` serves the bundled files from
  `https://appassets.androidplatform.net/`. That is a *secure context*, which is
  what `crypto.subtle`, Workers, and SRI require. `file://` (which mobile
  browsers handle poorly, and which breaks SRI) is avoided entirely.
- **Single source of truth.** The web app is **not** duplicated here. A Gradle
  `Copy` task (`copyCipherSplat` in `app/build.gradle.kts`) bundles
  `../solutions/CipherSplat` into the APK assets at build time.
- **Downloads without a network channel.** A tiny document-start script captures
  blobs at `URL.createObjectURL` time and hands the bytes to a Kotlin bridge,
  which writes them to the shared **Downloads** folder via `MediaStore` (no
  storage permission on Android 10+). It never calls `fetch()`/`XHR`, so it stays
  compatible with the app's `connect-src 'none'` policy.
- **File picking.** `<input type="file">` is wired to the Storage Access
  Framework (`ACTION_OPEN_DOCUMENT`). Folder *selection* (`webkitdirectory`) is
  not supported by the Android file chooser; folder *restore* falls back to
  individual file downloads, which the web app already handles.

## Build

Requires the Android SDK (compileSdk 34) and JDK 17.

```bash
cd android
# One-time: generate the Gradle wrapper jar/scripts (not committed).
gradle wrapper --gradle-version 8.9
./gradlew assembleRelease   # or assembleDebug
```

The unsigned release APK lands in `app/build/outputs/apk/release/`.

`minSdk` is 29 (Android 10) so the app needs zero runtime permissions.

## F-Droid packaging notes

Licensing is clean: the app and web code are **AGPL-3.0-or-later**; `hash-wasm`
is MIT; OpenPGP.js is LGPL-3.0+. The app pulls in only `androidx.activity` and
`androidx.webkit`.

The one item reviewers will scrutinise is that `vendor/hash-wasm/argon2.umd.min.js`
embeds a **prebuilt WebAssembly blob** and `vendor/openpgp/openpgp.min.js` is
minified. F-Droid prefers building such artifacts from source in the pipeline.
Either add a build step that compiles hash-wasm's Argon2 WASM and bundles
OpenPGP.js from source, or expect the app to carry a `Prebuilt` note until that
is wired up.

A starting point for `fdroiddata/metadata/org.drawsplat.ciphersplat.yml`:

```yaml
Categories:
  - Security
License: AGPL-3.0-or-later
AuthorName: DrawSplat
SourceCode: https://github.com/mguhlin/drawsplat
IssueTracker: https://github.com/mguhlin/drawsplat/issues

RepoType: git
Repo: https://github.com/mguhlin/drawsplat.git

Builds:
  - versionName: 1.0.2
    versionCode: 1
    commit: v1.0.2-android
    subdir: android/app
    gradle:
      - yes

AutoUpdateMode: Version v%v-android
UpdateCheckMode: Tags ^v[0-9.]+-android$
```

## Status

First working scaffold. Needs a build + on-device pass with the Android SDK
(encrypt/decrypt a file, save to Downloads, OpenPGP round trip) before release,
plus the from-source crypto-dependency work above for a clean F-Droid inclusion.
