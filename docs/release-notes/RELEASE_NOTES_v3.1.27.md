# DrawSplat v3.1.27 — Reliable local startup

September 24, 2026. All thirteen self-host packages are refreshed.

- PDFSplat now supports opening its extracted HTML directly in tested desktop Chrome and Firefox. A bundled classic script avoids file-origin module blocking, and PDF.js rendering and encryption use local fallbacks where workers cannot load.
- CipherSplat's dedicated offline ZIP includes its missing shared menu/language files, matching integrity metadata, and a local-server alternative.
- Every package includes START-HERE.html, START-WINDOWS.bat, START-MAC.command, start-local.sh, and a Python-standard-library local server. Python 3 must be installed before offline use. The server listens only on 127.0.0.1 and uses a stable app-specific address to preserve browser storage.
- Smaller package catalogs and launchers list only bundled apps; links to other site pages are marked as online. Missing catalog images are included.
- Apps that need a web origin explain the launcher when opened directly from disk. Keep all extracted folders together.
- The download page retains clear package groupings, standalone PDFSplat, measured ZIP/unpacked sizes, and the VideoSplat recording fixes from v3.1.26.

Local editing does not require internet access. Online sharing, external links, and first-time speech-model downloads still require a connection; recording/capture remain subject to browser/device permissions. Browser-offline tests and package-startup checks cover the documented workflows, not every feature or operating-system shell association. Windows/macOS launchers are supplied; the automated launch tests run Python on Linux.
