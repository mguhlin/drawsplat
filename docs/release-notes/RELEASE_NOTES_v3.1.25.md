# DrawSplat v3.1.25 — Current downloads for every package

Released September 18, 2026.

All twelve self-host ZIPs are refreshed from the current repository. The package
version is independent of whiteboard v3.1.12 and individual app versions. Existing
v3.1.24 release assets remain unchanged for reproducible older installations.

## Whiteboard and saving

- Illustrated action-card menus with clear labels and descriptions, outside-click
  dismissal, visible core controls, and simpler coloring/dot-picture workflows.
- Teacher/student entry views, lesson tool settings, response guidance, searchable
  stamp trays including chemistry models, and built-in lesson starter layouts.
- Audio Play/Pause/Stop, optional short video notes, teacher-controlled student
  video recording, and device-local stopped recording recovery (normally 24 hours).
- Private MySQL **Save online / Open online board**, account-scoped access and
  revision conflict protection. The same Node.js 22 API deploys to Railway,
  DigitalOcean, or an existing MySQL 8 server, with verified TLS, migrations,
  UTC sessions, and backup instructions.

MySQL requires a separately deployed API/database. Saving is explicit, not automatic
collaboration. Google shared rooms, galleries, moderation, and turn-in/review are
not routed to MySQL. Student accounts must be school-provisioned. Advanced district
modules require separate integration and operational validation.

## Other included app updates

Applicable packages include browser-local PDF camera/photo scanning and export
improvements; ImageSplat and VideoSplat green-screen removal; layered green-screen
studio; and recent AudioSplat, VideoSplat, and MediaSplat recording, duration,
cancellation, and startup fixes. Subtitle generation and export progress from
v3.1.24 remain included. Apps still depend on browser support and their documented
runtime/model requirements.

## Downloads

- DrawSplat full package (static site, whiteboard, backends, guides)
- SplatWorks suite and individual GridSplat, ShowSplat, WriteSplat, ListSplat packages
- Tools, Widgets, and Games modules
- Independent AudioSplat, VideoSplat, and MediaSplat packages

The full DrawSplat package keeps SplatWorks apps as separate drop-in downloads.
All twelve ZIPs have SHA-256 hashes in `SHA256SUMS-v3.1.25.txt`. Preserve project
files and database backups, finish recordings/exports, then replace matching
package files while retaining server-only configuration. Do not mix old shared
assets with newly installed modules.

Validation includes ZIP integrity, checksum verification, packaged entry-point
and runtime references, current whiteboard/MySQL assets and source provenance,
and desktop/mobile checks of release, blog, and download pages. See the learner
and backend guides for the underlying feature test coverage and limitations.
