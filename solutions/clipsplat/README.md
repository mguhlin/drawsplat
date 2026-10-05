# ClipSplat™

A focused, private short-video recorder for Instagram: camera or local import → trim → opening/closing panels → MP4. No account or Instagram API is required. Upload the resulting file manually, or use your device's share sheet when available.

| Preset | Output | ClipSplat duration limit, including panels |
| --- | --- | --- |
| Reel | 1080 × 1920, 9:16 | 3–180 seconds |
| Story | 1080 × 1920, 9:16 | 3–60 seconds |
| Feed portrait | 1080 × 1350, 4:5 | 3–180 seconds |

All exports use MP4, H.264/yuv420p, 30 fps, square pixels, AAC stereo at 48 kHz/128 kbps, and fast-start metadata. Silent sources receive silence so all segments have compatible tracks. Panels last 0–10 seconds (0 skips). Framing supports full-image fit or center crop. The safe-area guide is approximate.

These are conservative app limits, not Instagram's full account-dependent maximums. Sources are limited to 200 MB; final MP4s to 300 MB. Encoding runs on the device after downloading the local encoder. Keep the tab open during export. Save original recordings before closing; there is no autosave.

## Development and hosting

Node 20.19+: `npm install --no-bin-links`, then `npm run build`. The flag supports filesystems without symlinks. The build publishes HTML and assets into this directory; commit them for static deployment. `npm test` validates trim/duration/framing rules. Serve the repository root for browser export tests. With the root Playwright dependency installed, run `node tests/browser.cjs` from this directory; set `CLIPSPLAT_ORIGIN=https://drawsplat.org` to repeat against production.

The encoder reuses VideoSplat's existing shared engine at `/solutions/mediasplat/ffmpeg/ffmpeg-core.js` and `ffmpeg-core.part-01`/`ffmpeg-core.part-02`. Self-hosting requires those files at those paths. No VideoSplat editor, timeline, caption models or persistence is imported. Camera and microphone require HTTPS or localhost.

Browser checks cover camera/microphone recording, actual MP4 exports with/without source audio, Reel/feed dimensions, skipped panels, cancellation/retry, trim limits and mobile layout. Native ffprobe verifies codecs, dimensions, frame rate and audio. Upload into an Instagram account is not automated or tested.

## Name and sources — October 5, 2026

- [Meta branding guidelines](https://www.meta.com/brand/resources/instagram/instagram-brand/) prohibit combining “Insta” or “gram” with another brand. The user selected ClipSplat instead. Instagram is used descriptively; no Meta logos or endorsement are implied.
- The name is not unique: [CLIPSplat](https://doi.org/10.1117/1.JEI.35.2.023043) is a published 3D Gaussian-splatting research method. An exact-name search did not surface an Instagram video creator. This is not trademark clearance.
- [Instagram aspect ratio help](https://help.instagram.com/1038071743007909), which rate-limited automated access.
- [Meta's Reels publishing sample](https://github.com/fbsamples/reels_publishing_apis/tree/main/insta_reels_publishing_api_sample): recommends 9:16, H.264/HEVC and AAC up to 48 kHz. API limits and account upload limits may differ.

## License and credits

AGPL-3.0-or-later; see the repository LICENSE. The local recording/encoding approach adapts DrawSplat's VideoSplat design. Browser APIs provide capture and canvas panels. [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm) provides the MIT-licensed worker bridge. The existing shared core includes [FFmpeg](https://ffmpeg.org) and libx264 (GPL). [Vite](https://github.com/vitejs/vite) is MIT-licensed build tooling. The icon is an original SVG.

## Preliminary U.S. trademark search — October 5, 2026

Direct searches in the [USPTO trademark database](https://tmsearch.uspto.gov/) returned no live or dead results for `CM:"clipsplat"`, `CM:"clip splat"`, `CM:"clip-splat"`, and `CM:/clip.*splat/`. A broad SPLAT search in software and related classes found other marks. In particular, [SPLAT, serial 88478014 / registration 6022371](https://tsdr.uspto.gov/#caseNumber=88478014&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch) is active, owned by RightSize Business Systems, and covers downloadable school attendance/recognition software (class 009) and associated web software (class 042). The TSDR record was checked directly. The existing CLIPSplat research use also remains relevant to a broader search.

This is a preliminary U.S. federal search, not clearance or a conclusion about confusing similarity. State, foreign, common-law, logo and comprehensive phonetic searches are outside this check. USPTO explains the limits of federal searches in its [clearance guidance](https://www.uspto.gov/trademarks/search/comprehensive-clearance-search-similar-trademarks). The user requested the ™ display, which claims a brand name without representing it as federally registered; no ® is used and no registration application has been filed. See [USPTO's trademark symbol guidance](https://www.uspto.gov/trademarks/basics/what-trademark).

## Languages and brand

The interface uses DrawSplat's purple/gold/lavender palette and a purple paint-splat video icon. The native language switcher provides English, Spanish, Vietnamese, Arabic (RTL), Chinese, and the site's combined Hindi/Urdu choice. It shares the `drawsplat.language` preference with the other tools and works when browser storage is unavailable. Switching languages translates controls, status messages, duration validation, format notes, and untouched default panel titles; edited titles and creator names are preserved. Language changes are disabled during recording/export so the composition cannot change partway through.

`node tests/language.cjs` checks branding, six locales, Arabic layout, preference persistence, and preservation of typed titles. Set `CLIPSPLAT_ORIGIN` to run against production.
