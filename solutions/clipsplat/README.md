# ClipSplat™

A focused, private short-video recorder for Instagram: camera or local import → trim and cut → opening/closing panels → MP4. No account or Instagram API is required. Upload the resulting file manually, or use your device's share sheet when available.

| Preset | Output | ClipSplat duration limit, including panels |
| --- | --- | --- |
| Reel | 1080 × 1920, 9:16 | 3–180 seconds |
| Story | 1080 × 1920, 9:16 | 3–60 seconds |
| Feed portrait | 1080 × 1350, 4:5 | 3–3600 seconds |

All exports use MP4, H.264/yuv420p, 30 fps, square pixels, AAC stereo at 48 kHz/128 kbps, and fast-start metadata. Silent sources receive silence so all segments have compatible tracks. Panels last 0–10 seconds (0 skips). Each panel can include a local photo or logo above its title; images fit without cropping and appear in previews and exported MP4s. Use Add image to choose or replace, and Remove image to clear. Each panel also has its own frame picker: Plain, Paint Party (illustrated), Celestial Magic (illustrated), Botanical Garden (illustrated), Party confetti, Star sparkle, Paint splats or Movie night. The three illustrated frames were generated with the built-in imagegen tool and have genuine transparent centers. They download only when selected, retain proportional corner artwork in Reel and feed formats, and use a narrower content area to keep text/images clear of the ornate artwork. Original PNGs and the full generation prompts are in [artwork/README.md](artwork/README.md). Decorations stay around the edges to keep titles and images readable and are included in exported panels. Images are limited to 15 MB and 40 million pixels; they stay on your device and are not saved after leaving the page. Framing supports full-image fit or center crop. The safe-area guide is approximate.

These are conservative app limits, not Instagram's full account-dependent maximums. Sources and final MP4s are limited to 1 GB. Feed supports up to 60 minutes including panels; long recordings target 1.5 Mbps video plus 128 kbps audio. Feed exports longer than 3 minutes use a 2 Mbps video rate ceiling to control file size. Practical recording/export length depends on device memory; use a desktop browser for long projects. Encoding runs on the device after downloading the local encoder. Keep the tab open during export. Save original recordings before closing; there is no autosave.

## Additional image cards

Use step 4 to add one or several local images as standalone cards. Each card has an optional title, its own duration (0–10 seconds, 0 skips), background color and frame, with Preview, Replace image and Remove card controls. Insert at uses seconds of the remaining video, excluding panels and other cards. Images pause the video and its audio, then resume the footage; exported cards have silence. Same-position cards play in their list order. Cuts move cards with their original footage anchors, placing a card in a deleted section at the surviving join. Loading a new video retains the cards and clamps their anchors to the new source. Card durations count toward the output limit, and Playback order shows the inserted items. Images and projects remain local and are not automatically saved.

## Select and delete video sections

The timeline beneath the preview shows the remaining video between the opening and closing panels. Drag across the video track to highlight a section, or enter Selection start/end times, then use Delete selection. Click the track or use Preview position to scrub. Selection times refer to the edited video; each remaining segment shows its original source times. A cut deletes that section's video and audio together. Preview all and MP4 export follow the remaining segments in order, with both title panels included.

Undo restores the last cut; Reset cuts restores all deleted sections and can itself be undone. With the timeline focused, Delete/Backspace deletes the selection, Ctrl/Cmd+Z undoes, arrows scrub, and Escape clears selection. Cuts leave the original file unchanged and reset when a new video is loaded. Projects are not automatically saved. At least one video frame must remain; the usual minimum total length and placement limits still apply. This is a single video track with its original audio.

## Development and hosting

Node 20.19+: `npm install --no-bin-links`, then `npm run build`. The flag supports filesystems without symlinks. The build publishes HTML and assets into this directory; commit them for static deployment. `npm test` validates trim/duration/framing rules. Serve the repository root for browser export tests. With the root Playwright dependency installed, run `node tests/browser.cjs`, `node tests/timeline.cjs`, `node tests/frames.cjs`, `node tests/cards.cjs`, and `node tests/illustrated-frames.cjs` from this directory; set `CLIPSPLAT_ORIGIN=https://drawsplat.org` to repeat against production.

The encoder reuses VideoSplat's existing shared engine at `/solutions/mediasplat/ffmpeg/ffmpeg-core.js` and `ffmpeg-core.part-01`/`ffmpeg-core.part-02`. Self-hosting requires those files at those paths. No VideoSplat editor, timeline, caption models or persistence is imported. Camera and microphone require HTTPS or localhost.

Browser checks cover camera/microphone recording, actual MP4 exports with/without source audio, Reel/feed dimensions, skipped panels, cancellation/retry, trim limits and mobile layout. Timeline checks verify drag/numeric/keyboard selection, repeated cuts across joins, undo/reset, scrubbing and repeated playback, original import reset, and the actual colors and audio tones surviving in the exported MP4. Native ffprobe verifies codecs, dimensions, frame rate and audio. Upload into an Instagram account is not automated or tested.

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

Set `CLIPSPLAT_ILLUSTRATED=1` when running `tests/cards.cjs` or `tests/timeline.cjs` to verify generated artwork in actual MP4 exports. The illustrated-frame browser check also verifies lazy loading, caching, transparent centers, proportional Reel/feed layouts, and protection of the content area.
