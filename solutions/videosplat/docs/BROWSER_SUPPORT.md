# Browser support

VideoSplat's primary release tier is the current desktop versions of Chrome and
Edge. They support the local Canvas, Web Audio, MediaRecorder, IndexedDB, and
service-worker paths used by preview, autosave, optimization, and WebM export.

Current Firefox is a best-effort tier: project editing and browser-decodable media
work, but codec availability and `captureStream`/MediaRecorder combinations vary by
platform. Safari is a project-editing fallback tier; local WebM optimization and
composition export may be unavailable. The export preflight blocks unsupported
combinations before rendering.

Mobile browsers are not a supported precision-editing tier. The interface remains
readable on smaller screens, but long renders are vulnerable to operating-system
memory pressure and background-tab suspension. For production work, keep the tab
visible, connect power, and retain original media outside browser storage.

VideoSplat never installs codecs or sends media to a conversion service. A file that
the current browser cannot decode must be converted locally with another trusted
tool before import.
