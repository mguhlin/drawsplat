# Browser support

VideoSplat's primary release tier is the current desktop versions of Chrome and
Edge. They support the local Canvas, Web Audio, MediaRecorder, IndexedDB, and
service-worker paths used by preview, autosave, optimization, and WebM export.

Current Firefox is a best-effort tier: project editing and browser-decodable media
work, but codec availability and `captureStream`/MediaRecorder combinations vary by
platform. Safari is a project-editing fallback tier; local WebM optimization and
composition export may be unavailable. The export preflight blocks unsupported
combinations before rendering.

Phone layouts provide Media, Preview, and Clip controls tabs. Import, image keying,
and reopening saved media are tested in Chrome, Firefox and WebKit emulation.
Physical mobile browsers remain outside the supported precision-editing tier;
long renders are vulnerable to operating-system
memory pressure and background-tab suspension. For production work, keep the tab
visible, connect power, and retain original media outside browser storage.

VideoSplat never installs codecs or sends media to a conversion service. A file that
the current browser cannot decode must be converted locally with another trusted
tool before import.

See [September 15 audit](BROWSER_AUDIT_2026-09-15.md) for tested versions, historical bug status, and physical-device limitations.
