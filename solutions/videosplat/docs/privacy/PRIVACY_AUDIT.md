# VideoSplat Privacy Audit

Status: milestone 1 baseline. Update this document whenever runtime behavior changes.

## Current data flow

- User project manifests are stored in the `videosplat-local` IndexedDB database, in the
  `projects` object store. User-selected media blobs are stored in the `media`
  object store under random project asset identifiers.
- Portable `.videosplat.json` files are created only when the user chooses **Save copy**.
- Media import uses local Blob URLs, browser decoders, Canvas, Web Audio, and Web
  Crypto. Video/image thumbnails, audio waveform peaks, metadata, and SHA-256
  content hashes are generated locally. No imported bytes are sent over a network.
- The optional optimizer decodes the user-selected video into a local canvas and
  records a smaller WebM copy through `MediaRecorder`. Audio, when supported, is
  routed through a local Web Audio graph. The result remains a Blob until the user
  downloads it or explicitly adds it to the project.
- Optional MLT XML import and export is parsed and generated locally. Remote, data,
  and executable resource URLs found in MLT producers are blocked rather than
  fetched; imported local media references must be relinked by the user.
- No camera, microphone, screen capture, cloud provider, analytics, advertising,
  telemetry, authentication, or remote inference exists yet.
- No cookies or `localStorage` keys are used.
- The service worker caches same-origin application shell resources for offline use.
- File access happens only after picker, drag/drop, or relink actions. The app
  requests no camera, microphone, screen, location, notification, or account
  permissions.

## Network inventory

Production runtime requests are limited to same-origin application assets and
navigation. The Content Security Policy sets `connect-src 'self'`. An end-to-end
test records requests and fails if a different hostname is observed.

Development mode connects to the same-origin Vite development server for hot reload.

## User controls

- **Save copy** exports the active manifest. It intentionally does not embed source
  media; a reopened manifest reconnects browser-stored media or asks for originals.
- **Open** imports a manifest or restores an autosave.
- **Privacy & device storage** reports capabilities, approximate usage/quota, and
  clears all locally autosaved projects and media after confirmation.
- Browser site-data controls can also remove IndexedDB and cached app resources.

## Known boundaries

Local-only does not protect content from the device owner, operating system,
browser extensions, malware, screen capture, or a compromised hosting origin. VideoSplat
does not claim legal compliance or infallible anonymization.
